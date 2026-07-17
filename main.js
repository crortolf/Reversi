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
const gameNotifier = document.getElementById("game-notifications");
const gameCodeInput = document.getElementById("game-code");
const gameModeSelect = document.getElementById("game-mode");
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
let singlePlayer = true;
let gamePlayDisabled = false;

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

  //first we do a local check to make sure a valid move was selected

  if (
    (turn < 4 && (x === 3 || x === 4) && (y === 3 || y === 4)) ||
    checkMinCapture(x, y)
  ) {
    try {
      //and creates a move instance to submit to the server
      const move = { xCoord: x, yCoord: y, gameCode: currentGameCode };
      const attemptedMoveResult = await fetch("http://127.0.0.1:3000", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(move),
      });

      if (attemptedMoveResult.ok) {
        console.log(attemptedMoveResult);
        let updatedGame = await attemptedMoveResult.json();
        let previousPlayer = blueTurn;
        //we are receiving a prop called gameboard here and that is overloaded (used by the element gameboard locally) so we have to destruct and then set board
        ({ _, turn, blueTurn } = updatedGame);
        if (turn < 64 && previousPlayer === blueTurn) skipTurn();
        board = updatedGame.gameBoard;
        if (turn == 64) endGame();
        redrawBoard();
      } else {
        console.log("attempted move failed");
      }
    } catch (e) {
      console.log("try-catch error");
      console.log(e);
    }
  } else {
    //TODO: display info to the player
    displayError("Invalid move");
    console.log("client-side invalid move");
  }
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
const redrawBoard = async () => {
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

      //draw orange square if helper mode is enabled and this space represents a legal move
      if (
        turn < 4 &&
        (i === 3 || i === 4) &&
        (j === 3 || j === 4) &&
        board[j][i] === 0
      ) {
        if (helperCheckbox.checked) {
          ctx.fillStyle = "#e6cb97";
          ctx.fillRect(grid(i), grid(j), cellSize, cellSize);
        }
      } else if (turn >= 4 && board[j][i] === 0 && checkMinCapture(i, j)) {
        if (helperCheckbox.checked) {
          ctx.fillStyle = "#e6cb97";
          ctx.fillRect(grid(i), grid(j), cellSize, cellSize);
        }
      }
    }
  }

  gameCodeInput.value = currentGameCode;
};

const checkCaptures = (x, y) => {
  let captures = 0;

  for (let i = 0; i < 8; i++) {
    captures += checkDir(i, x, y);
  }

  return captures;
};

//check if there is at least one capture for a given move
const checkMinCapture = (x, y) => {
  if (board[y][x] !== 0) return false;
  for (let i = 0; i < 8; i++) {
    if (checkDir(i, x, y) > 0) return true;
  }
  return false;
};

//check number of captures in a given direction, 0 is left, 1 is left up, 2 is up, etc
const checkDir = (dir, x, y) => {
  let captures = 0;
  let i = x,
    j = y;
  let movement;

  while (true) {
    [i, j] = incDir(dir, i, j);
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

  return captures;
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

//start a new game
const newGame = async () => {
  try {
    const newGameResponse = await fetch(
      "http://localhost:3000?newGame&singlePlayer=" + singlePlayer,
    );

    if (newGameResponse.ok) {
      console.log("received good response from the server:");
      currentGameCode = await newGameResponse.json();
      gameCodeInput.value = currentGameCode;
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
    displayError("There was an error reaching the server");
    console.log("try-catch error");
    console.log(error);
  }

  redrawBoard();
  gameOver.style.display = "none";
};

const displayError = async (msg) => {
  gamePlayDisabled = true;
  gameNotifier.textContent = msg;
  gameNotifier.style.width = "250px";
  gameNotifier.style.display = "block";
  await new Promise((resolve) => setTimeout(resolve, 3000));
  gameNotifier.style.display = "none";
  gamePlayDisabled = false;
  redrawBoard();
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

//if there is no valid move and the opponent must play again
const skipTurn = async () => {
  gamePlayDisabled = true;
  gameNotifier.textContent = "No valid moves detected, skipping a turn";
  gameNotifier.style.width = "300px";
  gameNotifier.style.display = "block";
  await new Promise((resolve) => setTimeout(resolve, 3000));
  gameNotifier.style.display = "none";
  gamePlayDisabled = true;
  redrawBoard();
};

//player can retreive a game to pickup wherre they leftoff if they navigate away
const retrieveGame = async () => {
  currentGameCode = gameCodeInput.value;
  try {
    const retrieveResponse = await fetch(
      "http://localhost:3000?gameCode=" + currentGameCode,
    );

    if (retrieveResponse.ok) {
      let retrievedGame = await retrieveResponse.json();
      ({ _, turn, blueTurn, singlePlayer } = retrievedGame);
      board = retrievedGame.gameBoard;
      if (singlePlayer) gameModeaSelect.value = "single";
      else gameModeSelect.value = "two";
      redrawBoard();
    } else {
      displayError("The game code was not recognized");
      console.log("invalid game code");
    }
  } catch (error) {
    console.log("try-catch error");
    console.log(error);
  }

  redrawBoard();
};

//ask the player if they wish to switch moddes, in which case a new game must be started
const confirmSwitchMode = () => {
  if (gameModeSelect.value === "single") {
    //if no turn has been played, then we just start a new one in singleplayer
    if (turn === 0) {
      singlePlayer = true;
      newGame();
    } else {
      //prompt the user before switching gamemodes
    }
  }
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

  //TODO: work on multiplayer/singleplayer toggle
  document.getElementById("game-mode").addEventListener("change", () => {
    if (!gamePlayEnabled) confirmSwitchMode();
  });
});
