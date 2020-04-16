// Socket IO
let socket = io();

// Constants (should be same as server.js)
const CANVAS_WIDTH_PCT_CLIENTS = 0.7;
const CANVAS_HEIGHT_PCT_WIDTH = 0.53;
const PLAYER_PERCENTAGE_CLIENT_SIZE = 0.02;
const MAP_SIZE_TILES = 100;
const GAME_CONSOLE_MAX_MESSAGES = 8;
const MAP_NUMBER = 14;
const TEAMS = ['red', 'blue'];
const NUM_SPELL_IMAGES = 19;

// Constants (only here)
const bodyImgFile = {
  red: "/public/static/graficos/67.png",
  blue: "/public/static/graficos/64.png",
  green: "/public/static/graficos/187.png"
};
const headImgFile = {
  red: "/public/static/graficos/2064.png",
  blue: "/public/static/graficos/2064.png",
  green: "/public/static/graficos/2064.png"
};

// Main Code
let canvas = document.getElementById('canvas');
let context = canvas.getContext('2d');
let backgroundCanvas = document.getElementById('canvas-background');
let backgroundContext = backgroundCanvas.getContext('2d');
let consoleCanvas = document.getElementById('canvas-console');
let consoleContext = consoleCanvas.getContext('2d');
let statsCanvas = document.getElementById('canvas-stats');
let statsContext = statsCanvas.getContext('2d');

// Boolean to see if game has started
let playerCreated = false;


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

console.log(`Loading maps...`);
// console.time();
inits.loadMaps();
// console.timeEnd();

console.log(`Loading objs...`);
// console.time();
inits.loadObjs();
// console.timeEnd();

console.log(`Loading graphics...`);
// console.time();
inits.loadGraphics();
// console.timeEnd();

// Loading spell images
let spellStart = 3002;
let numSpellImages = NUM_SPELL_IMAGES;
let spellImages = [];
for (let i = 0; i < numSpellImages; i++) {
  spellImages[i] = new Image ();
  spellImages[i].src = `/public/static/graficos/${spellStart + i}.png`;
}

////////////////// Listen for inputs //////////////////
// Update movement on arrow keys
let movement = '';
document.addEventListener('keydown', (event) => {
  switch (true) {
      case (event.keyCode === 37 || (event.keyCode === 65 && chatMessageTextbox.style.visibility = 'hidden')): movement = 'left'; break;
      case (event.keyCode === 38 || (event.keyCode === 87 && chatMessageTextbox.style.visibility = 'hidden')): movement = 'up'; break;
      case (event.keyCode === 39 || (event.keyCode === 68 && chatMessageTextbox.style.visibility = 'hidden')): movement = 'right'; break;
      case (event.keyCode === 40 || (event.keyCode === 83 && chatMessageTextbox.style.visibility = 'hidden')): movement = 'down'; break;
  }   
});

// Attack on ctrl
let attack = false;
document.addEventListener('keyup', (event) => {
  if (event.keyCode === 16 || event.keyCode === 17) { attack = true; }
});

// Attack with spell
let loadedSpell = false;
let currentPlayer;
let castedSpell = {
  x: -1,
  y: -1,
  active: false
};
let musicPlaying = false;


const loadSpell = (statsCanvas, event) => {
  // Get position
  const rect = statsCanvas.getBoundingClientRect();
  const x = event.clientX - rect.left;
  const y = event.clientY - rect.top;
  // console.log("x: " + x + " y: " + y);

  // Get rectangle position
  let buttonX = statsCanvas.width * 0.24 - 10;
  let buttonY = statsCanvas.height * 0.73;
  let buttonWidth = statsCanvas.width * 0.265; 
  let buttonHeight = statsCanvas.height * 0.042;
  // console.log(`buttonX: ${buttonX}-${buttonX + buttonWidth}, buttonY: ${buttonY}-${buttonY + buttonHeight}`);

  // Boolean to say if you clicked on button
  let mouseInSpellButton = (
    x >= buttonX &&
    x <= buttonX + buttonWidth &&
    y >= buttonY &&
    y <= buttonY + buttonHeight
  );

  if (mouseInSpellButton) {
    document.body.style.cursor = 'url(/public/assets/ui/cursor-crosshair.png), auto';
    loadedSpell = true;
  }

  // Get mouse volume rectangle
  let volumeButtonX = statsCanvas.width * 0.87;
  let volumeButtonY = statsCanvas.height * 0.04;
  let volumeButtonWidth = statsCanvas.width * 0.06; 
  let volumeButtonHeight = volumeButtonWidth;

  let mouseInVolumeButton = (
    x >= volumeButtonX &&
    x <= volumeButtonX + volumeButtonWidth &&
    y >= volumeButtonY &&
    y <= volumeButtonY + volumeButtonHeight
  );

  if (mouseInVolumeButton) {
    if (musicPlaying) {
      document.getElementById('game-music').pause();  
      musicPlaying = false;
    } else {
      document.getElementById('game-music').play();
      musicPlaying = true;
    }
  }

  // console.log(mouseInVolumeButton);
};

statsCanvas.addEventListener('click', function(e) {
  // console.log(`Listened`);
  loadSpell(statsCanvas, e);
});

const castSpell = (canvas, event) => {
  if (loadedSpell) {
    // Get position
    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    // Get tile
    let playerSize = document.documentElement.clientWidth * PLAYER_PERCENTAGE_CLIENT_SIZE;
    let xTile = Math.ceil(x / playerSize + currentPlayer.x - canvas.width / 2 / playerSize);
    let yTile = Math.ceil(y / playerSize + currentPlayer.y - canvas.height / 2 / playerSize);
    // console.log(`xTile: ${xTile} yTile: ${yTile}`);


    // Update tile and cast spell
    castedSpell.x = xTile;
    castedSpell.y = yTile;
    castedSpell.active = true;
    loadedSpell = false;
    document.body.style.cursor = 'url(/public/assets/ui/cursor-arrow.png), auto';
  }
};

canvas.addEventListener('click', function(e) {
  // console.log(`Clicked on canvas`);
  castSpell(canvas, e);
});


// Send message
// Define variables
let chatMessageInput = "";
let chatMessageTextbox = document.getElementById('game-chat');
let messageTimeout = 0;

// Focus if enter
document.addEventListener('keydown', (event) => {
  if (event.keyCode === 13  && playerCreated) {
    // console.log(`enter post creating`)
    if (chatMessageTextbox.style.visibility === 'visible') {
      // console.log(`Submit 1st`)
      // Print
      chatMessageInput = chatMessageTextbox.value;
      chatMessageTextbox.value = '';
      // console.log(`Submit 2nd`)


      // Remove prior timeouts and set timeout for text to disappear
      clearTimeout(messageTimeout);
      messageTimeout = setTimeout( function() {
        chatMessageInput = '';
      } , 4000);

      // Hide
      chatMessageTextbox.style.visibility = 'hidden';
    } else {
      // console.log(`1st`)
      chatMessageTextbox.style.display = 'block';
      // console.log(`2nd`)
      chatMessageTextbox.style.visibility = 'visible';
      // console.log(`3rd`)
      chatMessageTextbox.focus(); 
    }
  }
});

// Empty function for the form
const doNothing = () => {
  event.stopPropagation();
  event.preventDefault();
  return true;
};

////////////////// Drawing //////////////////
// Print to game console
const drawConsoleLog = (player) => {
  consoleContext.fillStyle = 'white';
  consoleContext.textAlign = 'left';
  consoleContext.textBaseline = 'top';
  consoleContext.font = "13px Arial";
  player.gameConsoleArray.forEach((message, i) => {
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

// Draw team
const drawTeam = (player) => {
  statsContext.fillStyle = player.team;
  statsContext.textAlign = 'center';
  statsContext.textBaseline = 'middle';
  statsContext.font = "600 14px Arial";
  let capitalizedTeam = player.team.charAt(0).toUpperCase() + player.team.slice(1);
  statsContext.fillText(`${capitalizedTeam} Team`, statsCanvas.width / 2, statsCanvas.height * 0.144);
};

// Draw cast spell
const drawCastSpell = () => {
  statsContext.fillStyle = 'darkred';
  let buttonX = statsCanvas.width * 0.24 - 10;
  let buttonY = statsCanvas.height * 0.737;
  let buttonWidth = statsCanvas.width * 0.265; 
  let buttonHeight = statsCanvas.height * 0.042;
  // statsContext.fillRect(buttonX, buttonY, buttonWidth, buttonHeight);
  
  statsContext.fillStyle = '#aa967f';
  statsContext.textAlign = 'center';
  statsContext.textBaseline = 'middle';
  statsContext.font = "600 12px Arial";
  statsContext.fillText(`Cast Spell`, buttonX + buttonWidth / 2 + 10, buttonY + buttonHeight / 2);
}; 

// Draw health
const drawHealth = (player) => {
  statsContext.fillStyle = 'darkred';
  let barX = statsCanvas.width * 0.235;
  let barY = statsCanvas.height * 0.869;
  let barFullWidth = statsCanvas.width * 0.297; 
  let barWidth = barFullWidth * player.health / player.initialHealth;
  let barHeight = statsCanvas.height * 0.019;
  statsContext.fillRect(barX, barY, barWidth, barHeight);
  
  statsContext.fillStyle = '#aa967f';
  statsContext.textAlign = 'center';
  statsContext.textBaseline = 'middle';
  statsContext.font = "500 12px Arial";
  statsContext.fillText(`${player.health} / ${player.initialHealth}`, barX + barFullWidth / 2, barY + barHeight / 2);
};

// Draw mana
const drawMana = (player) => {
  statsContext.fillStyle = 'blue';
  let barX = statsCanvas.width * 0.235;
  let barY = statsCanvas.height * 0.808;
  let barFullWidth = statsCanvas.width * 0.297; 
  let barWidth = barFullWidth * player.mana / player.initialMana;
  let barHeight = statsCanvas.height * 0.019;
  statsContext.fillRect(barX, barY, barWidth, barHeight);
  
  statsContext.fillStyle = '#aa967f';
  statsContext.textAlign = 'center';
  statsContext.textBaseline = 'middle';
  statsContext.font = "500 12px Arial";
  statsContext.fillText(`${player.mana} / ${player.initialMana}`, barX + barFullWidth / 2, barY + barHeight / 2);
};

// Draw minimap
const drawMiniMap = (player) => {
  const img = new Image ();
  img.src = `public/static/imgs_mapas/${MAP_NUMBER}.png`;

  // Draw map
  let imgX = statsCanvas.width * 0.610;
  let imgY = statsCanvas.height * 0.771;
  let imgSize = statsCanvas.height * 0.123;
  statsContext.drawImage(img, imgX, imgY, imgSize, imgSize);

  // Draw character
  statsContext.fillStyle = player.team;
  let positionInMiniMapX = imgX + (player.x - 1) / MAP_SIZE_TILES * imgSize;
  let positionInMiniMapY = imgY + (player.y - 1) / MAP_SIZE_TILES * imgSize;
  statsContext.fillRect(positionInMiniMapX, positionInMiniMapY, 2, 2);
};

// Draw number of players online
const drawOnlinePlayers = (gameState) => {
  let number = Object.keys(gameState.players).length;
  context.fillStyle = 'white';
  context.font = "13px Arial";
  context.textBaseline = 'top';

  context.textAlign = 'right';
  let onlineX = canvas.width - 10;
  let onlineY = 5;

  context.fillText(`Online players: ${number}`, onlineX, onlineY);
};

// Draw leaderboard
const drawLeaderboard = (gameState) => {
  // Define variables to get
  let teamStats = [];
  TEAMS.forEach((teamName) => teamStats[teamName] = {
    players: [],
    kills: 0
  });

  // Get all data
  for (const socketId in gameState.players) {
    let player = gameState.players[socketId];
    let team = player.team;

    teamStats[team].players.push(player.name);
    teamStats[team].kills += player.kills;
  }

  //// Draw data
  // Define variables
  let numTeams = Object.keys(teamStats).length;
  let drawingAreaPct = 0.75;
  let drawingArea = statsCanvas.width * drawingAreaPct;
  let startX = statsCanvas.width * (1 - drawingAreaPct) / 2;
  let teamWidth = drawingArea / numTeams;

  // console.log(statsCanvas.width);
  // console.log(startX);
  // console.log(teamWidth);

  // Draw for each team
  statsContext.fillStyle = '#aa967f';
  statsContext.textAlign = 'center';
  statsContext.textBaseline = 'middle';
  TEAMS.forEach((teamName, i) => {
    // Draw title
    let capitalizedTeam = teamName.charAt(0).toUpperCase() + teamName.slice(1);
    statsContext.font = "600 14px Arial";
    statsContext.fillStyle = '#aa967f';
    let yPosition = statsCanvas.height * 0.365;
    let offset = 5;
    statsContext.fillText(`${capitalizedTeam} Team`, startX + teamWidth / 2 + teamWidth * i, yPosition);
    statsContext.fillRect(startX + i * teamWidth + offset, yPosition + statsCanvas.height * 0.013, teamWidth - offset * 2, 2);

    // Draw kills
    let numKills = teamStats[teamName].kills;
    statsContext.font = "600 22px Arial";
    statsContext.fillStyle = teamName;
    yPosition = statsCanvas.height * 0.415;
    statsContext.fillText(numKills, startX + teamWidth / 2 + teamWidth * i, yPosition);

    // Draw player titles
    statsContext.font = "600 14px Arial";
    statsContext.fillStyle = '#aa967f';
    yPosition = statsCanvas.height * 0.465;
    offset = 5;
    statsContext.fillText(`Players`, startX + teamWidth / 2 + teamWidth * i, yPosition);
    statsContext.fillRect(startX + i * teamWidth + offset, yPosition + statsCanvas.height * 0.013, teamWidth - offset * 2, 1);  
    
    // Draw players
    statsContext.font = "12px Arial";
    statsContext.fillStyle = '#aa967f';
    statsContext.textBaseline = 'middle';
    yPosition = statsCanvas.height * 0.495;
    let maxYPosition = statsCanvas.height * 0.68;
    let numPlayersPerCol = 8;
    let step = (maxYPosition - yPosition) / numPlayersPerCol;
    let numPlayersTeam = teamStats[teamName].players.length; 
    let numColumns = Math.ceil(numPlayersTeam / numPlayersPerCol);

    // console.log(`Team ${teamName}, numPlayersPerTeam: ${numPlayersTeam} numColumns: ${numColumns}`);

    teamStats[teamName].players.forEach((playerName, j) => {
      let playerColumn = Math.ceil((j + 1) / numPlayersPerCol); 
      let numPlayerInColumn = 1 + j - numPlayersPerCol * (playerColumn - 1);  
      // console.log(`Player: ${playerName} Team ${teamName} PlayerCol ${playerColumn} PlayerInCol ${numPlayerInColumn} `)
      let offsetWithinTeam = teamWidth / numColumns / 2 + teamWidth / numColumns * (playerColumn - 1);
      let offsetTeam = teamWidth * i;
      statsContext.fillText(playerName, startX + offsetWithinTeam + offsetTeam, yPosition + (numPlayerInColumn - 1) * step, teamWidth / numColumns);
    });
  
  });  
};

////////////////// Asset Loading and Drawing //////////////////   
// Auxiliary function to wrap text
const wrapText = (context, text, x, y, maxWidth, lineHeight) => {
  let linesToPrint = [];
  let words = text.split(' ');
  let line = '';

  for(let n = 0; n < words.length; n++) {
    let testLine = line + words[n] + ' ';
    let metrics = context.measureText(testLine);
    let testWidth = metrics.width;
    if (testWidth > maxWidth && n > 0) {
      linesToPrint.push(line);
      // context.fillText(line, x, y);
      line = words[n] + ' ';
      // y -= lineHeight;
    }
    else {
      line = testLine;
    }
  }
  linesToPrint.push(line);

  linesToPrint.forEach((line, i) => {
    let yToPrint = y - (linesToPrint.length - i - 1) * lineHeight; 
    context.fillText(line, x, yToPrint);
  });
};

// Draw player
const drawPlayer = (player, playerSize, deltaDisplayX, deltaDisplayY) => {
  // Get display values
  // Get x and y
  let playerDisplayX = player.x * playerSize + deltaDisplayX;
  let playerDisplayY = player.y * playerSize + deltaDisplayY;
  let playerWidth = playerSize;
  let playerHeight = playerSize;
  
  // context.fillStyle = 'white';
  // context.fillRect(playerDisplayX, playerDisplayY, playerWidth, playerHeight);

  let imgIndexHead = 0;
  let imgIndexBody = 0;
  switch (true) {
    case (player.facing === 'down'): imgIndexHead = 1; imgIndexBody = 1; break;
    case (player.facing === 'right'): imgIndexHead = 2; imgIndexBody = 4; break;
    case (player.facing === 'left'): imgIndexHead = 3; imgIndexBody = 3; break;
    case (player.facing === 'up'): imgIndexHead = 4; imgIndexBody = 2; break;
    default: imgIndexHead = 1; imgIndexBody = 1;
  }

  // Draw body
  let body = new Image ();
  body.src = bodyImgFile[player.team];
  let bodyHeight = body.naturalHeight / 4; 
  let bodyWidth = body.naturalWidth / 6;
  let bodyX = playerDisplayX + playerSize / 2 - bodyWidth / 2;
  let bodyY = playerDisplayY + playerSize - bodyHeight;
  context.drawImage(body, 0, bodyHeight * (imgIndexBody - 1), bodyWidth, bodyHeight, bodyX, bodyY, bodyWidth, bodyHeight);

  // Draw head
  let head = new Image ();
  head.src = headImgFile[player.team];
  let headHeight = head.naturalHeight / 2.5; 
  let headWidth = head.naturalWidth / 4;
  let headX = playerDisplayX + playerSize / 2 - headWidth / 2;
  let headY = bodyY - headHeight * 0.3;
  context.drawImage(head, headWidth * (imgIndexHead - 1), 0, headWidth, headHeight, headX, headY, headWidth, headHeight);

  // Draw name
  context.fillStyle = 'white';
  context.textAlign = 'center';
  context.textBaseline = 'top';
  context.font = "600 13px Arial";
  context.fillText(`< ${player.name} >`, playerDisplayX + playerSize / 2, playerDisplayY + playerSize * 1.1);

  // Draw message
  context.fillStyle = 'white';
  context.textAlign = 'center';
  context.textBaseline = 'bottom';
  context.font = "600 13px Arial";
  wrapText(context, player.chatMessage, playerDisplayX + playerSize / 2, playerDisplayY - playerSize * 0.5, 10 * playerSize, 15 );

  //Draw spell if any
  if (player.counter >= 1 && player.counter <= NUM_SPELL_IMAGES ) {
    let numImage = Math.floor(player.counter - 1);
    let spell = spellImages[numImage];
    let spellX = playerDisplayX + playerSize / 2 - spell.naturalWidth / 2;
    let spellY = playerDisplayY + playerSize - spell.naturalHeight;
    context.drawImage(spell, spellX, spellY, spell.naturalWidth, spell.naturalHeight);
  }
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
let startGameBtn = document.getElementById('start-game');
let playerNameInput = document.getElementById('player-name');

const createPlayer = () => {
  console.log('Creating player...');
  event.preventDefault();
  if (!playerCreated) {
    //Emit player 
    socket.emit('new player', playerNameInput.value);

    //Stop intro music and start game music
    document.getElementById('intro-music').pause();
    document.getElementById('game-music').play();
    musicPlaying = true;
  
    //Remove login area
    let overlay = document.getElementById('overlay');
    overlay.style.display = 'none';

    // Prevent from creating one
    playerCreated = true;
  }
};
// To work with click
startGameBtn.addEventListener('click', (event) => createPlayer(playerNameInput.value));

// Attack and cast spell
setInterval(function() {
  // Pass and reset attack
  socket.emit('attack', attack);
  attack = false;
  // Pass and reset cast spell
  socket.emit('cast spell', castedSpell);
  castedSpell.active = false;
}, 850 );

// Movement
setInterval(function() {
  // Pass and reset movement
  socket.emit('movement', movement);
  movement = '';
}, 220 );

// Chat 
setInterval(function() {
  // Pass and reset movement
  socket.emit('new chat message', chatMessageInput);
  // movement = '';
}, 220 );

// Resize canvas
window.addEventListener('resize', (e) => {
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

  // console.log(gameState.players)

  // Draw canvas
  // Get current player
  currentPlayer = gameState.players[socket.id];

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

  // Draw cast spell text
  drawCastSpell();

  // Draw log and player-specific tasks
  if (currentPlayer) { 
    drawConsoleLog(currentPlayer); 
    drawName(currentPlayer); 
    drawTeam(currentPlayer);
    drawHealth(currentPlayer);
    drawMana(currentPlayer);
    drawMiniMap(currentPlayer);
  }

  // Draw general stats
  drawOnlinePlayers(gameState);
  drawLeaderboard(gameState);

  // Draw players
  for (let id in gameState.players) {
    let player = gameState.players[id];
    drawPlayer(player, playerSize, deltaDisplayX, deltaDisplayY);
  }
});