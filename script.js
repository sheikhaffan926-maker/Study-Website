const timerDisplay = document.getElementById('timer');
const startBtn = document.getElementById('startBtn');
const pauseBtn = document.getElementById('pauseBtn');
const resetBtn = document.getElementById('resetBtn');
const themeToggle = document.getElementById('themeToggle');
const body = document.body;

const lambdaUrl = 'https://lqgn6idvg6trk2n4sizcawuo2a0brhth.lambda-url.ap-south-1.on.aws/';
let seconds = 40 * 60;
let intervalId = null;
let isRunning = false;

function formatTime(value) {
  const minutes = Math.floor(value / 60);
  const secondsLeft = value % 60;
  return `${minutes.toString().padStart(2, '0')}:${secondsLeft.toString().padStart(2, '0')}`;
}

function updateTimerDisplay() {
  timerDisplay.textContent = formatTime(seconds);
}

function startTimer() {
  if (isRunning) return;
  isRunning = true;
  intervalId = setInterval(() => {
    if (seconds <= 0) {
      clearInterval(intervalId);
      isRunning = false;
      timerDisplay.textContent = '00:00';
      return;
    }
    seconds -= 1;
    updateTimerDisplay();
  }, 1000);
}

function pauseTimer() {
  if (!isRunning) return;
  clearInterval(intervalId);
  isRunning = false;
}

function resetTimer() {
  pauseTimer();
  seconds = 40 * 60;
  updateTimerDisplay();
}

function toggleTheme() {
  body.classList.toggle('light-theme');
  const isLight = body.classList.contains('light-theme');
  themeToggle.textContent = isLight ? 'Light' : 'Dark';
}

startBtn.addEventListener('click', startTimer);
pauseBtn.addEventListener('click', pauseTimer);
resetBtn.addEventListener('click', resetTimer);
themeToggle.addEventListener('click', toggleTheme);

updateTimerDisplay();

callLambda();

async function callLambda() {
  try {
    const response = await fetch(lambdaUrl, { method: 'GET' });
    const contentType = response.headers.get('content-type') || '';
    const data = contentType.includes('application/json')
      ? await response.json()
      : await response.text();

    console.log('Lambda response:', data);


    if (data && data.count !== undefined) {
      
      const visitorElement = document.getElementById('visitorCount'); 
      if (visitorElement) {
        visitorElement.textContent = data.count;
      }
    }
    
  } catch (error) {
    console.error('Lambda call failed:', error);
  }
}
