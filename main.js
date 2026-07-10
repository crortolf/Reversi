const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");
const rules = document.getElementById("rules");
const rulesButton = document.getElementById("rules-button");
const playButton = document.getElementById("play-button");
const helperCheckbox = document.getElementById("helper-enabled");
const background = new Image();
const cell = new Image();
const redChip = new Image();
const blueChip = new Image();
background.src = "./resources/background.jpg";
cell.src = "./resources/cell.jpg";
redChip.src = "./resources/redChip.png";
blueChip.src = "./resources/blueChip.png";
//2D array with numeric representation of current state; -1 is red, 0 is empty, 1 is blue
const board = [];
//track number of turns taken
let turn = 0;

//width of each 8x8 piece of canvas
const eighth = canvas.width / 8;
//size of 4 sided margin
const offset = eighth / 10;
//width/heigh of one cell's content
const cellSize = eighth - 2 * offset;
//set representing all cells that can be played in next if they are empty and adjacent to ann occupied cell
const emptyCells = new Set();

//give pixel position of grid location
const grid = (coord) => {
  return offset + eighth * coord;
};

const placeBlue = (x, y) => {
  ctx.drawImage(cell, grid(x), grid(y), cellSize, cellSize);
  ctx.drawImage(blueChip, grid(x), grid(y), cellSize, cellSize);
  board[y][x] = 1;
};

const placeRed = (x, y) => {
  ctx.drawImage(cell, grid(x), grid(y), cellSize, cellSize);
  ctx.drawImage(redChip, grid(x), grid(y), cellSize, cellSize);
  board[y][x] = -1;
};

//converts mouse click into x and y coords of cell that was clicked on...
const checkChipPlacement = (canvas, event) => {
  let rect = canvas.getBoundingClientRect();
  let x = Math.floor((event.clientX - rect.left) / eighth);
  let y = Math.floor((event.clientY - rect.top) / eighth);

  //...and checks if at least one capture is made...
  if ((board[y][x] === 0 && turn < 4) || checkMinCapture(x, y, turn % 2 == 0)) {
    //...then places one chip accordingly if a valid move is made
    if (turn % 2 == 0) {
      capture(x, y, turn % 2 == 0);
      placeBlue(x, y);
    } else {
      capture(x, y, turn % 2 == 0);
      placeRed(x, y);
    }
    turn++;
  } else {
    console.log("Invalid move");
  }

  //for (let arr in board) console.log(board[arr]);
  //console.log("--------------------------");
};

//check number of captures in a given direction, 0 is left, 1 is left up, 2 is up, etc
const checkDir = (dir, x, y, blueTurn) => {
  let captures = 0;
  let i = x,
    j = y;
  let movement;

  while (true) {
    movement = incDir(dir, i, j);
    i = movement[0];
    j = movement[1];
    if (j >= 0 && i >= 0 && j < 8 && i < 8) {
      if (
        (board[j][i] === -1 && blueTurn) ||
        (board[j][i] === 1 && !blueTurn)
      ) {
        captures++;
      } else if (
        (board[j][i] === 1 && blueTurn) ||
        (board[j][i] === -1 && !blueTurn)
      ) {
        return captures;
      } else {
        return 0;
      }
    } else {
      return 0;
    }
  }
};

//increment or decrement coordinate value based on direction
const incDir = (dir, i, j) => {
  if (dir === 0) i--;
  else if (dir === 1) {
    i--;
    j--;
  } else if (dir === 2) j--;
  else if (dir === 3) {
    j--;
    i++;
  } else if (dir === 4) i++;
  else if (dir === 5) {
    i++;
    j++;
  } else if (dir === 6) j++;
  else if (dir === 7) {
    i--;
    j++;
  }

  return [i, j];
};

const capture = (x, y, blueTurn) => {
  let directionalCaptures = 0;
  let row, col;
  let nextChip;

  for (let i = 0; i < 8; i++) {
    directionalCaptures = checkDir(i, x, y, blueTurn);
    row = y;
    col = x;
    for (let j = 0; j < directionalCaptures; j++) {
      nextChip = incDir(i, col, row);
      col = nextChip[0];
      row = nextChip[1];
      if (blueTurn) placeBlue(col, row);
      else placeRed(col, row);
    }
  }
};

const checkCaptures = (x, y, blueTurn) => {
  let captures = 0;

  for (let i = 0; i < 8; i++) {
    captures += checkDir(i, x, y, blueTurn);
  }

  return captures;
};

const checkMinCapture = (x, y, blueTurn) => {
  for (let i = 0; i < 8; i++) {
    if (checkDir(i, x, y, blueTurn) > 0) return true;
  }
  return false;
};

const displayRules = () => {
  rules.style.display = "block";
  canvas.style.display = "none";
  rulesButton.style.fontWeight = "bold";
  playButton.style.fontWeight = "normal";
};

const displayBoard = () => {
  rules.style.display = "none";
  canvas.style.display = "block";
  playButton.style.fontWeight = "bold";
  rulesButton.style.fontWeight = "normal";
};

const drawLegalMoves = () => {
  console.log("drawing here");
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

displayRules();

//rules.style.display =

Promise.all([bLoad, rLoad, backLoad, cellLoad]).then(() => {
  canvas.addEventListener("mousedown", function (e) {
    checkChipPlacement(canvas, e);
  });

  ctx.drawImage(background, 0, 0, canvas.width, canvas.height);
  for (let i = 0; i < 8; i++) {
    for (let j = 0; j < 8; j++) {
      ctx.drawImage(cell, grid(i), grid(j), cellSize, cellSize);
    }
  }
});

helperCheckbox.addEventListener("change", drawLegalMoves());
