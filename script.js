const urlParams = new URLSearchParams(window.location.search);

const lengths = {
  pomodoro: (Number(urlParams.get('pomodoro')) || 25) * 60,
  shortBreak: (Number(urlParams.get('shortBreak')) || 5) * 60,
  longBreak: (Number(urlParams.get('longBreak')) || 10) * 60,
}

const breakSound = new Audio('sounds/break.mp3');
const workSound = new Audio('sounds/work.mp3');

let numberOfSessions = 0;
let maxSessions = Number(urlParams.get('maxSessions')) || 0;
let omitSessions = urlParams.has('omitSessions');
let mode;
let interval;
let length;
let paused;
let remainingTime;
let endTime;

document.querySelector('#mode-buttons').addEventListener('click', function (event) {
  const { mode: newMode } = event.target.dataset;
  if (!newMode) return;

  mode = newMode;

  document.querySelectorAll('button[data-mode]').forEach(e => e.classList.remove('active'));
  document.querySelector(`[data-mode="${mode}"]`).classList.add('active');

  length = lengths[mode];
  startTimer();
});

document.querySelector('#pause-button').addEventListener('click', function (event) {
  if (paused) {
    endTime = Date.now() + remainingTime * 1000;
    runTimer();
  } else if (interval) {
    clearInterval(interval);
    interval = null;
    paused = true;
    document.querySelector('#pause-button').classList.add('active');
    document.title = 'PAUSED';
    document.getElementById('text').textContent = 'PAUSED';
  }
});

document.querySelector('#adjust-buttons').addEventListener('click', function (event) {
  if (paused) {
    return;
  }

  const { action } = event.target.dataset;

  switch (action) {
    case "plus":
      if (interval) {
        length += 60;
        endTime += 60000;
        updateClock();
      } else {
        length = 60;
        startTimer();
      }
      break;
    case "minus":
      if (interval) {
        length -= 60;
        endTime -= 60000;
        if (endTime < 0) {
          endTime = 0;
        }
        updateClock();
      }
      break;
  }
});

function updateClock() {
  remainingTime = (endTime - Date.now()) / 1000;
  if (remainingTime <= 0) {
    remainingTime = 0;
    clearInterval(interval);
    interval = null;
    
    // Auto-switch to next mode
    if (mode === 'pomodoro') {
      breakSound.play();
      mode = 'shortBreak';
    } else {
      workSound.play();
      mode = 'pomodoro';
    }
    
    // Update UI for new mode
    document.querySelectorAll('button[data-mode]').forEach(e => e.classList.remove('active'));
    document.querySelector(`[data-mode="${mode}"]`).classList.add('active');

    // Start new timer when not at max sessions, but will still run a last break session
    // TODO: after the last break the text still changes to Focus Time instead of End of Session
    if (maxSessions === 0 || numberOfSessions < maxSessions || mode === 'shortBreak') {
      length = lengths[mode];
      startTimer();
    }
  }

  const remainingSeconds = Math.round(remainingTime);
  const minutes = Math.floor(remainingSeconds / 60).toString().padStart(2, '0');
  const seconds = (remainingSeconds % 60).toString().padStart(2, '0');
  const time = `${minutes}:${seconds}`;

  document.getElementById('clock').textContent = time;

  const text = mode === 'pomodoro' ? 'FOCUS TIME' : 'BREAK TIME';
  const subtext = maxSessions > 0 ? `Pomo ${numberOfSessions}/${maxSessions}` : `Pomo #${numberOfSessions}`;
  document.title = `${time} - ${text}`;
  document.getElementById('text').textContent = text;
  document.getElementById('subtext').textContent = omitSessions ? '' : subtext;

  const progress = length == 0 ? 1 : ((length - remainingTime) / length);
  document.getElementById('progress-value').style.width = progress * 100 + "vw";
}

function runTimer() {
  clearInterval(interval);
  paused = false;
  document.querySelector('#pause-button').classList.remove('active')
  updateClock();
  interval = setInterval(updateClock, 100);
}

function startTimer() {
  if (mode === 'pomodoro') {
    numberOfSessions += 1;
  }
  endTime = Date.now() + length * 1000;
  runTimer();
}
