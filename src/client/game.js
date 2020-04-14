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
let backgroundCanvas = document.getElementById('canvas-background');
let backgroundContext = backgroundCanvas.getContext('2d');

// Reset size of canvas
const updateCanvas = () => {
  canvas.width = document.documentElement.clientWidth * CANVAS_WIDTH_PCT_CLIENTS;
  canvas.height = canvas.width * CANVAS_HEIGHT_PCT_WIDTH;
};

updateCanvas();

class Engine {
  constructor(inits, user, pkg, config, game, refCanvas, react) {
      this.inits = inits;
      this.user = {
          pos: {
              x: 75,
              y: 60
          },
          addtoUserPos: {
              x: 0,
              y: 0
          }
      };
      this.config = {
          TileBufferSize: 9,
          XMinMapSize: 1,
          XMaxMapSize: 100,
          YMinMapSize: 1,
          YMaxMapSize: 100,
          mapNumber: 14
      };
  }  

  // updateItems = (player, playerSize) => {

  //     let minY = Math.max(player.y - 20, 1) ?? 0;
  //     let maxY = Math.min(player.y + 20, MAP_SIZE_TILES) ?? 0;
  //     let minX = Math.max(player.x - 20, 1) ?? 0;
  //     let maxX = Math.min(player.x + 20, MAP_SIZE_TILES) ?? 0;

  //     const tileX = this.user.pos.x - this.user.addtoUserPos.x;
  //     const tileY = this.user.pos.y - this.user.addtoUserPos.y;

  //     let PixelOffsetXTemp = 0;
  //     let PixelOffsetYTemp = 0;

  //     let minXOffset = 0;
  //     let minYOffset = 0;

  //     let ScreenX = 0;
  //     let ScreenY = 0;

  //     const screenminY = tileY - 9;
  //     const screenmaxY = tileY + 10;
  //     const screenminX = tileX - 9;
  //     const screenmaxX = tileX + 10;

  //     let minY = screenminY - this.config.TileBufferSize + 2;
  //     let maxY = screenmaxY + this.config.TileBufferSize;
  //     let minX = screenminX - this.config.TileBufferSize + 2;
  //     let maxX = screenmaxX + this.config.TileBufferSize;

  //     let objInfo = {};
  //     let grhObj = {};

  //     if (minY < this.config.YMinMapSize) {
  //         minYOffset = this.config.YMinMapSize - minY;
  //         minY = this.config.YMinMapSize;
  //     }

  //     if (maxY > this.config.YMaxMapSize) {
  //         maxY = this.config.YMaxMapSize;
  //     }

  //     if (minX < this.config.XMinMapSize) {
  //         minXOffset = this.config.XMinMapSize - minX;
  //         minX = this.config.XMinMapSize;
  //     }

  //     if (maxX > this.config.XMaxMapSize) {
  //         maxX = this.config.XMaxMapSize;
  //     }

  //     ScreenY = minYOffset - this.config.TileBufferSize;

  //     for (let y = minY; y < maxY; y++) {
  //         ScreenX = minXOffset - this.config.TileBufferSize;

  //         for (let x = minX; x < maxX; x++) {
  //             PixelOffsetXTemp = ScreenX * 32 + pixelOffsetX;
  //             PixelOffsetYTemp = ScreenY * 32 + pixelOffsetY;

  //             objInfo = this.inits.mapa[this.config.mapNumber][x][y].objIndex;

  //             if (objInfo) {
  //                 grhObj = this.inits.graphics[
  //                     this.inits.objs[objInfo].grhIndex
  //                 ];

  //                 if (grhObj && grhObj.numFrames === 1) {
  //                     var CurrentGrhIndex = grhObj.frames[1];

  //                     grhObj = this.inits.graphics[CurrentGrhIndex];

  //                     PixelOffsetXTemp -=
  //                         Math.floor((grhObj.width * 16) / 32) - 48;
  //                     PixelOffsetYTemp -=
  //                         Math.floor((grhObj.height * 16) / 16) - 64;

  //                     this.drawGraphic(
  //                         grhObj,
  //                         PixelOffsetXTemp,
  //                         PixelOffsetYTemp,
  //                         32
  //                     );
  //                 }
  //             }

  //             ScreenX = ScreenX + 1;
  //         }

  //         ScreenY = ScreenY + 1;
  //     }
  // };


  updateItems(player, playerSize) {     
    let minY = Math.max(player.y - 20, 1);
    let maxY = Math.min(player.y + 20, MAP_SIZE_TILES);
    let minX = Math.max(player.x - 20, 1);
    let maxX = Math.min(player.x + 20, MAP_SIZE_TILES);

    // console.log(`Player X:${player.x} Y:${player.y} Range X: ${minX}-${maxX} Y: ${minY}-${maxY}`)

    for (let y = minY; y < maxY; y++) {
      for (let x = minX; x < maxX; x++) {
          let offsetX = (x - minX - 1) * playerSize;
          let offsetY = (y - minY - 1) * playerSize;
          let objInfo = this.inits.mapa[this.config.mapNumber][x][y].objIndex;
          if (objInfo) {
            let graphIndex = this.inits.objs[objInfo].grhIndex;
            let graphicObject = this.inits.graphics[graphIndex];
            if (graphicObject && graphicObject.numFrames === 1) {
                var CurrentGrhIndex = graphicObject.frames[1];
                graphicObject = this.inits.graphics[CurrentGrhIndex];
                offsetX -= Math.floor((graphicObject.width * 0.5) - 1.5 * playerSize);
                offsetY -= Math.floor(graphicObject.height - 3 * playerSize);
                // console.log(`${graphicObject}, ${offsetX}, ${offsetY}`);
                this.drawGraphic(
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
  }

  renderBackground(player, playerSize) {     
      let minY = Math.max(player.y - 20, 1);
      let maxY = Math.min(player.y + 20, MAP_SIZE_TILES);
      let minX = Math.max(player.x - 20, 1);
      let maxX = Math.min(player.x + 20, MAP_SIZE_TILES);

      // console.log(`Player X:${player.x} Y:${player.y} Range X: ${minX}-${maxX} Y: ${minY}-${maxY}`)

      for (let y = minY; y < maxY; y++) {
        for (let x = minX; x < maxX; x++) {
            const offsetX = (x - minX - 1) * playerSize;
            const offsetY = (y - minY - 1) * playerSize;
            const graphic = this.inits.graphics[
                this.inits.mapa[this.config.mapNumber][x][y].graphic[0]
            ];
            if (graphic && graphic.numFrames === 1) {
                this.drawGraphic(
                    graphic,
                    offsetX,
                    offsetY,
                    playerSize,
                    true
                );
            } 
        }
    }

    this.updateItems(player, playerSize);
  }

  drawGraphic (graphic, x, y, playerSize, isBackground) {
      try {
          if (graphic) {
              const image = this.inits.preCacheGraphics[graphic.numFile];

              if (image) {
                  if (backgroundContext) {
                    backgroundContext.drawImage(
                          image,
                          graphic.sX,
                          graphic.sY,
                          graphic.width,
                          graphic.height,
                          x,
                          y,
                          isBackground ? playerSize : graphic.width,
                          isBackground ? playerSize : graphic.height
                      );
                  }
              } else {
                  if (graphic.numFile) {
                      this.inits
                          .loadImage(graphic.numFile)
                          .then(() => {
                              this.drawGraphic(graphic, x, y, playerSize);
                          })
                          .catch(() => {
                              if (graphic.grhIndex) {
                                  delete this.inits.graphics[graphic.grhIndex];
                              }
                              console.log("Error :(");
                          });
                  }
              }
          }
      } catch (err) {
          dumpError(err);
      }
  }
}

const inits = new Inits();
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

let game = new Engine(inits);

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

////////////////// DOM Manipulation - Console and right-side menu //////////////////
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

// Draw name
let playerNameDisplay = document.querySelector('#player-name-display');
const drawName = (player) => {
  playerNameDisplay.innerHTML = player.name;
};

// Draw health
let playerHealthDisplay = document.querySelector('#health-display');
const drawHealth = (player) => {
  playerHealthDisplay.innerHTML = `${player.health} / ${player.initialHealth}`;
};

// Draw position in mini map
let miniMap = document.querySelector('#mini-map-display');
const drawPositionMiniMap = (player) => {
  // Get positions
  let miniMapRectangle = miniMap.getBoundingClientRect();
  let positionInMiniMapX = miniMapRectangle.x + (player.x - 1) / MAP_SIZE_TILES * miniMapRectangle.height;
  let positionInMiniMapY = miniMapRectangle.y + (player.y - 1) / MAP_SIZE_TILES * miniMapRectangle.width;

  // Move rectangle
  let rectangle = document.querySelector('#mini-map-player');
  const rectSize = 2;
  rectangle.style.top = Math.floor(positionInMiniMapY - rectSize/2)+'px';
  rectangle.style.left = Math.floor(positionInMiniMapX - rectSize/2)+'px';
  rectangle.style.height = rectSize+'px';
  rectangle.style.width = rectSize+'px';
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

  // Draw head
  context.drawImage(head, head.naturalWidth / 4 * (imgIndex - 1), 0, head.naturalWidth / 4, head.naturalHeight / 2.5, playerDisplayX, playerDisplayY, playerWidth, playerHeight);
  // Draw name
  context.fillStyle = 'white';
  context.textAlign = 'center';
  context.font = "13px Arial";
  context.fillText(player.name, playerDisplayX + playerSize / 2, playerDisplayY + playerSize + 13 * 1.5);
};

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

let lastUpdatedX = 0;
let lastUpdatedY = 0;

// Receive state from server and update
socket.on('state', function(gameState) {
  // Reset canvas
  context.clearRect(0, 0, canvas.width, canvas.height);
  updateCanvas();

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
  if (currentPlayer) {
    if ((currentPlayer.x !== lastUpdatedX) || (currentPlayer.y !== lastUpdatedY)) {
      backgroundCanvas.width = document.documentElement.clientWidth * CANVAS_WIDTH_PCT_CLIENTS;
      backgroundCanvas.height = canvas.width * CANVAS_HEIGHT_PCT_WIDTH;    
      console.log(`Rendering background`);
      game.renderBackground(currentPlayer, playerSize);
      lastUpdatedX = currentPlayer.x;
      lastUpdatedY = currentPlayer.y;
    }
  }
  // drawMap(deltaDisplayX, deltaDisplayY);
  
  // Draw log and stats
  if (currentPlayer) { 
    drawConsoleLog(currentPlayer); 
    drawName(currentPlayer); 
    drawHealth(currentPlayer);  
    drawPositionMiniMap(currentPlayer);   
  }

  // Draw players
  for (let id in gameState.players) {
    let player = gameState.players[id];
    drawPlayer(player, playerSize, deltaDisplayX, deltaDisplayY);
  }
});