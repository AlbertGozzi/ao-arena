// Dependencies
var express = require('express');
var http = require('http');
var path = require('path');
var socketIO = require('socket.io');

// Renaming
var app = express();
var server = http.Server(app);
var io = socketIO(server);

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

// Main Code
loadServer();
var players = {};

// Send message to client
setInterval(function() {
    io.sockets.emit('state', players);
  }, 1000 / 60);
  
// Respond to messages
io.on('connection', function(socket) {
  socket.on('new player', function() {
    players[socket.id] = {
      x: 300,
      y: 300
    };
  });

  socket.on('movement', function(data) {
    var player = players[socket.id] || {};
    if (data.left) { player.x -= 5; }    
    if (data.up) { player.y -= 5; } 
    if (data.right) { player.x += 5; } 
    if (data.down) { player.y += 5; }
  });
});