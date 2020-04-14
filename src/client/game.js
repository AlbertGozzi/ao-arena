// Socket IO
let socket = io();

// Constants (should be same as server.js)
const CANVAS_WIDTH_PCT_CLIENTS = 0.7;
const CANVAS_HEIGHT_PCT_WIDTH = 0.53;
const PLAYER_PERCENTAGE_CLIENT_SIZE = 0.02;
const MAP_SIZE_TILES = 100;
const GAME_CONSOLE_MAX_MESSAGES = 8;
const MAP_NUMBER = 14;
// let gameConsoleNumMessages = Math.floor(gameConsole.clientHeight / 18); // TODO replace for font size


// Main Code
let canvas = document.getElementById('canvas');
let context = canvas.getContext('2d');
let backgroundCanvas = document.getElementById('canvas-background');
let backgroundContext = backgroundCanvas.getContext('2d');
let consoleCanvas = document.getElementById('canvas-console');
let consoleContext = consoleCanvas.getContext('2d');
let statsCanvas = document.getElementById('canvas-stats');
let statsContext = statsCanvas.getContext('2d');



// Reset size of canvas
const updateCanvas = () => {
  canvas.width = document.documentElement.clientWidth * CANVAS_WIDTH_PCT_CLIENTS;
  canvas.height = canvas.width * CANVAS_HEIGHT_PCT_WIDTH;
  backgroundCanvas.width = canvas.width;
  backgroundCanvas.height = canvas.height;
  consoleCanvas.width = canvas.width;
  consoleCanvas.height = canvas.width * (CANVAS_WIDTH_PCT_CLIENTS - CANVAS_HEIGHT_PCT_WIDTH);
  statsCanvas.width = document.documentElement.clientWidth * (1 - CANVAS_WIDTH_PCT_CLIENTS - 0.05);
  statsCanvas.height = canvas.width * CANVAS_WIDTH_PCT_CLIENTS + 6; // TODO fix
};

// Update for the first time
updateCanvas();


const updateItems = (player, playerSize, deltaDisplayX, deltaDisplayY) => {  
  let minY = Math.max(player.y - Math.floor(canvas.height / playerSize), 1);
  let maxY = Math.min(player.y + Math.floor(canvas.height - canvas.height / playerSize), MAP_SIZE_TILES);
  let minX = Math.max(player.x - Math.floor(canvas.width / playerSize), 1);
  let maxX = Math.min(player.x + Math.floor(canvas.width -canvas.width / playerSize), MAP_SIZE_TILES);

  // console.log(`Player X:${player.x} Y:${player.y} Range X: ${minX}-${maxX} Y: ${minY}-${maxY}`)

  for (let y = minY; y < maxY; y++) {
    for (let x = minX; x < maxX; x++) {
        let offsetX = x * playerSize + deltaDisplayX;
        let offsetY = y * playerSize + deltaDisplayY;
        let objInfo = inits.mapa[MAP_NUMBER][x][y].objIndex;
        if (objInfo) {
          let graphIndex = inits.objs[objInfo].grhIndex;
          let graphicObject = inits.graphics[graphIndex];
          if (graphicObject && graphicObject.numFrames === 1) {
              var CurrentGrhIndex = graphicObject.frames[1];
              graphicObject = inits.graphics[CurrentGrhIndex];
              drawGraphic(
                  graphicObject,
                  offsetX,
                  offsetY,
                  playerSize,
                  false
              );
          }
      }
    }
  }
};

const renderBackground = (player, playerSize, deltaDisplayX, deltaDisplayY) => {    
    let minY = Math.max(player.y - Math.floor(canvas.height / playerSize), 1);
    let maxY = Math.min(player.y + Math.floor(canvas.height - canvas.height / playerSize), MAP_SIZE_TILES);
    let minX = Math.max(player.x - Math.floor(canvas.width / playerSize), 1);
    let maxX = Math.min(player.x + Math.floor(canvas.width -canvas.width / playerSize), MAP_SIZE_TILES);

    // console.log(`Player X:${player.x} Y:${player.y} Range X: ${minX}-${maxX} Y: ${minY}-${maxY}`);

    for (let y = minY; y < maxY; y++) {
      for (let x = minX; x < maxX; x++) {
          const offsetX = x * playerSize + deltaDisplayX;
          const offsetY = y * playerSize + deltaDisplayY;
          const graphic = inits.graphics[
              inits.mapa[MAP_NUMBER][x][y].graphic[0]
          ];
          if (graphic && graphic.numFrames === 1) {
              drawGraphic(
                  graphic,
                  offsetX,
                  offsetY,
                  playerSize,
                  true
              );
          } 
      }
  }

  updateItems(player, playerSize, deltaDisplayX, deltaDisplayY);
};

const drawGraphic = (graphic, x, y, playerSize, isBackground) => {
    try {
        if (graphic) {
            const image = inits.preCacheGraphics[graphic.numFile];

            if (image) {
                if (backgroundContext) {
                  backgroundContext.drawImage(
                        image,
                        graphic.sX,
                        graphic.sY,
                        graphic.width,
                        graphic.height,
                        isBackground ? x : x - graphic.width / 2 + playerSize / 2,
                        isBackground ? y : y - graphic.height + playerSize,
                        isBackground ? playerSize : graphic.width,
                        isBackground ? playerSize : graphic.height
                  );
                  // context.fillStyle = 'white';
                  // if (!isBackground) {context.fillRect(x, y, playerSize, playerSize)};                
                }
            } else {
                if (graphic.numFile) {
                    inits
                        .loadImage(graphic.numFile)
                        .then(() => {
                            drawGraphic(graphic, x, y, playerSize, isBackground);
                        })
                        .catch(() => {
                            if (graphic.grhIndex) {
                                delete inits.graphics[graphic.grhIndex];
                            }
                            console.log("Error :(");
                        });
                }
            }
        }
    } catch (err) {
        dumpError(err);
    }
};

console.log(`Loading maps`);
console.time();
inits.loadMaps();
console.timeEnd();

console.log(`Loading objs`);
console.time();
inits.loadObjs();
console.timeEnd();

console.log(`Loading graphics`);
console.time();
inits.loadGraphics();
console.timeEnd();

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
  if (event.keyCode === 16) { attack = true; }
});

////////////////// Drawing //////////////////
// Print to game console
const drawConsoleLog = (player) => {
  consoleContext.fillStyle = 'white';
  consoleContext.textAlign = 'left';
  consoleContext.textBaseline = 'top';
  consoleContext.font = "13px Arial";
  player.gameConsoleLiArray.forEach((message, i) => {
    consoleContext.fillText(message, 5, 5 + (consoleCanvas.height - 5) / GAME_CONSOLE_MAX_MESSAGES * i);
  });
};

// Draw name
const drawName = (player) => {
  statsContext.fillStyle = '#aa967f';
  statsContext.textAlign = 'center';
  statsContext.textBaseline = 'middle';
  statsContext.font = "600 16px Arial";
  statsContext.fillText(player.name, statsCanvas.width / 2, statsCanvas.height * 0.107);
};

// Draw health
const drawHealth = (player) => {
  statsContext.fillStyle = 'darkred';
  let barX = statsCanvas.width * 0.235;
  let barY = statsCanvas.height * 0.809;
  let barFullWidth = statsCanvas.width * 0.295; 
  let barWidth = barFullWidth * player.health / player.initialHealth;
  let barHeight = statsCanvas.height * 0.019;
  statsContext.fillRect(barX, barY, barWidth, barHeight);
  
  statsContext.fillStyle = '#aa967f';
  statsContext.textAlign = 'center';
  statsContext.textBaseline = 'middle';
  statsContext.font = "500 12px Arial";
  statsContext.fillText(`${player.health} / ${player.initialHealth}`, barX + barFullWidth / 2, barY + barHeight / 2);
};

// Draw minimap
const drawMiniMap = (player) => {
  const img = new Image ();
  img.src = '/public/assets/14.png';

  // Draw map
  let imgX = statsCanvas.width * 0.605;
  let imgY = statsCanvas.height * 0.76;
  let imgSize = statsCanvas.height * 0.123;
  statsContext.drawImage(img, imgX, imgY, imgSize, imgSize);

  // Draw character
  statsContext.fillStyle = 'red';
  let positionInMiniMapX = imgX + (player.x - 1) / MAP_SIZE_TILES * imgSize;
  let positionInMiniMapY = imgY + (player.y - 1) / MAP_SIZE_TILES * imgSize;
  statsContext.fillRect(positionInMiniMapX, positionInMiniMapY, 2, 2);
};

// Draw number of players online
const drawOnlinePlayers = (number) => {
  context.fillStyle = 'white';
  context.font = "14px Arial";
  context.textBaseline = 'top';

  context.textAlign = 'right';
  let onlineX = canvas.width - 10;
  let onlineY = 5;

  context.fillText(`Online players: ${number}`, onlineX, onlineY);
};

////////////////// Asset Loading and Drawing //////////////////   
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

  // Draw head
  context.drawImage(head, head.naturalWidth / 4 * (imgIndex - 1), 0, head.naturalWidth / 4, head.naturalHeight / 2.5, playerDisplayX, playerDisplayY, playerWidth, playerHeight);
  // Draw name
  context.fillStyle = 'white';
  context.textAlign = 'center';
  context.font = "13px Arial";
  context.fillText(player.name, playerDisplayX + playerSize / 2, playerDisplayY + playerSize + 13 * 1.5);
};

// const drawBlockedPositions = (gameState, playerSize, deltaDisplayX, deltaDisplayY) => {
//   for (let x = 1; x <= MAP_SIZE_TILES; x++) {
//     for (let y = 1; y <= MAP_SIZE_TILES; y++) {
//       if (gameState.map.blockedPositions[x][y]) {
//         context.fillStyle = 'white';
//         context.fillRect(x * playerSize + deltaDisplayX, y * playerSize + deltaDisplayY, playerSize, playerSize);
//       }
//     }  
//   }
// };

////////////////// Server <> Client //////////////////
// Send messages to server
// Emit new player after clicking start game
let playerCreated = false;
let startGameBtn = document.getElementById('start-game');
let playerNameInput = document.getElementById('player-name');

const createPlayer = () => {
  event.preventDefault();
  if (!playerCreated) {
    //Emit player 
    socket.emit('new player', playerNameInput.value);

    //Stop intro music and start game music
    // document.getElementById('intro-music').pause();
    // document.getElementById('game-music').play();
  
    //Remove login area
    let overlay = document.getElementById('overlay');
    overlay.style.display = 'none';

    // Prevent from creating another one
    playerCreated = true;
  }
};
// To work with click
startGameBtn.addEventListener('click', (event) => createPlayer(playerNameInput.value));

// Attack
setInterval(function() {
  // Pass and reset attack
  socket.emit('attack', attack);
  attack = false;
}, 850 );

// Movement
setInterval(function() {
  // Pass and reset movement
  socket.emit('movement', movement);
  movement = '';
}, 180 );

// Resize canvas
window.addEventListener('resize', (e) => {
  console.log("resized");
  updateCanvas();
  lastUpdatedX = 0;
  lastUpdatedY = 0;
});

// Initialize variables for background update
let lastUpdatedX = 0;
let lastUpdatedY = 0;

// Receive state from server and update
socket.on('state', function(gameState) {
  // Clear canvases
  context.clearRect(0, 0, canvas.width, canvas.height);
  statsContext.clearRect(0, 0, statsCanvas.width, statsCanvas.height);
  consoleContext.clearRect(0, 0, consoleCanvas.width, consoleCanvas.height);

  // Draw canvas
  // Get current player
  let currentPlayer = gameState.players[socket.id];

  // Define player size 
  let playerSize = document.documentElement.clientWidth * PLAYER_PERCENTAGE_CLIENT_SIZE;

  // Get player position
  let selfDisplayX = currentPlayer ? currentPlayer.x * playerSize : 0; 
  let selfDisplayY = currentPlayer ? currentPlayer.y * playerSize : 0;
  // Define delta so it's always in the middle of a square
  let canvasCenterX = Math.floor(canvas.width / 2 / playerSize) * playerSize; 
  let canvasCenterY = Math.floor(canvas.height / 2 / playerSize) * playerSize;
  let deltaDisplayX = canvasCenterX - selfDisplayX;
  let deltaDisplayY = canvasCenterY - selfDisplayY;

  // Draw background map 
  if (currentPlayer) {
    if ((currentPlayer.x !== lastUpdatedX) || (currentPlayer.y !== lastUpdatedY)) {
      backgroundContext.clearRect(0, 0, backgroundCanvas.width, backgroundCanvas.height);
      playerSize = document.documentElement.clientWidth * PLAYER_PERCENTAGE_CLIENT_SIZE;
      // console.log(`Rendering background`);
      // console.log(playerSize);
      // console.log(`DeltaX ${deltaDisplayX}, DeltaY ${deltaDisplayY}`)
      renderBackground(currentPlayer, playerSize, deltaDisplayX, deltaDisplayY);
      // drawBlockedPositions(gameState, playerSize, deltaDisplayX, deltaDisplayY);
      lastUpdatedX = currentPlayer.x;
      lastUpdatedY = currentPlayer.y;
    }
  }

  // Draw log and player-specific tasks
  if (currentPlayer) { 
    drawConsoleLog(currentPlayer); 
    drawName(currentPlayer); 
    drawHealth(currentPlayer);  
    drawMiniMap(currentPlayer);
  }

  // Draw general stats
  drawOnlinePlayers(Object.keys(gameState.players).length);

  // Draw players
  for (let id in gameState.players) {
    let player = gameState.players[id];
    drawPlayer(player, playerSize, deltaDisplayX, deltaDisplayY);
  }
});