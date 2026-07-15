const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");
const gameBoard = document.getElementById("game-board");
const gameOver = document.getElementById("game-over");
const rules = document.getElementById("rules");
const rulesButton = document.getElementById("rules-button");
const playButton = document.getElementById("play-button");
const helperCheckbox = document.getElementById("helper-enabled");
const background = new Image();
const cell = new Image();
const redChip = new Image();
const blueChip = new Image();
const turnDisplay = document.getElementById("turn-display");
const skippingTurn = document.getElementById("turn-skipped");
background.src = "./resources/background.jpg";
cell.src = "./resources/cell.jpg";
redChip.src = "./resources/redChip.png";
blueChip.src = "./resources/blueChip.png";
//2D array with numeric representation of current state; -1 is red, 0 is empty, 1 is blue
let board;
//track number of turns taken
let turn = 0;
let blueTurn = true;
let currentGameCode;

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

//converts mouse click into x and y coords of cell that was clicked on...
const attemptChipPlacement = async (canvas, event) => {
  let rect = canvas.getBoundingClientRect();
  let x = Math.floor((event.clientX - rect.left) / eighth);
  let y = Math.floor((event.clientY - rect.top) / eighth);

  try {
    //and creates a move instance to submit to the server
    console.log("got here");
    const move = { xCoord: x, yCoord: y, gameCode: currentGameCode };
    console.log(move);
    const attemptedMoveResult = await fetch("http://127.0.0.1:3000", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(move),
    });

    console.log(attemptedMoveResult.ok);

    if (attemptedMoveResult.ok) {
      console.log("got here too");
      console.log(attemptedMoveResult);
      let temp = await attemptedMoveResult.json();
      console.log(temp);
      ({ board, turn, blueTurn } = temp);
      board = temp.gameBoard;
      console.log(board);
      redrawBoard();
    } else {
      console.log("attempted move failed");
    }
  } catch (e) {
    console.log("try-catch error");
    console.log(e);
  }

  //TODO: need to parse return data
};

const displayRules = () => {
  rules.style.display = "block";
  gameBoard.style.display = "none";
  rulesButton.style.fontWeight = "bold";
  playButton.style.fontWeight = "normal";
};

const displayBoard = () => {
  rules.style.display = "none";
  gameBoard.style.display = "block";
  playButton.style.fontWeight = "bold";
  rulesButton.style.fontWeight = "normal";
};

//redraw the board anytime a change is made (move made, helper mode enabled/disabled)
//also checks that there is at least one valid move
const redrawBoard = async () => {
  let skipTurn = true;

  if (blueTurn) {
    turnDisplay.src = "./resources/blueChip.png";
    turnDisplay.alt = "Blue's Turn";
  } else {
    turnDisplay.src = "./resources/redChip.png";
    turnDisplay.alt = "Red's Turn";
  }

  for (let i = 0; i < 8; i++) {
    for (let j = 0; j < 8; j++) {
      ctx.drawImage(cell, grid(i), grid(j), cellSize, cellSize);
      if (board[j][i] === 1)
        ctx.drawImage(blueChip, grid(i), grid(j), cellSize, cellSize);
      else if (board[j][i] === -1)
        ctx.drawImage(redChip, grid(i), grid(j), cellSize, cellSize);

      // //draw orange square if helper mode is enabled and this space represents a legal move
      // if (
      //   turn < 4 &&
      //   (i === 3 || i === 4) &&
      //   (j === 3 || j === 4) &&
      //   board[j][i] === 0
      // ) {
      //   skipTurn = false;
      //   if (helperCheckbox.checked) {
      //     ctx.fillStyle = "#e6cb97";
      //     ctx.fillRect(grid(i), grid(j), cellSize, cellSize);
      //   }
      // } else if (turn >= 4 && board[j][i] === 0 && checkMinCapture(i, j)) {
      //   skipTurn = false;
      //   if (helperCheckbox.checked) {
      //     ctx.fillStyle = "#e6cb97";
      //     ctx.fillRect(grid(i), grid(j), cellSize, cellSize);
      //   }
      // }
    }
  }

  //condition if there is no valid move and the opponent must play again
  // if (skipTurn && turn < 64) {
  //   skippingTurn.style.display = "block";
  //   await new Promise((resolve) => setTimeout(resolve, 3000));
  //   skippingTurn.style.display = "none";
  //   blueTurn = !blueTurn;
  //   redrawBoard();
  // }
};

//start a new game
const newGame = async () => {
  try {
    const newGameResponse = await fetch("http://localhost:3000?newGame");

    if (newGameResponse.ok) {
      console.log("received good response from the server:");
      currentGameCode = await newGameResponse.json();
      console.log(currentGameCode);
      board = [];
      for (let i = 0; i < 8; i++) {
        board.push([0, 0, 0, 0, 0, 0, 0, 0]);
      }
      redrawBoard();
      //need to write new game gameCode to the field on the webpage
    } else {
      console.log("there was a fetch error");
    }
  } catch (error) {
    console.log("try-catch error");
    console.log(error);
  }

  redrawBoard();
  gameOver.style.display = "none";
};

const hideGO = () => {
  gameOver.style.display = "none";
};

//display end game message
const endGame = () => {
  let blueScore = 0,
    redScore = 0;
  for (let i = 0; i < 8; i++) {
    for (let j = 0; j < 8; j++) {
      if (board[j][i] === 1) blueScore++;
      else redScore++;
    }
  }
  gameOver.style.display = "block";
  if (blueScore > redScore)
    document.getElementById("winner-message").innerText = "Blue wins!";
  if (blueScore === redScore)
    document.getElementById("winner-message").innerText = "It's a tie!";
  if (blueScore < redScore)
    document.getElementById("winner-message").innerText = "Red wins!";
  document.getElementById("score-message").innerText =
    "Final score was " + blueScore + " to " + redScore;
};

//load all images
const bLoad = new Promise((resolve) => (blueChip.onload = () => resolve()));
const rLoad = new Promise((resolve) => (redChip.onload = () => resolve()));
const backLoad = new Promise(
  (resolve) => (background.onload = () => resolve()),
);
const cellLoad = new Promise((resolve) => (cell.onload = () => resolve()));

//draw first board when all images are loaded
Promise.all([bLoad, rLoad, backLoad, cellLoad]).then(() => {
  canvas.addEventListener("mousedown", function (e) {
    attemptChipPlacement(canvas, e);
  });

  //draw board background first
  ctx.drawImage(background, 0, 0, canvas.width, canvas.height);

  newGame();

  //event listener in case the helper mode is enabled or disabled
  helperCheckbox.addEventListener("change", redrawBoard);

  document.getElementById("game-mode").addEventListener("change", () => 0);
});
