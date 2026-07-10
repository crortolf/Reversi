const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");
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

const eighth = canvas.width / 8;
const offset = eighth / 10;
const cellSize = eighth - 2 * offset;
let blueTurn = true;

const grid = (coord) => {
  //return offset + eighth * Math.floor(coord) + cellSize * (coord % 1);
  return offset + eighth * coord;
};

// const placeChip = (x, y) => {
//   ctx.beginPath();
//   ctx.arc(grid(x + 0.5), grid(y + 0.5), cellSize / 2, Math.PI * 2, 0);
//   ctx.fill();
// };

const placeBlue = (x, y) => {
  ctx.drawImage(cell, grid(x), grid(y), cellSize, cellSize);
  ctx.drawImage(blueChip, grid(x), grid(y), cellSize, cellSize);
  blueTurn = !blueTurn;
};

const placeRed = (x, y) => {
  ctx.drawImage(cell, grid(x), grid(y), cellSize, cellSize);
  ctx.drawImage(redChip, grid(x), grid(y), cellSize, cellSize);

  blueTurn = !blueTurn;
};

const getMousePosition = (canvas, event) => {
  let rect = canvas.getBoundingClientRect();
  let x = Math.floor((event.clientX - rect.left) / eighth);
  let y = Math.floor((event.clientY - rect.top) / eighth);

  if (blueTurn) {
    placeBlue(x, y);
    board[y][x] = 1;
  } else {
    placeRed(x, y);
    board[y][x] = -1;
  }

  for (let arr in board) console.log(board[arr]);
  console.log("--------------------------");
};

const bLoad = new Promise((resolve) => (blueChip.onload = () => resolve()));
const rLoad = new Promise((resolve) => (redChip.onload = () => resolve()));
const backLoad = new Promise(
  (resolve) => (background.onload = () => resolve()),
);
const cellLoad = new Promise((resolve) => (cell.onload = () => resolve()));

for (let i = 0; i < 8; i++) {
  board.push([]);
  for (let j = 0; j < 8; j++) {
    board[i].push(0);
  }
}

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
