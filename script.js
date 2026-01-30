// Timer State
let timerState = {
    isRunning: false,
    startTime: null,
    elapsedTime: 0,
    currentSide: 'left',
    intervalId: null
};

// DOM Elements
const timerDisplay = document.getElementById('timerDisplay');
const startBtn = document.getElementById('startBtn');
const stopBtn = document.getElementById('stopBtn');
const leftBtn = document.getElementById('leftBtn');
const rightBtn = document.getElementById('rightBtn');
const historyList = document.getElementById('historyList');
const lastFeeding = document.getElementById('lastFeeding');
const clearHistoryBtn = document.getElementById('clearHistoryBtn');
const timerDisplayContainer = document.querySelector('.timer-display');

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    loadHistory();
    updateLastFeedingDisplay();
    setupEventListeners();
    initializePWA();
});

// PWA Initialization
let deferredPrompt;

function initializePWA() {
    // Register service worker
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('./service-worker.js')
            .then((registration) => {
                console.log('Service Worker registered:', registration);
            })
            .catch((error) => {
                console.log('Service Worker registration failed:', error);
            });
    }

    // Handle install prompt
    window.addEventListener('beforeinstallprompt', (e) => {
        // Prevent the mini-infobar from appearing on mobile
        e.preventDefault();
        // Stash the event so it can be triggered later
        deferredPrompt = e;
        // Show install button
        showInstallPromotion();
    });

    // Handle successful installation
    window.addEventListener('appinstalled', () => {
        console.log('PWA was installed');
        deferredPrompt = null;
        hideInstallPromotion();
    });
}

function showInstallPromotion() {
    // Create install button if it doesn't exist
    if (document.getElementById('installBtn')) return;

    const installBtn = document.createElement('button');
    installBtn.id = 'installBtn';
    installBtn.className = 'btn btn-install';
    installBtn.innerHTML = `
        <span class="btn-icon">📲</span>
        <span class="btn-text">Встановити додаток</span>
    `;

    installBtn.addEventListener('click', async () => {
        if (!deferredPrompt) return;

        // Show the install prompt
        deferredPrompt.prompt();

        // Wait for the user to respond to the prompt
        const { outcome } = await deferredPrompt.userChoice;
        console.log(`User response to the install prompt: ${outcome}`);

        // Clear the deferredPrompt
        deferredPrompt = null;
        hideInstallPromotion();
    });

    // Insert after the controls section
    const controls = document.querySelector('.controls');
    controls.appendChild(installBtn);
}

function hideInstallPromotion() {
    const installBtn = document.getElementById('installBtn');
    if (installBtn) {
        installBtn.remove();
    }
}


// Event Listeners
function setupEventListeners() {
    startBtn.addEventListener('click', startTimer);
    stopBtn.addEventListener('click', stopTimer);
    leftBtn.addEventListener('click', () => selectSide('left'));
    rightBtn.addEventListener('click', () => selectSide('right'));
    clearHistoryBtn.addEventListener('click', clearHistory);
}

// Side Selection
function selectSide(side) {
    timerState.currentSide = side;

    // Update UI
    leftBtn.classList.toggle('active', side === 'left');
    rightBtn.classList.toggle('active', side === 'right');
}

// Timer Functions
function startTimer() {
    if (timerState.isRunning) return;

    timerState.isRunning = true;
    timerState.startTime = Date.now() - timerState.elapsedTime;

    // Update UI
    startBtn.classList.add('hidden');
    stopBtn.classList.remove('hidden');
    timerDisplayContainer.classList.add('running');

    // Start interval
    timerState.intervalId = setInterval(updateTimer, 100);
}

function stopTimer() {
    if (!timerState.isRunning) return;

    timerState.isRunning = false;
    clearInterval(timerState.intervalId);

    // Save to history
    saveToHistory();

    // Reset timer
    timerState.elapsedTime = 0;
    timerState.startTime = null;

    // Update UI
    stopBtn.classList.add('hidden');
    startBtn.classList.remove('hidden');
    timerDisplayContainer.classList.remove('running');
    timerDisplay.textContent = '00:00';

    // Update last feeding display
    updateLastFeedingDisplay();
}

function updateTimer() {
    timerState.elapsedTime = Date.now() - timerState.startTime;

    const totalSeconds = Math.floor(timerState.elapsedTime / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;

    timerDisplay.textContent = `${padZero(minutes)}:${padZero(seconds)}`;
}

function padZero(num) {
    return num.toString().padStart(2, '0');
}

// History Management
function saveToHistory() {
    const feeding = {
        id: Date.now(),
        timestamp: new Date().toISOString(),
        duration: timerState.elapsedTime,
        side: timerState.currentSide
    };

    // Get existing history
    let history = getHistory();

    // Add new feeding to the beginning
    history.unshift(feeding);

    // Keep only last 50 entries
    if (history.length > 50) {
        history = history.slice(0, 50);
    }

    // Save to localStorage
    localStorage.setItem('feedingHistory', JSON.stringify(history));

    // Update display
    renderHistory();
}

function getHistory() {
    const historyJson = localStorage.getItem('feedingHistory');
    return historyJson ? JSON.parse(historyJson) : [];
}

function loadHistory() {
    renderHistory();
}

function renderHistory() {
    const history = getHistory();

    if (history.length === 0) {
        historyList.innerHTML = '<div class="empty-state">Історія годувань з\'явиться тут</div>';
        return;
    }

    historyList.innerHTML = history.map(feeding => {
        const date = new Date(feeding.timestamp);
        const timeStr = formatTime(date);
        const durationStr = formatDuration(feeding.duration);
        const sideIcon = feeding.side === 'left' ? '👈' : '👉';
        const sideText = feeding.side === 'left' ? 'Ліва' : 'Права';

        return `
            <div class="history-item">
                <div class="history-info">
                    <div class="history-time">${timeStr}</div>
                    <div class="history-details">${durationStr} • ${sideText}</div>
                </div>
                <div class="history-side">${sideIcon}</div>
            </div>
        `;
    }).join('');
}

function updateLastFeedingDisplay() {
    const history = getHistory();

    if (history.length === 0) {
        lastFeeding.innerHTML = `
            <div class="info-label">Останнє годування:</div>
            <div class="info-text">Ще не було записів</div>
        `;
        return;
    }

    const last = history[0];
    const date = new Date(last.timestamp);
    const timeStr = formatTime(date);
    const durationStr = formatDuration(last.duration);
    const sideText = last.side === 'left' ? 'Ліва' : 'Права';
    const sideIcon = last.side === 'left' ? '👈' : '👉';

    // Calculate time ago
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const timeAgo = formatTimeAgo(diffMins);

    // Suggest next side
    const nextSide = last.side === 'left' ? 'right' : 'left';
    const nextSideText = nextSide === 'left' ? 'Ліва' : 'Права';
    const nextSideIcon = nextSide === 'left' ? '👈' : '👉';

    // Auto-select next side
    selectSide(nextSide);

    lastFeeding.innerHTML = `
        <div class="info-label">Останнє годування:</div>
        <div class="info-text">${sideIcon} ${sideText} • ${durationStr} • ${timeAgo}</div>
        <div class="info-label" style="margin-top: 0.5rem;">Наступна:</div>
        <div class="info-text">${nextSideIcon} ${nextSideText}</div>
    `;
}

function clearHistory() {
    if (!confirm('Ви впевнені, що хочете очистити всю історію?')) {
        return;
    }

    localStorage.removeItem('feedingHistory');
    renderHistory();
    updateLastFeedingDisplay();
}

// Formatting Helpers
function formatTime(date) {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    const isToday = date.toDateString() === today.toDateString();
    const isYesterday = date.toDateString() === yesterday.toDateString();

    const timeStr = date.toLocaleTimeString('uk-UA', {
        hour: '2-digit',
        minute: '2-digit'
    });

    if (isToday) {
        return `Сьогодні, ${timeStr}`;
    } else if (isYesterday) {
        return `Вчора, ${timeStr}`;
    } else {
        const dateStr = date.toLocaleDateString('uk-UA', {
            day: 'numeric',
            month: 'short'
        });
        return `${dateStr}, ${timeStr}`;
    }
}

function formatDuration(ms) {
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;

    if (minutes === 0) {
        return `${seconds} сек`;
    }

    return `${minutes} хв ${seconds} сек`;
}

function formatTimeAgo(minutes) {
    if (minutes < 1) {
        return 'щойно';
    } else if (minutes < 60) {
        return `${minutes} хв тому`;
    } else {
        const hours = Math.floor(minutes / 60);
        if (hours === 1) {
            return '1 год тому';
        } else if (hours < 24) {
            return `${hours} год тому`;
        } else {
            const days = Math.floor(hours / 24);
            return `${days} дн тому`;
        }
    }
}

// Prevent screen sleep (optional, works on some browsers)
if ('wakeLock' in navigator) {
    let wakeLock = null;

    async function requestWakeLock() {
        try {
            wakeLock = await navigator.wakeLock.request('screen');
        } catch (err) {
            console.log('Wake Lock error:', err);
        }
    }

    // Request wake lock when timer starts
    const originalStartTimer = startTimer;
    startTimer = function () {
        originalStartTimer();
        requestWakeLock();
    };

    // Release wake lock when timer stops
    const originalStopTimer = stopTimer;
    stopTimer = function () {
        originalStopTimer();
        if (wakeLock) {
            wakeLock.release();
            wakeLock = null;
        }
    };
}
