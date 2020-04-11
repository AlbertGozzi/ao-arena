// Socket IO
let socket = io();

// Constants (should be same as server.js)
const CANVAS_WIDTH_PCT_CLIENTS = 0.75;
const CANVAS_HEIGHT_PCT_WIDTH = 0.52;
const PLAYER_PERCENTAGE_CLIENT_SIZE = 0.02;
const MAP_SIZE_TILES = 100;

// Main Code
let canvas = document.getElementById('canvas');
let context = canvas.getContext('2d');

// Reset size of canvas
const updateCanvas = () => {
  canvas.width = document.documentElement.clientWidth * CANVAS_WIDTH_PCT_CLIENTS;
  canvas.height = canvas.width * CANVAS_HEIGHT_PCT_WIDTH;
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
  let mapWidth = document.documentElement.clientWidth * PLAYER_PERCENTAGE_CLIENT_SIZE * MAP_SIZE_TILES;
  let mapHeight = mapWidth;
  context.drawImage(map, deltaX, deltaY, mapWidth, mapHeight);
};


////////////////// Server <> Client //////////////////
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
socket.on('state', function(gameState) {
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
  let playerSize = document.documentElement.clientWidth * PLAYER_PERCENTAGE_CLIENT_SIZE;

  // Get player position
  let selfDisplayX = gameState.players[socket.id] ? gameState.players[socket.id].x * playerSize : 0; 
  let selfDisplayY = gameState.players[socket.id] ? gameState.players[socket.id].y * playerSize : 0;
  let deltaDisplayX = canvas.width / 2 - selfDisplayX;
  let deltaDisplayY = canvas.height / 2 - selfDisplayY;
  // console.log(`X: ${players[socket.id] ? players[socket.id].x : 0}, Y: ${players[socket.id] ? players[socket.id].y : 0}`);

  // Draw map
  drawMap(deltaDisplayX, deltaDisplayY);

  // Draw players
  context.fillStyle = 'red';
  for (let id in gameState.players) {
    let player = gameState.players[id];

    // Get display values
    let playerDisplayX = player.x * playerSize;
    let playerDisplayY = player.y * playerSize;
    let playerWidth = playerSize;
    let playerHeight = playerSize;

    // Draw
    context.fillRect(playerDisplayX + deltaDisplayX, playerDisplayY + deltaDisplayY, playerWidth, playerHeight);
  }
});