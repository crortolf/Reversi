const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");
const rules = document.getElementById("rules");
const background = new Image();
const cell = new Image();
const redChip = new Image();
const blueChip = new Image();
background.src = "./resources/background.jpg";
cell.src = "./resources/cell.jpg";
redChip.src = "./resources/redChip.png";
blueChip.src = "./resources/blueChip.png";
//2D array with numeric representation of current state; -1 is black, 0 is empty, 1 is white
const board = [];

//width of each 8x8 piece of canvas
const eighth = canvas.width / 8;
//size of 4 sided margin
const offset = eighth / 10;
//width/heigh of one cell's content
const cellSize = eighth - 2 * offset;
//set representing all cells that can be played in next if they are empty and adjacent to ann occupied cell
const emptyCells = new Set();
//if it is blue's turn or red's
let blueTurn = true;

//give pixel position of grid location
const grid = (coord) => {
  return offset + eighth * coord;
};

const placeBlue = (x, y) => {
  ctx.drawImage(cell, grid(x), grid(y), cellSize, cellSize);
  ctx.drawImage(blueChip, grid(x), grid(y), cellSize, cellSize);
  blueTurn = !blueTurn;
  console.log(checkCaptures(x, y));
};

const placeRed = (x, y) => {
  ctx.drawImage(cell, grid(x), grid(y), cellSize, cellSize);
  ctx.drawImage(redChip, grid(x), grid(y), cellSize, cellSize);
  blueTurn = !blueTurn;
  console.log(checkCaptures(x, y));
};

//converts mouse click into x and y coords of cell that was clicked on...
const getMousePosition = (canvas, event) => {
  let rect = canvas.getBoundingClientRect();
  let x = Math.floor((event.clientX - rect.left) / eighth);
  let y = Math.floor((event.clientY - rect.top) / eighth);

  //...and places a chip accordingly
  if (blueTurn) {
    board[y][x] = 1;
    placeBlue(x, y);
  } else {
    board[y][x] = -1;
    placeRed(x, y);
  }

  //for (let arr in board) console.log(board[arr]);
  //console.log("--------------------------");
};

const checkCaptures = (x, y) => {
  let captures = 0;
  let unverifiedCaptures = 0;
  let verified = false;
  //left
  for (let i = x - 1; i >= 0; i--) {
    if (board[y][i] == 0) {
      break;
    } else if (board[y][i] != board[y][x]) {
      unverifiedCaptures++;
    } else {
      verified = true;
      break;
    }
  }
  if (verified) captures += unverifiedCaptures;

  unverifiedCaptures = 0;
  verified = false;
  //right
  for (let i = x + 1; i < 8; i++) {
    if (board[y][i] == 0) {
      break;
    } else if (board[y][i] != board[y][x]) {
      unverifiedCaptures++;
    } else {
      verified = true;
      break;
    }
  }
  if (verified) captures += unverifiedCaptures;

  unverifiedCaptures = 0;
  verified = false;
  //up
  for (let i = y - 1; i >= 0; i--) {
    if (board[i][x] == 0) {
      break;
    } else if (board[i][x] != board[y][x]) {
      unverifiedCaptures++;
    } else {
      verified = true;
      break;
    }
  }
  if (verified) captures += unverifiedCaptures;

  unverifiedCaptures = 0;
  verified = false;
  //down
  for (let i = y + 1; i < 8; i++) {
    if (board[i][x] == 0) {
      break;
    } else if (board[i][x] != board[y][x]) {
      unverifiedCaptures++;
    } else {
      verified = true;
      break;
    }
  }
  if (verified) captures += unverifiedCaptures;

  unverifiedCaptures = 0;
  verified = false;
  //up left
  for (let i = 1; y - 1 >= 0 && x - i >= 0; i++) {
    if (board[y - i][x - i] == 0) {
      break;
    } else if (board[y - i][x - i] != board[y][x]) {
      unverifiedCaptures++;
    } else {
      verified = true;
      break;
    }
  }
  if (verified) captures += unverifiedCaptures;

  unverifiedCaptures = 0;
  verified = false;
  //up right
  for (let i = 1; y - 1 >= 0 && x + i < 8; i++) {
    if (board[y - i][x + i] == 0) {
      break;
    } else if (board[y - i][x + i] != board[y][x]) {
      unverifiedCaptures++;
    } else {
      verified = true;
      break;
    }
  }
  if (verified) captures += unverifiedCaptures;

  unverifiedCaptures = 0;
  verified = false;
  //down right
  for (let i = 1; y + 1 < 8 && x + i < 8; i++) {
    if (board[y + i][x + i] == 0) {
      break;
    } else if (board[y + i][x + i] != board[y][x]) {
      unverifiedCaptures++;
    } else {
      verified = true;
      break;
    }
  }
  if (verified) captures += unverifiedCaptures;

  unverifiedCaptures = 0;
  verified = false;
  //down left
  for (let i = 1; y + 1 < 8 && x - i >= 0; i++) {
    if (board[y + i][x - i] == 0) {
      break;
    } else if (board[y + i][x - i] != board[y][x]) {
      unverifiedCaptures++;
    } else {
      verified = true;
      break;
    }
  }
  if (verified) captures += unverifiedCaptures;

  return captures;
};

const displayRules = () => {
  rules.style.display = "block";
  canvas.style.display = "none";
};

const displayBoard = () => {
  rules.style.display = "none";
  canvas.style.display = "block";
};

//load all images
const bLoad = new Promise((resolve) => (blueChip.onload = () => resolve()));
const rLoad = new Promise((resolve) => (redChip.onload = () => resolve()));
const backLoad = new Promise(
  (resolve) => (background.onload = () => resolve()),
);
const cellLoad = new Promise((resolve) => (cell.onload = () => resolve()));

//then start drawing once loaded
for (let i = 0; i < 8; i++) {
  board.push([]);
  for (let j = 0; j < 8; j++) {
    board[i].push(0);
  }
}

//rules.style.display =

Promise.all([bLoad, rLoad, backLoad, cellLoad]).then(() => {
  canvas.addEventListener("mousedown", function (e) {
    getMousePosition(canvas, e);
  });

  ctx.drawImage(background, 0, 0, canvas.width, canvas.height);
  for (let i = 0; i < 8; i++) {
    for (let j = 0; j < 8; j++) {
      ctx.drawImage(cell, grid(i), grid(j), cellSize, cellSize);
    }
  }
});
