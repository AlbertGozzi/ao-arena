// Socket IO
var socket = io();

// Main Code
var canvas = document.getElementById('canvas');
var context = canvas.getContext('2d');
canvas.width = 800;
canvas.height = 600;

// class Player {
//   constructor() {
//     // Base
//     this.name = "Player";
//     this.x = 300;
//     this.y = 300;

//     // Movement state
//     this.up = false;
//     this.down = false;
//     this.left = false;
//     this.right = false;
//   }

//   moveLeft() {
//     this.x -= 5;
//   }

//   moveRight() {
//     this.x += 5;
//   }

//   moveDown() {
//     this.y -= 5;
//   }

//   moveUp() {
//     this.y += 5;
//   }
// }

var movement = {
    up: false,
    down: false,
    left: false,
    right: false
};

document.addEventListener('keydown', function(event) {
  switch (event.keyCode) {
      case 65: // A
      movement.left = true;
      break;
      case 87: // W
      movement.up = true;
      break;
      case 68: // D
      movement.right = true;
      break;
      case 83: // S
      movement.down = true;
      break;
  }   
});
document.addEventListener('keyup', function(event) {
  switch (event.keyCode) {
      case 65: // A
        movement.left = false;
        break;
      case 87: // W
        movement.up = false;
        break;
      case 68: // D
        movement.right = false;
        break;
      case 83: // S
        movement.down = false;
        break;
  }
});

// Send messages to server
socket.emit('new player');
setInterval(function() {
  socket.emit('movement', movement);
}, 1000 / 60);

// Receive state from server and update
socket.on('state', function(players) {
  // Reset canvas
  context.clearRect(0, 0, canvas.width, canvas.height);

  // Draw players
  context.fillStyle = 'green';
  for (var id in players) {
    var player = players[id];
    context.beginPath();
    context.arc(player.x, player.y, 10, 0, 2 * Math.PI);
    context.fill();
  }
});