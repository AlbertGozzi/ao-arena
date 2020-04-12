// Socket IO
let socket = io();

// Constants (should be same as server.js)
const CANVAS_WIDTH_PCT_CLIENTS = 0.7;
const CANVAS_HEIGHT_PCT_WIDTH = 0.53;
const PLAYER_PERCENTAGE_CLIENT_SIZE = 0.02;
const MAP_SIZE_TILES = 100;
const GAME_CONSOLE_MAX_MESSAGES = 7;
// let gameConsoleNumMessages = Math.floor(gameConsole.clientHeight / 18); // TODO replace for font size


// Main Code
let canvas = document.getElementById('canvas');
let context = canvas.getContext('2d');

// Reset size of canvas
const updateCanvas = () => {
  canvas.width = document.documentElement.clientWidth * CANVAS_WIDTH_PCT_CLIENTS;
  canvas.height = canvas.width * CANVAS_HEIGHT_PCT_WIDTH;
};
updateCanvas();

////////////////// Listen for inputs //////////////////
// Update movement on arrow keys
let movement = '';
document.addEventListener('keydown', (event) => {
  switch (event.keyCode) {
      case 37: movement = 'left'; break;
      case 38: movement = 'up'; break;
      case 39: movement = 'right'; break;
      case 40: movement = 'down'; break;
  }   
});

// Attack on ctrl
let attack = false;
document.addEventListener('keyup', (event) => {
  if (event.keyCode === 17) { attack = true; }
});

////////////////// Printing to in-game console //////////////////
// Print to game console
let gameConsole = document.querySelector('#game-console');
const drawConsoleLog = (player) => {
  gameConsole.innerHTML = "";
  player.gameConsoleLiArray.forEach((message) => {
    let newLi = document.createElement('li');
    newLi.innerHTML = message;
    gameConsole.append(newLi);
  });
};

////////////////// Asset Loading and Drawing //////////////////
// Load maps and define draw function
let map = new Image ();
map.src = "/public/assets/14.png";
const drawMap = (deltaX, deltaY) => {
  let mapWidth = document.documentElement.clientWidth * PLAYER_PERCENTAGE_CLIENT_SIZE * MAP_SIZE_TILES;
  let mapHeight = mapWidth;
  context.drawImage(map, deltaX, deltaY, mapWidth, mapHeight);
};

// Load player images and define draw function
let head = new Image ();
head.src = "/public/assets/2064.png";
const drawPlayer = (player, playerSize, deltaDisplayX, deltaDisplayY) => {
  // Get display values
  // Get x and y
  let playerDisplayX = player.x * playerSize + deltaDisplayX;
  let playerDisplayY = player.y * playerSize + deltaDisplayY;
  let playerWidth = playerSize;
  let playerHeight = playerSize;
  
  // context.fillStyle = 'white';
  // context.fillRect(playerDisplayX, playerDisplayY, playerWidth, playerHeight);

  let imgIndex = 0;
  switch (true) {
    case (player.facing === 'down'): imgIndex = 1; break;
    case (player.facing === 'right'): imgIndex = 2; break;
    case (player.facing === 'left'): imgIndex = 3; break;
    case (player.facing === 'up'): imgIndex = 4; break;
    default: imgIndex = 1;
  }

  context.drawImage(head, head.naturalWidth / 4 * (imgIndex - 1), 0, head.naturalWidth / 4, head.naturalHeight / 2.5, playerDisplayX, playerDisplayY, playerWidth, playerHeight);
};

////////////////// Server <> Client //////////////////
// Send messages to server
// Emit new player after clicking start game
let playerCreated = false;
let startGameBtn = document.getElementById('start-game');
let playerNameBtn = document.getElementById('player-name');
console.log(startGameBtn);
console.log(playerNameBtn);
startGameBtn.addEventListener('click', (event) => {
  if (!playerCreated) {
    //Emit player 
    socket.emit('new player', playerNameBtn.value);
    
    //Remove login area
    let overlay = document.getElementById('overlay');
    overlay.style.display = 'none';
    let overlayChilds = overlay.childNodes;
    overlayChilds.forEach((element) => {
      element.style.display = 'none';
    });
  }
});

setInterval(function() {
  // Pass and reset attack
  socket.emit('attack', attack);
  attack = false;
}, 850 );

setInterval(function() {
  // Pass and reset movement
  socket.emit('movement', movement);
  movement = '';
}, 180 );

// Receive state from server and update
socket.on('state', function(gameState) {
  // Reset canvas
  context.clearRect(0, 0, canvas.width, canvas.height);
  updateCanvas();

  // Console logs
  function printMousePos(event) { console.log(`clientX: ${event.clientX} clientY: ${event.clientY}`); }
  document.addEventListener("click", printMousePos);

  // Draw canvas
  // Get current player
  let currentPlayer = gameState.players[socket.id];

  // Define player size 
  let playerSize = document.documentElement.clientWidth * PLAYER_PERCENTAGE_CLIENT_SIZE;

  // Get player position
  let selfDisplayX = currentPlayer ? currentPlayer.x * playerSize : 0; 
  let selfDisplayY = currentPlayer ? currentPlayer.y * playerSize : 0;
  let deltaDisplayX = canvas.width / 2 - selfDisplayX;
  let deltaDisplayY = canvas.height / 2 - selfDisplayY;

  // Draw map
  drawMap(deltaDisplayX, deltaDisplayY);
  
  // Draw log
  if (currentPlayer) { drawConsoleLog(currentPlayer); }

  // Draw players
  for (let id in gameState.players) {
    let player = gameState.players[id];
    drawPlayer(player, playerSize, deltaDisplayX, deltaDisplayY);
  }
});