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
const CANVAS_WIDTH_PCT_CLIENTS = 0.7;
const CANVAS_HEIGHT_PCT_WIDTH = 0.53;
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
  constructor(playerName, socketId) {
    // Name
    this.name = playerName;

    // Socket Id
    this.socketId = socketId;

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
    this.initialHealth = PLAYER_INITIAL_HEALTH;
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
    // Do nothing if no message
    if (direction === '') { return; }

    // Update face direction
    this.facing = direction;

    // Generate potential spot character will move to
    this.potentialX = this.x + ((direction === 'left') ? -1 : 0) + ((direction === 'right') ? 1 : 0);
    this.potentialY = this.y + ((direction === 'down') ? 1 : 0) + ((direction === 'up') ? -1 : 0);

    // List conditions to not move
    let outOfLimitsX = this.potentialX < minX || this.potentialX > maxX;
    let outOfLimitsY = this.potentialY < minY || this.potentialY > maxY; 
    let positionBlocked = gameState.map.blockedPositions[this.potentialX][this.potentialY];

    // If none happen, move!
    if (!outOfLimitsX && !outOfLimitsY && !positionBlocked) {
      this.x = this.potentialX;
      this.y = this.potentialY;
    }
    
    // Update target position regardless
    this.targetPosition.x = this.x + ((direction === 'left') ? -1 : 0) + ((direction === 'right') ? 1 : 0);
    this.targetPosition.y = this.y + ((direction === 'down') ? 1 : 0) + ((direction === 'up') ? -1 : 0);
  }

  attack() {
    let targetPlayerId = gameState.map.playerIds[this.targetPosition.x][this.targetPosition.y];
    // Only attack if you're attacking someone and you're alive
    if (targetPlayerId !== null && this.health > 0) {
      let targetPlayer = gameState.players[targetPlayerId];
      let randomAttackCoefficient = 0.8 + Math.random() * 0.4;
      let attackDamage = Math.floor(this.attackDamage * randomAttackCoefficient);
      targetPlayer.health -= attackDamage;

      // If death, respawn
      if (targetPlayer.health <= 0) {
        targetPlayer.gameConsoleLog(`${this.name} attacked you and caused ${attackDamage} points of damage. You're dead!`);
        this.gameConsoleLog(`You attacked ${targetPlayer.name} and caused ${attackDamage} points of damage. You killed him/her!`);

        // Respawn
        gameState.map.reset(targetPlayer);
        targetPlayer.positionRandomly();
        gameState.map.update(targetPlayer);
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
      playerIds: new Array(MAP_SIZE_TILES).fill(0).map(() => new Array(MAP_SIZE_TILES).fill(null)),
      
      reset(player) {
        this.playerIds[player.x][player.y] = null;
        this.blockedPositions[player.x][player.y] = false;      
      },
      
      update(player) {
        this.playerIds[player.x][player.y] = player.socketId;
        this.blockedPositions[player.x][player.y] = true;     
      }
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
  socket.on('new player', function(playerName) {
    gameState.players[socket.id] = new Player(playerName, socket.id);
    let player = gameState.players[socket.id];
    gameState.map.reset(player);
    player.positionRandomly();
    gameState.map.update(player);
    console.log(`Connected ${socket.id}`);
  });

  socket.on('movement', function(movement) {
    let player = gameState.players[socket.id] || {};
    // Conditional to make sure you perform actions if there is a player
    if (gameState.players[socket.id]) {
      gameState.map.reset(player);
      player.move(movement);
      gameState.map.update(player);
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
    let player = gameState.players[socket.id] || {};
    console.log(`Disconnected ${socket.id}`);
    if (gameState.players[socket.id]) {
      gameState.map.reset(player);
      delete gameState.players[socket.id];
    }
  });
});