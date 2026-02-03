const timerDisplay = document.getElementById("timer");
const toggleButton = document.getElementById("toggle");
const pauseButton = document.getElementById("pause");
const resetButton = document.getElementById("reset");
const startSessionButton = document.getElementById("start-session");
const checklist = document.getElementById("checklist");
const newItemInput = document.getElementById("new-item");
const addButton = document.getElementById("add");

const DEFAULT_MINUTES = 25;
let remainingSeconds = DEFAULT_MINUTES * 60;
let intervalId = null;

const formatTime = (seconds) => {
  const mins = String(Math.floor(seconds / 60)).padStart(2, "0");
  const secs = String(seconds % 60).padStart(2, "0");
  return `${mins}:${secs}`;
};

const updateDisplay = () => {
  timerDisplay.textContent = formatTime(remainingSeconds);
};

const startTimer = () => {
  if (intervalId) return;
  intervalId = window.setInterval(() => {
    if (remainingSeconds > 0) {
      remainingSeconds -= 1;
      updateDisplay();
      return;
    }
    stopTimer();
  }, 1000);
};

const stopTimer = () => {
  if (!intervalId) return;
  window.clearInterval(intervalId);
  intervalId = null;
};

const resetTimer = () => {
  stopTimer();
  remainingSeconds = DEFAULT_MINUTES * 60;
  updateDisplay();
};

const addChecklistItem = () => {
  const value = newItemInput.value.trim();
  if (!value) return;
  const item = document.createElement("li");
  item.textContent = value;
  checklist.appendChild(item);
  newItemInput.value = "";
  newItemInput.focus();
};

toggleButton.addEventListener("click", startTimer);
startSessionButton.addEventListener("click", startTimer);
pauseButton.addEventListener("click", stopTimer);
resetButton.addEventListener("click", resetTimer);
addButton.addEventListener("click", addChecklistItem);
newItemInput.addEventListener("keydown", (event) => {
  if (event.key === "Enter") {
    addChecklistItem();
  }
});

updateDisplay();
