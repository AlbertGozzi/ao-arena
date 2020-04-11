// Dependencies
let express = require('express');
let http = require('http');
let path = require('path');
let socketIO = require('socket.io');

// Renaming
let app = express();
let server = http.Server(app);
let io = socketIO(server);

// Server
const loadServer = () => {
  // Set port for Heroku
  let port = process.env.PORT;
  if (port == null || port == "") {
    port = 5000;
  }
  app.set('port', port);

  app.use(express.static(path.join(__dirname, '../..')));

  // Routing
  app.get('/', function(request, response) {
      response.sendFile(path.join(__dirname, '../client/html/index.html'));
    });

  // Starts the server.
  server.listen(port, function() {
      console.log(`Starting server on port ${port}`);
  });
  // Add the WebSocket handlers
  io.on('connection', function(socket) {});
};

// Constants (should be same as game.js)
const CANVAS_WIDTH_PCT_CLIENTS = 0.75;
const CANVAS_HEIGHT_PCT_WIDTH = 0.55;
const PLAYER_PERCENTAGE_CLIENT_SIZE = 0.02;
const MAP_SIZE_TILES = 100;
const GAME_CONSOLE_MAX_MESSAGES = 7;

// Constants (just for server)
const PLAYER_INITIAL_HEALTH = 100;
const PLAYER_ATTACK_DAMAGE = 30;

// Derived from constants
let minX = Math.ceil(CANVAS_WIDTH_PCT_CLIENTS / PLAYER_PERCENTAGE_CLIENT_SIZE / 2);
let maxX = MAP_SIZE_TILES - minX;
let minY = Math.ceil(CANVAS_WIDTH_PCT_CLIENTS / PLAYER_PERCENTAGE_CLIENT_SIZE * CANVAS_HEIGHT_PCT_WIDTH / 2);
let maxY = MAP_SIZE_TILES - minY;


// Class Definitions
class Player {
  constructor() {
    // Name
    this.name = "Player";

    // Position
    this.x = MAP_SIZE_TILES / 2;
    this.y = MAP_SIZE_TILES / 2;
    this.potentialX = 0;
    this.potentialY = 0;

    // Movement and face direction
    this.facing = '';
    this.targetPosition = {
      x: 0,
      y: 0,
    };

    // In-game console messages
    this.gameConsoleLiArray = [];

    // Fighting
    this.health = PLAYER_INITIAL_HEALTH;
    this.attackDamage = PLAYER_ATTACK_DAMAGE;

    // Stats
    this.kills = 0;
    this.deaths = 0;
  }

  positionRandomly() {
    let position = {
      x: MAP_SIZE_TILES / 2 - 10 + Math.ceil(Math.random() * 20),
      y: MAP_SIZE_TILES / 2 - 10 + Math.ceil(Math.random() * 20)
    };
    this.x = position.x;
    this.y = position.y;
  }

  move(direction) {
    switch (true) {
      case (direction === 'left'):
        // Update face
        this.facing = 'left';

        // Generate target spot
        this.potentialX = this.x - 1;
        // Update position to target if not blocked
        if (this.x !== minX && !gameState.map.blockedPositions[this.potentialX][this.y]) {this.x = this.potentialX;}

        // Update target position
        this.targetPosition.x = this.x - 1;
        this.targetPosition.y = this.y;

        break;
      case (direction === 'right'):
        this.facing = 'right';
        this.potentialX = this.x + 1;
        if (this.x !== maxX && !gameState.map.blockedPositions[this.potentialX][this.y]) {this.x = this.potentialX;}
        // Update target position
        this.targetPosition.x = this.x + 1;
        this.targetPosition.y = this.y;
        break;
      case (direction === 'down'):
        this.facing = 'down';
        this.potentialY = this.y + 1;
        if (this.y !== maxY && !gameState.map.blockedPositions[this.x][this.potentialY]) {this.y = this.potentialY;}
        this.targetPosition.x = this.x;
        this.targetPosition.y = this.y + 1;
        break; 
      case (direction === 'up'):
        this.facing = 'up';
        this.potentialY = this.y - 1;
        if (this.y !== minY && !gameState.map.blockedPositions[this.x][this.potentialY]) {this.y = this.potentialY;}
        this.targetPosition.x = this.x;
        this.targetPosition.y = this.y - 1;
        break;
    }
  }

  attack() {
    let targetPlayerId = gameState.map.playerIds[this.targetPosition.x][this.targetPosition.y];
    if (targetPlayerId !== null) {
      let targetPlayer = gameState.players[targetPlayerId];
      let randomAttackCoefficient = 0.8 + Math.random() * 0.4;
      let attackDamage = Math.floor(this.attackDamage * randomAttackCoefficient);
      targetPlayer.health -= attackDamage;

      // If death, respawn
      if (targetPlayer.health <= 0) {
        targetPlayer.gameConsoleLog(`${this.name} attacked you and caused ${attackDamage} points of damage. You're dead!`);
        this.gameConsoleLog(`You attacked ${targetPlayer.name} and caused ${attackDamage} points of damage. You killed him/her!`);

        // Respawn
        targetPlayer.positionRandomly();
        targetPlayer.health = PLAYER_INITIAL_HEALTH;
        
        // Update stats
        targetPlayer.deaths++;
        this.kills++;
      } else {
        this.gameConsoleLog(`You attacked ${targetPlayer.name} and caused ${attackDamage} points of damage.`);
        targetPlayer.gameConsoleLog(`${this.name} attacked you and caused ${attackDamage} points of damage. New health = ${targetPlayer.health}`);  
      }
    }
  }

  gameConsoleLog(message) {
    this.gameConsoleLiArray.push(message);
    if (this.gameConsoleLiArray.length > GAME_CONSOLE_MAX_MESSAGES) { this.gameConsoleLiArray.shift(); }
  }
}

class State {
  constructor() {
    this.players = {};
    this.map = {
      blockedPositions: new Array(MAP_SIZE_TILES).fill(0).map(() => new Array(MAP_SIZE_TILES).fill(false)),
      playerIds: new Array(MAP_SIZE_TILES).fill(0).map(() => new Array(MAP_SIZE_TILES).fill(null))
    };
  }
}

// Execution code
loadServer();
let gameState = new State();

////////////////// Server <> Client //////////////////
// Send message to client
setInterval(function() {
    io.sockets.emit('state', gameState);
  }, 1000 / 60);
  
// Respond to messages
io.on('connection', function(socket) {
  socket.on('new player', function() {
    gameState.players[socket.id] = new Player();
    gameState.players[socket.id].positionRandomly();
    console.log(`Connected ${socket.id}`);
  });

  socket.on('movement', function(movement) {
    let player = gameState.players[socket.id] || {};
    // Conditional to make sure you perform actions if there is a player
    if (gameState.players[socket.id]) { 
      gameState.map.playerIds[player.x][player.y] = null;
      gameState.map.blockedPositions[player.x][player.y] = false;
      player.move(movement);
      gameState.map.playerIds[player.x][player.y] = socket.id;
      gameState.map.blockedPositions[player.x][player.y] = true;
    }    
  });

  socket.on('attack', function(attack) {
    let attackingPlayer = gameState.players[socket.id] || {};
    // Conditional to make sure you perform actions if there is a player and if it wants to attack
    if (attack && gameState.players[socket.id]) { 
      attackingPlayer.attack();
    }    
  });

  socket.on('disconnect', (reason) => {
    console.log(`Disconnected ${socket.id}`);
    delete gameState.players[socket.id];
  });

});