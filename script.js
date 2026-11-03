
// Water Quest — Project 6

const GOAL = 20;

const MODES = {
  easy: {
    time: 60,
    speed: 1050,
    danger: 0.12
  },
  normal: {
    time: 45,
    speed: 850,
    danger: 0.22
  },
  hard: {
    time: 30,
    speed: 600,
    danger: 0.32
  }
};

// Milestone messages
const MILESTONES = [
  {
    score: 5,
    message: "5 cans collected — great start! Keep making a splash!"
  },
  {
    score: 10,
    message: "Halfway there! 10 cans collected. Every drop counts!"
  },
  {
    score: 15,
    message: "15 cans! You're almost a Water Quest champion!"
  },
  {
    score: 20,
    message: "Amazing! You reached 20 cans and completed the quest!"
  }
];

let score = 0;
let timeLeft = 30;
let best = 0;
let active = false;

let countdown = null;
let spawner = null;
let lastMilestone = 0;
let audio = null;

// HTML elements
const grid = document.querySelector(".game-grid");

const scoreEl = document.getElementById("current-cans");
const timerEl = document.getElementById("timer");
const bestEl = document.getElementById("best-score");

const message = document.getElementById("achievements");

const startBtn = document.getElementById("start-game");
const resetBtn = document.getElementById("reset-game");

const difficulty = document.getElementById("difficulty");

const progress = document.getElementById("progress-fill");
const progressTrack = document.getElementById("progress-track");

const confetti = document.getElementById("confetti-layer");

// Get selected difficulty
function settings() {
  return MODES[difficulty.value] || MODES.normal;
}

// Create the 3x3 game grid
function createGrid() {
  grid.innerHTML = "";

  for (let i = 0; i < 9; i++) {
    const cell = document.createElement("button");

    cell.type = "button";
    cell.className = "grid-cell";
    cell.disabled = true;

    cell.setAttribute("aria-label", `Empty cell ${i + 1}`);

    cell.addEventListener("click", () => collect(cell));

    grid.appendChild(cell);
  }
}

// Update score, timer, and progress
function update() {
  scoreEl.textContent = score;
  timerEl.textContent = timeLeft;
  bestEl.textContent = best;

  progress.style.width =
    `${Math.min(100, score / GOAL * 100)}%`;

  progressTrack.setAttribute("aria-valuenow", score);
}

// Display feedback messages
function say(text, kind = "") {
  message.textContent = text;
  message.className = `achievement ${kind}`.trim();
}

// Clear targets from the board
function clearTargets() {
  grid.querySelectorAll(".grid-cell").forEach(cell => {
    cell.replaceChildren();

    cell.classList.remove(
      "has-can",
      "has-obstacle"
    );

    cell.disabled = !active;
    cell.setAttribute("aria-label", "Empty game cell");
  });
}

// Sound effects using JavaScript Web Audio
function sound(kind) {
  try {
    const Ctx =
      window.AudioContext ||
      window.webkitAudioContext;

    if (!Ctx) return;

    if (!audio) audio = new Ctx();

    if (audio.state === "suspended") {
      audio.resume();
    }

    const tones = {
      collect: [720, 1050, 0.12, "sine"],
      obstacle: [190, 110, 0.2, "sawtooth"],
      win: [520, 1040, 0.42, "triangle"],
      button: [420, 520, 0.07, "sine"]
    };

    const [from, to, duration, wave] =
      tones[kind] || tones.button;

    const osc = audio.createOscillator();
    const gain = audio.createGain();

    const now = audio.currentTime;

    osc.type = wave;

    osc.frequency.setValueAtTime(from, now);

    osc.frequency.exponentialRampToValueAtTime(
      to,
      now + duration
    );

    gain.gain.setValueAtTime(0.0001, now);

    gain.gain.exponentialRampToValueAtTime(
      0.12,
      now + 0.015
    );

    gain.gain.exponentialRampToValueAtTime(
      0.0001,
      now + duration
    );

    osc.connect(gain);
    gain.connect(audio.destination);

    osc.start(now);
    osc.stop(now + duration + 0.02);

  } catch (e) {
    // Game continues if sound is unavailable.
  }
}

// Spawn a water can or pollution obstacle
function spawn() {
  if (!active) return;

  clearTargets();

  const cells = [
    ...grid.querySelectorAll(".grid-cell")
  ];

  const cell =
    cells[Math.floor(Math.random() * cells.length)];

  const obstacle =
    Math.random() < settings().danger;

  const target = document.createElement("span");

  target.setAttribute("aria-hidden", "true");

  if (obstacle) {
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

  cell.disabled = false;
  cell.appendChild(target);
}

// Check for milestone achievements
function checkMilestone() {
  const item = MILESTONES.find(m =>
    m.score === score &&
    m.score > lastMilestone
  );

  if (!item) return false;

  lastMilestone = item.score;

  say(item.message, "success");

  return true;
}

// Handle clicking a target
function collect(cell) {
  if (
    !active ||
    (
      !cell.classList.contains("has-can") &&
      !cell.classList.contains("has-obstacle")
    )
  ) {
    return;
  }

  const hitDanger =
    cell.classList.contains("has-obstacle");

  // Remove clicked target from the DOM
  cell.replaceChildren();

  cell.classList.remove(
    "has-can",
    "has-obstacle"
  );

  cell.disabled = true;

  if (hitDanger) {
    score = Math.max(0, score - 2);

    say(
      "Oops! Pollution costs 2 points. Watch out!",
      "warning"
    );

    sound("obstacle");

  } else {
    score++;

    best = Math.max(best, score);

    sound("collect");

    if (score >= GOAL) {
      score = GOAL;

      update();

      finish(true);

      return;
    }

    if (!checkMilestone()) {
      say("Nice catch! Every drop counts.", "success");
    }
  }

  update();

  spawn();
}

// Start game
function startGame() {
  if (active) return;

  score = 0;

  timeLeft = settings().time;

  lastMilestone = 0;

  active = true;

  confetti.replaceChildren();

  update();

  clearTargets();

  startBtn.disabled = true;
  difficulty.disabled = true;

  startBtn.textContent = "Game in Progress…";

  say(
    "Go! Collect yellow cans and avoid red pollution drops!"
  );

  sound("button");

  spawn();

  spawner = setInterval(
    spawn,
    settings().speed
  );

  countdown = setInterval(() => {
    timeLeft--;

    update();

    if (timeLeft <= 0) {
      finish(false);
    }

  }, 1000);
}

// End game
function finish(won) {
  active = false;

  clearInterval(countdown);
  clearInterval(spawner);

  countdown = null;
  spawner = null;

  clearTargets();

  startBtn.disabled = false;
  difficulty.disabled = false;

  startBtn.textContent =
    won ? "Play Again" : "Try Again";

  if (won) {
    say(
      "You did it! 20 cans collected — you're a Water Quest champion!",
      "success"
    );

    sound("win");

    celebrate();

  } else {
    say(
      `Time's up! You collected ${score} of ${GOAL} cans. Try again!`,
      "warning"
    );
  }

  update();
}

// Reset game
function resetGame() {
  active = false;

  clearInterval(countdown);
  clearInterval(spawner);

  countdown = null;
  spawner = null;

  score = 0;

  timeLeft = settings().time;

  lastMilestone = 0;

  startBtn.disabled = false;
  difficulty.disabled = false;

  startBtn.textContent = "Start Game";

  confetti.replaceChildren();

  clearTargets();

  update();

  say(
    "Game reset. Choose your difficulty and start again!"
  );
}

// Confetti celebration
function celebrate() {
  const colors = [
    "#ffc907",
    "#2e9df7",
    "#4fcb53",
    "#ff902a",
    "#f16061",
    "#8bd1cb"
  ];

  for (let i = 0; i < 90; i++) {
    const bit = document.createElement("span");

    bit.className = "confetti";

    bit.style.left =
      `${Math.random() * 100}%`;

    bit.style.backgroundColor =
      colors[Math.floor(Math.random() * colors.length)];

    bit.style.animationDelay =
      `${Math.random() * 1.2}s`;

    bit.style.setProperty(
      "--drift",
      `${Math.random() * 160 - 80}px`
    );

    confetti.appendChild(bit);
  }

  setTimeout(() => {
    confetti.replaceChildren();
  }, 3500);
}

// Button events
startBtn.addEventListener("click", startGame);

resetBtn.addEventListener("click", () => {
  sound("button");
  resetGame();
});

// Difficulty change
difficulty.addEventListener("change", () => {
  if (!active) {
    timeLeft = settings().time;

    timerEl.textContent = timeLeft;

    say(
      `${difficulty.options[difficulty.selectedIndex].text} selected. Ready to play?`
    );
  }
});

// Initialize game
createGrid();
resetGame();
