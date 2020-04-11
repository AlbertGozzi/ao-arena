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

// Class Definitions
class Player {
  constructor() {
    // Base
    this.name = "Player";
    this.x = 315;
    this.y = 315;

    // Movement state
    this.movement = {
      up: false,
      down: false,
      left: false,
      right: false
    };
  }

  moveLeft() {
    this.x -= 30;
  }

  moveRight() {
    this.x += 30;
  }

  moveDown() {
    this.y += 30;
  }

  moveUp() {
    this.y -= 30;
  }
}

// Execution code
loadServer();
let players = {};

// Send message to client
setInterval(function() {
    io.sockets.emit('state', players);
  }, 1000 / 60);
  
// Respond to messages
io.on('connection', function(socket) {
  socket.on('new player', function() {
    players[socket.id] = new Player();
  });

  socket.on('movement', function(data) {
    let player = players[socket.id] || {};
    if (data.left) { player.moveLeft(); }    
    if (data.up) { player.moveUp(); } 
    if (data.right) { player.moveRight(); } 
    if (data.down) { player.moveDown(); }
  });
});