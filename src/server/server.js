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
const CANVAS_HEIGHT_PCT_WIDTH = 0.52;
const PLAYER_PERCENTAGE_CLIENT_SIZE = 0.02;
const MAP_SIZE_TILES = 100;

// Derived from constants
let minX = Math.ceil(CANVAS_WIDTH_PCT_CLIENTS / PLAYER_PERCENTAGE_CLIENT_SIZE / 2);
let maxX = MAP_SIZE_TILES - minX;
let minY = Math.ceil(CANVAS_WIDTH_PCT_CLIENTS / PLAYER_PERCENTAGE_CLIENT_SIZE * CANVAS_HEIGHT_PCT_WIDTH / 2);
let maxY = MAP_SIZE_TILES - minY;


// Class Definitions
class Player {
  constructor() {
    // Base
    this.name = "Player";
    this.x = MAP_SIZE_TILES / 2;
    this.y = MAP_SIZE_TILES / 2;

    // Movement state
    this.movement = {
      up: false,
      down: false,
      left: false,
      right: false
    };
  }

  moveLeft() {
    if (this.x !== minX) {this.x -= 1;}
  }

  moveRight() {
    if (this.x !== maxX) {this.x += 1;}
  }

  moveDown() {
    if (this.y !== maxY) {this.y += 1;}
  }

  moveUp() {
    if (this.y !== minY) {this.y -= 1;}
  }
}

class State {
  constructor() {
    this.players = {};
    this.map = {
      blockedPositions: new Array(MAP_SIZE_TILES).fill(0).map(() => new Array(MAP_SIZE_TILES).fill(false)),
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
  });

  socket.on('movement', function(data) {
    let player = gameState.players[socket.id] || {};
    if (data.left) { player.moveLeft(); }    
    if (data.up) { player.moveUp(); } 
    if (data.right) { player.moveRight(); } 
    if (data.down) { player.moveDown(); }
  });
});