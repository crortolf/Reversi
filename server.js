const http = require("http");
const url = require("url");
const games = new Map();

//generates a random alphanumeric code with length 16
const genNewGameCode = () => {
  const chars =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let result = "";
  for (let i = 0; i < 16; i++) {
    const randomIndex = Math.floor(Math.random() * chars.length);
    result += chars[randomIndex];
  }
  return result;
};

const attemptMove = (x, y, gameCode) => {
  let { gameBoard, turn, blueTurn } = games.get(gameCode);
  //...and checks if it is the first four chips in the center four squares...
  if (
    (turn < 4 &&
      gameBoard[y][x] === 0 &&
      (x === 3 || x === 4) &&
      (y === 3 || y === 4)) ||
    //...or it is a later turn and at least on chip is captured...
    checkMinCapture(x, y, gameCode)
  ) {
    //...then places one chip accordingly if a valid move is made. captures are made from this move
    capture(x, y, gameCode);
    turn++;
    games.get(gameCode).turn++;
    games.get(gameCode).blueTurn = !blueTurn;
    //TODO: Need to add server-side check for skip turn
    //represents success
    return 1;
  } else {
    //represents failure
    return -1;
  }
  //TODO: refactor to return game data (save to map?) and move endgame check to main.js
};

//find total number of captures for a given move
const checkCaptures = (x, y, gameCode) => {
  let captures = 0;

  for (let i = 0; i < 8; i++) {
    captures += checkDir(i, x, y, gameCode);
  }

  return captures;
};

//check if there is at least one capture for a given move
const checkMinCapture = (x, y, gameCode) => {
  let board = games.get(gameCode).gameBoard;
  if (board[y][x] !== 0) return false;
  for (let i = 0; i < 8; i++) {
    if (checkDir(i, x, y, gameCode) > 0) return true;
  }
  return false;
};

//check number of captures in a given direction, 0 is left, 1 is left up, 2 is up, etc
const checkDir = (dir, x, y, gameCode) => {
  let captures = 0;
  let i = x,
    j = y;
  let movement;
  let { gameBoard, turn, blueTurn } = games.get(gameCode);

  while (true) {
    [i, j] = incDir(dir, i, j);
    if (j >= 0 && i >= 0 && j < 8 && i < 8) {
      if (
        (gameBoard[j][i] === -1 && blueTurn) ||
        (gameBoard[j][i] === 1 && !blueTurn)
      ) {
        captures++;
      } else if (
        (gameBoard[j][i] === 1 && blueTurn) ||
        (gameBoard[j][i] === -1 && !blueTurn)
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

//change array values of captures pieces and the placed chip
const capture = (x, y, gameCode) => {
  let directionalCaptures = 0;
  let row, col;
  let nextChip;
  let { gameBoard, turn, blueTurn } = games.get(gameCode);

  if (blueTurn) gameBoard[y][x] = 1;
  else gameBoard[y][x] = -1;

  for (let i = 0; i < 8; i++) {
    directionalCaptures = checkDir(i, x, y, gameCode);
    row = y;
    col = x;
    for (let j = 0; j < directionalCaptures; j++) {
      [col, row] = incDir(i, col, row);
      if (blueTurn) gameBoard[row][col] = 1;
      else gameBoard[row][col] = -1;
    }
  }
};

const server = http.createServer((req, res) => {
  const gameRequest = new URL(req.url, "http://127.0.0.1:5500");

  //needs to allow reqests from a certain origin (client side app)
  res.setHeader("Access-Control-Allow-Origin", "http://127.0.0.1:5500");
  res.setHeader(
    "Access-Control-Allow-Methods",
    "GET, POST, PUT, DELETE, OPTIONS",
  );

  if (req.method === "OPTIONS") {
    res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");
    res.writeHead(204);
    res.end();
    return;

    //generates a new game and logs it in the map with a random game code
    //returns the game code as well as the new empty board
  } else if (req.method === "GET" && gameRequest.searchParams.has("newGame")) {
    let newBoard = [];
    for (let i = 0; i < 8; i++) {
      newBoard.push([0, 0, 0, 0, 0, 0, 0, 0]);
    }
    gameCode = genNewGameCode();
    games.set(gameCode, { gameBoard: newBoard, turn: 0, blueTurn: true });
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify(gameCode));
    // request for a game to display
  } else if (req.method === "GET") {
    gameCode = gameRequest.searchParams.get("gameCode");
    //if the game code maps to an existing game, return it
    if (games.has(gameCode)) {
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify(games.get(gameCode)));
      //else return game not found
    } else {
      res.writeHead(404, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "Game not found" }));
    }
    //checking for a move being made in a game
  } else if (req.method === "POST") {
    let body = "";

    req.on("data", (chunk) => {
      body += chunk; // accumulate each chunk as it arrives
    });

    req.on("end", () => {
      try {
        const { xCoord, yCoord, gameCode } = JSON.parse(body);
        const moveResult = attemptMove(xCoord, yCoord, gameCode);
        if (moveResult === 1) {
          res.writeHead(200, { "Content-Type": "application/json" });
          res.end(JSON.stringify(games.get(gameCode)));
        } else {
          res.writeHead(400, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ error: "invalid move" }));
        }
      } catch (err) {
        console.log("Failed to parse body:", err);
        res.writeHead(400, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: "Invalid JSON format" }));
      }
    });
  }
});

server.listen(3000, () => console.log("Server running on port 3000"));
