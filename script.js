
// Water Quest game configuration
const GOAL_CANS = 20;
const GAME_LENGTH = 30;
const CELL_COUNT = 9;
const OBSTACLE_CHANCE = 0.22;

let currentCans = 0;
let timeLeft = GAME_LENGTH;
let gameActive = false;
let countdownInterval = null;
let spawnInterval = null;
let bestScore = 0;

const grid = document.querySelector(".game-grid");
const scoreDisplay = document.getElementById("current-cans");
const timerDisplay = document.getElementById("timer");
const bestDisplay = document.getElementById("best-score");
const message = document.getElementById("achievements");
const startButton = document.getElementById("start-game");
const resetButton = document.getElementById("reset-game");
const progressTrack = document.getElementById("progress-track");
const progressFill = document.getElementById("progress-fill");
const confettiLayer = document.getElementById("confetti-layer");

// Build the 3x3 game board
function createGrid() {
  grid.innerHTML = "";

  for (let i = 0; i < CELL_COUNT; i++) {
    const cell = document.createElement("button");

    cell.type = "button";
    cell.className = "grid-cell";
    cell.setAttribute("aria-label", `Empty cell ${i + 1}`);

    cell.addEventListener("click", () => handleCellClick(cell));

    grid.appendChild(cell);
  }
}

// Update score, timer, best score, and progress bar
function updateStats() {
  scoreDisplay.textContent = currentCans;
  timerDisplay.textContent = timeLeft;
  bestDisplay.textContent = bestScore;

  progressFill.style.width =
    `${Math.min(100, (currentCans / GOAL_CANS) * 100)}%`;

  progressTrack.setAttribute("aria-valuenow", currentCans);
}

// Display game feedback
function showMessage(text, kind = "") {
  message.textContent = text;
  message.className = `achievement ${kind}`.trim();
}

// Clear all targets from the board
function clearTargets() {
  grid.querySelectorAll(".grid-cell").forEach(cell => {
    cell.replaceChildren();
    cell.classList.remove("has-can", "has-obstacle", "hit");
    cell.setAttribute("aria-label", "Empty game cell");
    cell.disabled = !gameActive;
  });
}

// Spawn a random water can or pollution obstacle
function spawnTarget() {
  if (!gameActive) return;

  clearTargets();

  const cells = [...grid.querySelectorAll(".grid-cell")];
  const cell = cells[Math.floor(Math.random() * cells.length)];
  const isObstacle = Math.random() < OBSTACLE_CHANCE;

  const target = document.createElement("span");

  if (isObstacle) {
    target.className = "target obstacle";
    target.textContent = "!";
    cell.classList.add("has-obstacle");
    cell.setAttribute(
      "aria-label",
      "Pollution obstacle: lose 2 points"
    );
  } else {
    target.className = "target water-can";
    cell.classList.add("has-can");
    cell.setAttribute(
      "aria-label",
      "Yellow water can: collect 1 point"
    );
  }

  target.setAttribute("aria-hidden", "true");
  cell.appendChild(target);
}

// Handle clicking a can or obstacle
function handleCellClick(cell) {
  if (
    !gameActive ||
    (!cell.classList.contains("has-can") &&
     !cell.classList.contains("has-obstacle"))
  ) {
    return;
  }

  if (cell.classList.contains("has-obstacle")) {
    currentCans = Math.max(0, currentCans - 2);

    showMessage(
      "Oops! Pollution costs 2 points. Keep going!",
      "warning"
    );
  } else {
    currentCans += 1;

    if (currentCans > bestScore) {
      bestScore = currentCans;
    }

    if (currentCans >= GOAL_CANS) {
      currentCans = GOAL_CANS;
      updateStats();
      endGame(true);
      return;
    }

    if ([5, 10, 15].includes(currentCans)) {
      showMessage(
        `Great work! ${currentCans} cans collected — you're making a splash!`,
        "success"
      );
    } else {
      showMessage("Nice catch! Every drop counts.", "success");
    }
  }

  updateStats();
  spawnTarget();
}

// Start a new round
function startGame() {
  if (gameActive) return;

  currentCans = 0;
  timeLeft = GAME_LENGTH;
  gameActive = true;

  confettiLayer.replaceChildren();

  updateStats();
  clearTargets();

  startButton.disabled = true;
  startButton.textContent = "Game in Progress…";

  showMessage("Go! Tap yellow cans and avoid red pollution drops.");

  spawnTarget();

  spawnInterval = setInterval(spawnTarget, 850);

  countdownInterval = setInterval(() => {
    timeLeft--;
    updateStats();

    if (timeLeft <= 0) {
      endGame(false);
    }
  }, 1000);
}

// Stop the game and show the result
function endGame(won) {
  gameActive = false;

  clearInterval(countdownInterval);
  clearInterval(spawnInterval);

  countdownInterval = null;
  spawnInterval = null;

  clearTargets();

  startButton.disabled = false;
  startButton.textContent = won ? "Play Again" : "Try Again";

  if (won) {
    showMessage(
      "You did it! 20 cans collected — you're a Water Quest champion!",
      "success"
    );

    launchConfetti();
  } else {
    showMessage(
      `Time's up! You collected ${currentCans} of ${GOAL_CANS} cans. Try again!`,
      "warning"
    );
  }

  updateStats();
}

// Reset everything to its initial state
function resetGame() {
  gameActive = false;

  clearInterval(countdownInterval);
  clearInterval(spawnInterval);

  countdownInterval = null;
  spawnInterval = null;

  currentCans = 0;
  timeLeft = GAME_LENGTH;

  startButton.disabled = false;
  startButton.textContent = "Start Game";

  confettiLayer.replaceChildren();

  clearTargets();
  updateStats();

  showMessage("Game reset. Ready for another quest?");
}

// Create a colorful confetti celebration
function launchConfetti() {
  const colors = [
    "#ffc907",
    "#2e9df7",
    "#4fcb53",
    "#ff902a",
    "#f16061",
    "#8bd1cb"
  ];

  for (let i = 0; i < 90; i++) {
    const piece = document.createElement("span");

    piece.className = "confetti";
    piece.style.left = `${Math.random() * 100}%`;
    piece.style.backgroundColor =
      colors[Math.floor(Math.random() * colors.length)];

    piece.style.animationDelay = `${Math.random() * 1.2}s`;

    piece.style.setProperty(
      "--drift",
      `${Math.random() * 160 - 80}px`
    );

    confettiLayer.appendChild(piece);
  }

  setTimeout(() => {
    confettiLayer.replaceChildren();
  }, 3500);
}

// Connect the buttons and initialize the game
startButton.addEventListener("click", startGame);
resetButton.addEventListener("click", resetGame);

createGrid();
resetGame();
