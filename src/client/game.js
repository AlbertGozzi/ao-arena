// Socket IO
let socket = io();

// Main Code
let canvas = document.getElementById('canvas');
let context = canvas.getContext('2d');

// Reset size of canvas
const updateCanvas = () => {
  canvas.width = document.documentElement.clientWidth * 0.75;
  canvas.height = document.documentElement.clientHeight * 0.75;
};
updateCanvas();

// Update movement on A, S, W, D
let movement = {
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


// Print to game console
let gameConsole = document.querySelector('#game-console');
let gameConsoleNumMessages = Math.floor(gameConsole.clientHeight / 18); // TODO replace for font size
let gameConsoleUlArray = [];

const drawConsoleLog = () => {
  gameConsole.innerHTML = "";
  gameConsoleUlArray.forEach((li) => {
    gameConsole.append(li);
  });
};

const gameConsoleLog = (message) => {
  let newLi = document.createElement('li');
  newLi.innerHTML = message;
  gameConsoleUlArray.push(newLi);
  if (gameConsoleUlArray.length > gameConsoleNumMessages) { gameConsoleUlArray.shift(); }
  drawConsoleLog();
};


// Load maps
let map = new Image ();
map.src = "/public/assets/14.png";
const drawMap = (deltaX, deltaY) => {
  let mapWidth = Math.floor(document.documentElement.clientWidth * 0.02) * 100;
  let mapHeight = mapWidth;
  context.drawImage(map, deltaX, deltaY, mapWidth, mapHeight);
};



// Send messages to server
socket.emit('new player');
setInterval(function() {
  // Pass movement
  socket.emit('movement', movement);
  // Reset movement
  movement = {
    up: false,
    down: false,
    left: false,
    right: false
  };
}, 1000 / 60 * 5 );

// Receive state from server and update
socket.on('state', function(players) {
  // Reset canvas
  context.clearRect(0, 0, canvas.width, canvas.height);
  updateCanvas();

  // Console logs
  function printMousePos(event) { console.log(`clientX: ${event.clientX} clientY: ${event.clientY}`); }
  document.addEventListener("click", printMousePos);

  // DOM Manipulation
  drawConsoleLog();

  // Draw canvas
  // Define player size 
  let playerSize = Math.floor(document.documentElement.clientWidth * 0.02);

  // Get player position
  let playerX = players[socket.id] ? players[socket.id].x : 0; 
  let playerY = players[socket.id] ? players[socket.id].y : 0;
  let deltaX = canvas.width / 2 - playerX;
  let deltaY = canvas.height / 2 - playerY;

  // Draw map
  drawMap(deltaX, deltaY);

  // Draw players
  context.fillStyle = 'red';
  for (let id in players) {
    let player = players[id];
    // console.log(`X: ${player.x}, Y: ${player.y}`);
    let playerWidth = playerSize;
    let playerHeight = playerSize;;
    context.fillRect(player.x + deltaX - playerWidth / 2, player.y + deltaY - playerHeight / 2, playerWidth, playerHeight);
  }
});