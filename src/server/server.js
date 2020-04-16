// Dependencies
let express = require('express');
let http = require('http');
let path = require('path');
let socketIO = require('socket.io');
let fs = require('fs');
let axios = require('axios');

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
const MAP_NUMBER = 14;
const TEAMS = ['red', 'blue']; // Visuals might now work properly with more than three teams

// Constants (just for server)
const PLAYER_INITIAL_HEALTH = 100;
const PLAYER_ATTACK_DAMAGE = 30;
const PLAYER_INITIAL_MANA = 50;
const SPELL_MANA = 25;
const MANA_INCREMENT = 10;
const MANA_INCREMENT_TIME_MS = 3000;

// // Derived from constants
let minY = Math.ceil(CANVAS_WIDTH_PCT_CLIENTS / PLAYER_PERCENTAGE_CLIENT_SIZE * CANVAS_HEIGHT_PCT_WIDTH / 2);
let maxY = MAP_SIZE_TILES - minY;
let minX = Math.ceil(CANVAS_WIDTH_PCT_CLIENTS / PLAYER_PERCENTAGE_CLIENT_SIZE / 2);
let maxX = MAP_SIZE_TILES - minX;

// Class Definitions
class Player {
  constructor(playerName, socketId) {
    // Name
    this.name = playerName;

    // Socket Id
    this.socketId = socketId;

    // Team
    this.team = this.pickRandomTeam();

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
    this.gameConsoleArray = [];

    // In-game chat
    this.chatMessage = '';

    // Fighting
    this.initialHealth = PLAYER_INITIAL_HEALTH;
    this.health = PLAYER_INITIAL_HEALTH;

    this.initialMana = PLAYER_INITIAL_MANA;
    this.mana = PLAYER_INITIAL_MANA;
    this.spellDamage = PLAYER_ATTACK_DAMAGE;

    this.attackDamage = PLAYER_ATTACK_DAMAGE;

    // Stats
    this.kills = 0;
    this.deaths = 0;
  }

  pickRandomTeam() {
    // Intialize player count
    let numberPlayers = {};
    TEAMS.forEach((teamName) => numberPlayers[teamName] = 0);

    // Count players in each team
    for (const socketId in gameState.players) {
      numberPlayers[gameState.players[socketId].team] += 1; 
    }

    // console.log(numberPlayers);

    // Get team with lowest players
    let teamsWithFewerPlayers = [];
    let playerMinimum = Infinity;
    TEAMS.forEach((teamName) => {
      // console.log(`Team ${teamName} Number: ${numberPlayers[teamName]}`);
      switch (true) {
        case (numberPlayers[teamName] > playerMinimum): break;
        case (numberPlayers[teamName] === playerMinimum): teamsWithFewerPlayers.push(teamName); break;
        case (numberPlayers[teamName] < playerMinimum): 
          teamsWithFewerPlayers = []; 
          teamsWithFewerPlayers.push(teamName);
          playerMinimum = numberPlayers[teamName];
          break;
        default:
          break;
      }
    });

    // console.log(teamsWithFewerPlayers);

    // Assign to random selection of lower players teams
    let randomTeamIndex = Math.floor(Math.random() * teamsWithFewerPlayers.length);
    let randomTeam = teamsWithFewerPlayers[randomTeamIndex];

    return randomTeam;
  }

  positionRandomly(player) {
    let position = randomPosition(player);
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

      // Prevent you from attacking someone from your same team
      if (targetPlayer.team === this.team) {
        this.gameConsoleLog(`You're trying to attack ${targetPlayer.name}, who is in your same team. You can't do that!`);
        return;
      }

      let attackDamage = Math.floor(this.attackDamage * randomAttackCoefficient);
      targetPlayer.health -= attackDamage;

      // If death, respawn
      if (targetPlayer.health <= 0) {
        targetPlayer.gameConsoleLog(`${this.name} attacked you and caused ${attackDamage} points of damage. You're dead!`);
        this.gameConsoleLog(`You attacked ${targetPlayer.name} and caused ${attackDamage} points of damage. You killed him/her!`);

        // Respawn
        gameState.map.reset(targetPlayer);
        targetPlayer.positionRandomly(targetPlayer);
        gameState.map.update(targetPlayer);
        targetPlayer.health = PLAYER_INITIAL_HEALTH;
        
        // Update stats
        targetPlayer.deaths++;
        this.kills++;
      } else {
        this.gameConsoleLog(`You attacked ${targetPlayer.name} and caused ${attackDamage} points of damage.`);
        targetPlayer.gameConsoleLog(`${this.name} attacked you and caused ${attackDamage} points of damage. Your health is now ${targetPlayer.health}`);  
      }
    }
  }

  castSpell(x, y) {
    // console.log(`Casting spell from ${this.name} on x: ${x} y: ${y}`);
    let targetPlayerId = gameState.map.playerIds[x][y];
    // console.log(gameState.players[targetPlayerId]);

    // Only attack if you're attacking someone and you're alive
    if (targetPlayerId !== null && this.health > 0) {
      let targetPlayer = gameState.players[targetPlayerId];
      let randomAttackCoefficient = 0.8 + Math.random() * 0.4;

      // Prevent you from attacking someone from your same team
      if (targetPlayer.team === this.team) {
        this.gameConsoleLog(`You're trying to cast a spell on ${targetPlayer.name}, who is in your same team. You can't do that!`);
        return;
      }

      // Prevent you from attacking if you don't have enough mana
      if (this.mana < SPELL_MANA) {
        this.gameConsoleLog(`You don't have enough mana to attack cast a spell!`);
        return;
      }

      let spellDamage = Math.floor(this.spellDamage * randomAttackCoefficient);
      targetPlayer.health -= spellDamage;
      this.mana -= SPELL_MANA;

      // If death, respawn
      if (targetPlayer.health <= 0) {
        targetPlayer.gameConsoleLog(`${this.name} casted a spell on you and caused ${spellDamage} points of damage. You're dead!`);
        this.gameConsoleLog(`You casted a spell on ${targetPlayer.name} and caused ${spellDamage} points of damage. You killed him/her!`);

        // Respawn
        gameState.map.reset(targetPlayer);
        targetPlayer.positionRandomly(targetPlayer);
        gameState.map.update(targetPlayer);
        targetPlayer.health = PLAYER_INITIAL_HEALTH;
        
        // Update stats
        targetPlayer.deaths++;
        this.kills++;
      } else {
        this.gameConsoleLog(`You casted a spell on ${targetPlayer.name} and caused ${spellDamage} points of damage.`);
        targetPlayer.gameConsoleLog(`${this.name} casted a spell on you and caused ${spellDamage} points of damage. Your health is now ${targetPlayer.health}`);  
      }
    }
  }

  gameConsoleLog(message) {
    this.gameConsoleArray.push(message);
    if (this.gameConsoleArray.length > GAME_CONSOLE_MAX_MESSAGES) { this.gameConsoleArray.shift(); }
  }
}

class State {
  constructor() {
    this.players = {};
    this.map = {
      mapNumber : MAP_NUMBER,
      blockedPositions: new Array(MAP_SIZE_TILES+1).fill(0).map(() => new Array(MAP_SIZE_TILES+1).fill(false)),
      playerIds: new Array(MAP_SIZE_TILES+1).fill(0).map(() => new Array(MAP_SIZE_TILES+1).fill(null)),
      
      reset(player) {
        this.playerIds[player.x][player.y] = null;
        this.blockedPositions[player.x][player.y] = false;      
      },
      
      update(player) {
        this.playerIds[player.x][player.y] = player.socketId;
        this.blockedPositions[player.x][player.y] = true;     
      },

      loadMap() {
        const rawData = fs.readFileSync(`public/static/mapas/mapa_${MAP_NUMBER}.map`);
        let map = JSON.parse(rawData).tiles;
        for (let x = 1; x <= MAP_SIZE_TILES; x++) {
          for (let y = 1; y <= MAP_SIZE_TILES; y++) {
            if (map[x][y].blocked) { this.blockedPositions[x][y] = true;}
          }
        }
      }
    };
  }
}

const randomPosition = (player) => {
  let xCenter = MAP_SIZE_TILES / 2;
  let yCenter = MAP_SIZE_TILES / 2;
  let diagonalDistanceFromCenter = 2;

  let numberTeams = TEAMS.length;
  let radians = 2 * Math.PI;

  let angleTeam = TEAMS.indexOf(player.team) * radians / numberTeams;

  let xCenterTeam = xCenter + Math.ceil(Math.sin(angleTeam) * diagonalDistanceFromCenter);
  let yCenterTeam = yCenter + Math.ceil(Math.cos(angleTeam) * diagonalDistanceFromCenter);
  
  let randomPos = {
    x: xCenterTeam - 3 + Math.ceil(Math.random() * 6),
    y: yCenterTeam - 3 + Math.ceil(Math.random() * 6)
  };
  if (!gameState.map.blockedPositions[randomPos.x][randomPos.y]) {
    return randomPos;
  } else {
    return randomPosition(player);
  }
};

// Execution code
loadServer();
let gameState = new State();
gameState.map.loadMap();

// Reload mana
setInterval(function() {
  for (const socketId in gameState.players) {
    let player = gameState.players[socketId]; 
    let playerMissingMana = PLAYER_INITIAL_MANA - player.mana; 
    player.mana += Math.min(MANA_INCREMENT, playerMissingMana);
    // console.log(`Name: ${player.name} X: ${player.x} Y: ${player.y}`);
  }
}, MANA_INCREMENT_TIME_MS);

// Interaction with database
// Save data
// const postData = () => {
//   axios.post('https://ironrest.herokuapp.com/argentum', {players: gameState.players}).then(resp => {
//     console.log(resp.data);
//   }) .catch(err => console.log(err))
// };
// postData();
// Get data
// const getData = () => {
//   axios.get('https://ironrest.herokuapp.com/argentum').then(resp => {
//     console.log(resp.data);
//   })
// };
// getData();


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
    player.positionRandomly(player);
    gameState.map.update(player);
    console.log(`Connected ${socket.id}`);
  });

  socket.on('new chat message', function(chatMessageInput) {
    let player = gameState.players[socket.id] || {};
    // Conditional to make sure you perform actions if there is a player
    if (gameState.players[socket.id]) {
      player.chatMessage = chatMessageInput;
    }    
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

  socket.on('cast spell', function(castedSpell) {
    let attackingPlayer = gameState.players[socket.id] || {};
    // Conditional to make sure you perform actions if there is a player and if it wants to attack
    if (castedSpell.active && gameState.players[socket.id]) { 
      attackingPlayer.castSpell(castedSpell.x, castedSpell.y);
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

