// Timer State
let timerState = {
    isRunning: false,
    startTime: null,
    elapsedTime: 0,
    currentSide: 'left',
    intervalId: null,
    countdownEnabled: false,
    countdownDuration: 15 * 60 * 1000, // 15 minutes in ms
    reminderInterval: null,
    reminderEnabled: false
};

// DOM Elements - Original
const timerDisplay = document.getElementById('timerDisplay');
const startBtn = document.getElementById('startBtn');
const stopBtn = document.getElementById('stopBtn');
const leftBtn = document.getElementById('leftBtn');
const rightBtn = document.getElementById('rightBtn');
const historyList = document.getElementById('historyList');
const lastFeeding = document.getElementById('lastFeeding');
const clearHistoryBtn = document.getElementById('clearHistoryBtn');
const timerDisplayContainer = document.querySelector('.timer-display');

// DOM Elements - New Features
const themeToggle = document.getElementById('themeToggle');
const settingsBtn = document.getElementById('settingsBtn');
const statsBtn = document.getElementById('statsBtn');
const exportBtn = document.getElementById('exportBtn');
const shareBtn = document.getElementById('shareBtn');

// Modals
const statsModal = document.getElementById('statsModal');
const settingsModal = document.getElementById('settingsModal');
const notesModal = document.getElementById('notesModal');
const closeStatsModal = document.getElementById('closeStatsModal');
const closeSettingsModal = document.getElementById('closeSettingsModal');

// Countdown
const countdownEnabled = document.getElementById('countdownEnabled');
const countdownSettings = document.getElementById('countdownSettings');
const countdownDuration = document.getElementById('countdownDuration');

// Settings
const soundEnabled = document.getElementById('soundEnabled');
const soundVolume = document.getElementById('soundVolume');
const volumeValue = document.getElementById('volumeValue');
const reminderEnabled = document.getElementById('reminderEnabled');
const testSoundBtn = document.getElementById('testSoundBtn');
const themeRadios = document.querySelectorAll('input[name="theme"]');

// Notes
const feedingNotes = document.getElementById('feedingNotes');
const saveNotesBtn = document.getElementById('saveNotesBtn');
const skipNotesBtn = document.getElementById('skipNotesBtn');

// Chart
let weeklyChart = null;

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    loadHistory();
    updateLastFeedingDisplay();
    setupEventListeners();
    initializePWA();
    loadSettings();
    initializeTheme();
});

// PWA Initialization
let deferredPrompt;

function initializePWA() {
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('./service-worker.js')
            .then((registration) => {
                console.log('Service Worker registered:', registration);
            })
            .catch((error) => {
                console.log('Service Worker registration failed:', error);
            });
    }

    window.addEventListener('beforeinstallprompt', (e) => {
        e.preventDefault();
        deferredPrompt = e;
        showInstallPromotion();
    });

    window.addEventListener('appinstalled', () => {
        console.log('PWA was installed');
        deferredPrompt = null;
        hideInstallPromotion();
    });
}

function showInstallPromotion() {
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
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        console.log(`User response to the install prompt: ${outcome}`);
        deferredPrompt = null;
        hideInstallPromotion();
    });

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
    // Original listeners
    startBtn.addEventListener('click', startTimer);
    stopBtn.addEventListener('click', stopTimer);
    leftBtn.addEventListener('click', () => selectSide('left'));
    rightBtn.addEventListener('click', () => selectSide('right'));
    clearHistoryBtn.addEventListener('click', clearHistory);

    // New feature listeners
    themeToggle.addEventListener('click', cycleTheme);
    settingsBtn.addEventListener('click', () => openModal(settingsModal));
    statsBtn.addEventListener('click', openStatsModal);
    exportBtn.addEventListener('click', exportData);
    shareBtn.addEventListener('click', shareData);

    // Modal close
    closeStatsModal.addEventListener('click', () => closeModal(statsModal));
    closeSettingsModal.addEventListener('click', () => closeModal(settingsModal));

    // Click outside modal to close
    [statsModal, settingsModal, notesModal].forEach(modal => {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) closeModal(modal);
        });
    });

    // Countdown
    countdownEnabled.addEventListener('change', (e) => {
        timerState.countdownEnabled = e.target.checked;
        countdownSettings.classList.toggle('hidden', !e.target.checked);
        localStorage.setItem('countdownEnabled', e.target.checked);
    });

    countdownDuration.addEventListener('change', (e) => {
        timerState.countdownDuration = parseInt(e.target.value) * 60 * 1000;
        localStorage.setItem('countdownDuration', e.target.value);
    });

    // Settings
    soundEnabled.addEventListener('change', (e) => {
        soundManager.setEnabled(e.target.checked);
    });

    soundVolume.addEventListener('input', (e) => {
        const volume = e.target.value / 100;
        soundManager.setVolume(volume);
        volumeValue.textContent = `${e.target.value}%`;
    });

    reminderEnabled.addEventListener('change', (e) => {
        timerState.reminderEnabled = e.target.checked;
        localStorage.setItem('reminderEnabled', e.target.checked);
    });

    testSoundBtn.addEventListener('click', () => {
        soundManager.playCompletionSound();
    });

    themeRadios.forEach(radio => {
        radio.addEventListener('change', (e) => {
            if (e.target.checked) {
                setTheme(e.target.value);
            }
        });
    });

    // Notes
    saveNotesBtn.addEventListener('click', () => {
        saveFeeding(feedingNotes.value.trim());
        feedingNotes.value = '';
        closeModal(notesModal);
    });

    skipNotesBtn.addEventListener('click', () => {
        saveFeeding('');
        feedingNotes.value = '';
        closeModal(notesModal);
    });
}

// Load Settings
function loadSettings() {
    // Load countdown settings
    const savedCountdownEnabled = localStorage.getItem('countdownEnabled') === 'true';
    const savedCountdownDuration = localStorage.getItem('countdownDuration') || '15';

    countdownEnabled.checked = savedCountdownEnabled;
    timerState.countdownEnabled = savedCountdownEnabled;
    countdownSettings.classList.toggle('hidden', !savedCountdownEnabled);

    countdownDuration.value = savedCountdownDuration;
    timerState.countdownDuration = parseInt(savedCountdownDuration) * 60 * 1000;

    // Load sound settings
    const soundSettings = JSON.parse(localStorage.getItem('soundSettings') || '{}');
    soundEnabled.checked = soundSettings.enabled !== false;
    soundVolume.value = (soundSettings.volume || 0.5) * 100;
    volumeValue.textContent = `${soundVolume.value}%`;

    // Load reminder setting
    const savedReminderEnabled = localStorage.getItem('reminderEnabled') === 'true';
    reminderEnabled.checked = savedReminderEnabled;
    timerState.reminderEnabled = savedReminderEnabled;
}

// Theme Management
function initializeTheme() {
    const savedTheme = localStorage.getItem('theme') || 'auto';
    setTheme(savedTheme);

    // Set radio button
    themeRadios.forEach(radio => {
        if (radio.value === savedTheme) {
            radio.checked = true;
        }
    });
}

function setTheme(theme) {
    localStorage.setItem('theme', theme);

    document.body.classList.remove('theme-light', 'theme-dark');

    if (theme === 'light') {
        document.body.classList.add('theme-light');
        document.querySelector('.theme-icon').textContent = '☀️';
    } else if (theme === 'dark') {
        document.body.classList.add('theme-dark');
        document.querySelector('.theme-icon').textContent = '🌙';
    } else {
        // Auto - use system preference
        document.querySelector('.theme-icon').textContent = '🔄';
    }
}

function cycleTheme() {
    const currentTheme = localStorage.getItem('theme') || 'auto';
    const themes = ['auto', 'light', 'dark'];
    const currentIndex = themes.indexOf(currentTheme);
    const nextTheme = themes[(currentIndex + 1) % themes.length];

    setTheme(nextTheme);

    // Update radio button
    themeRadios.forEach(radio => {
        if (radio.value === nextTheme) {
            radio.checked = true;
        }
    });
}

// Modal Management
function openModal(modal) {
    modal.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
}

function closeModal(modal) {
    modal.classList.add('hidden');
    document.body.style.overflow = '';
}

function openStatsModal() {
    updateStatistics();
    openModal(statsModal);
}

// Statistics
function updateStatistics() {
    const history = getHistory();
    feedingStats.setHistory(history);

    // Update summary stats
    const todayCount = feedingStats.getTodayCount();
    const todayTotal = feedingStats.getTodayTotal();
    const avgDuration = feedingStats.getAverageDuration();

    document.getElementById('statTodayCount').textContent = todayCount;
    document.getElementById('statTodayTotal').textContent = formatDuration(todayTotal);
    document.getElementById('statAvgDuration').textContent = formatDuration(avgDuration);

    // Update side distribution
    const sideDistribution = feedingStats.getSideDistribution();
    document.getElementById('statLeftCount').textContent = sideDistribution.left;
    document.getElementById('statLeftPercent').textContent = `(${sideDistribution.leftPercent}%)`;
    document.getElementById('statRightCount').textContent = sideDistribution.right;
    document.getElementById('statRightPercent').textContent = `(${sideDistribution.rightPercent}%)`;

    // Update chart
    updateWeeklyChart();
}

function updateWeeklyChart() {
    const weeklyData = feedingStats.getWeeklyData();
    const ctx = document.getElementById('weeklyChart');

    if (weeklyChart) {
        weeklyChart.destroy();
    }

    weeklyChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: weeklyData.days,
            datasets: [
                {
                    label: 'Кількість годувань',
                    data: weeklyData.counts,
                    backgroundColor: 'rgba(139, 92, 246, 0.5)',
                    borderColor: 'rgba(139, 92, 246, 1)',
                    borderWidth: 2,
                    yAxisID: 'y'
                },
                {
                    label: 'Тривалість (хв)',
                    data: weeklyData.durations,
                    backgroundColor: 'rgba(252, 165, 165, 0.5)',
                    borderColor: 'rgba(248, 113, 113, 1)',
                    borderWidth: 2,
                    yAxisID: 'y1'
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            interaction: {
                mode: 'index',
                intersect: false
            },
            plugins: {
                legend: {
                    display: true,
                    position: 'bottom'
                }
            },
            scales: {
                y: {
                    type: 'linear',
                    display: true,
                    position: 'left',
                    title: {
                        display: true,
                        text: 'Кількість'
                    }
                },
                y1: {
                    type: 'linear',
                    display: true,
                    position: 'right',
                    title: {
                        display: true,
                        text: 'Хвилини'
                    },
                    grid: {
                        drawOnChartArea: false
                    }
                }
            }
        }
    });
}

// Export and Share
function exportData() {
    const history = getHistory();
    feedingStats.setHistory(history);
    feedingStats.downloadCSV();
}

async function shareData() {
    const history = getHistory();
    feedingStats.setHistory(history);

    const shared = await feedingStats.shareData();

    if (!shared) {
        // Fallback to download if share not supported
        feedingStats.downloadCSV();
    }
}

// Side Selection
function selectSide(side) {
    timerState.currentSide = side;
    leftBtn.classList.toggle('active', side === 'left');
    rightBtn.classList.toggle('active', side === 'right');
}

// Timer Functions
function startTimer() {
    if (timerState.isRunning) return;

    timerState.isRunning = true;
    timerState.startTime = Date.now() - timerState.elapsedTime;

    startBtn.classList.add('hidden');
    stopBtn.classList.remove('hidden');
    timerDisplayContainer.classList.add('running');

    timerState.intervalId = setInterval(updateTimer, 100);

    // Start reminder interval if enabled
    if (timerState.reminderEnabled) {
        timerState.reminderInterval = setInterval(() => {
            soundManager.playReminderSound();
        }, 5 * 60 * 1000); // Every 5 minutes
    }

    // Request wake lock
    requestWakeLock();
}

function stopTimer() {
    if (!timerState.isRunning) return;

    timerState.isRunning = false;
    clearInterval(timerState.intervalId);

    if (timerState.reminderInterval) {
        clearInterval(timerState.reminderInterval);
        timerState.reminderInterval = null;
    }

    // Play completion sound
    soundManager.playCompletionSound();

    // Show notes modal
    openModal(notesModal);

    // Release wake lock
    releaseWakeLock();
}

function saveFeeding(notes) {
    const feeding = {
        id: Date.now(),
        timestamp: new Date().toISOString(),
        duration: timerState.elapsedTime,
        side: timerState.currentSide,
        notes: notes || ''
    };

    let history = getHistory();
    history.unshift(feeding);

    if (history.length > 50) {
        history = history.slice(0, 50);
    }

    localStorage.setItem('feedingHistory', JSON.stringify(history));

    // Reset timer
    timerState.elapsedTime = 0;
    timerState.startTime = null;

    stopBtn.classList.add('hidden');
    startBtn.classList.remove('hidden');
    timerDisplayContainer.classList.remove('running');
    timerDisplay.textContent = '00:00';

    renderHistory();
    updateLastFeedingDisplay();
}

function updateTimer() {
    timerState.elapsedTime = Date.now() - timerState.startTime;

    // Check countdown
    if (timerState.countdownEnabled) {
        const remaining = timerState.countdownDuration - timerState.elapsedTime;

        if (remaining <= 0) {
            // Countdown finished
            soundManager.playCountdownSound();
            // Continue timer but show notification
            if ('Notification' in window && Notification.permission === 'granted') {
                new Notification('Таймер годування', {
                    body: `Час вийшов! (${Math.floor(timerState.countdownDuration / 60000)} хв)`,
                    icon: './icons/icon-192.png'
                });
            }
            // Disable countdown to prevent repeated notifications
            timerState.countdownEnabled = false;
            countdownEnabled.checked = false;
        }
    }

    const totalSeconds = Math.floor(timerState.elapsedTime / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;

    timerDisplay.textContent = `${padZero(minutes)}:${padZero(seconds)}`;
}

function padZero(num) {
    return num.toString().padStart(2, '0');
}

// History Management
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
        const notesHtml = feeding.notes ? `<div class="history-notes">${feeding.notes}</div>` : '';

        return `
            <div class="history-item">
                <div class="history-info">
                    <div class="history-time">${timeStr}</div>
                    <div class="history-details">${durationStr} • ${sideText}</div>
                    ${notesHtml}
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

    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const timeAgo = formatTimeAgo(diffMins);

    const nextSide = last.side === 'left' ? 'right' : 'left';
    const nextSideText = nextSide === 'left' ? 'Ліва' : 'Права';
    const nextSideIcon = nextSide === 'left' ? '👈' : '👉';

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

// Wake Lock
let wakeLock = null;

async function requestWakeLock() {
    if ('wakeLock' in navigator) {
        try {
            wakeLock = await navigator.wakeLock.request('screen');
        } catch (err) {
            console.log('Wake Lock error:', err);
        }
    }
}

function releaseWakeLock() {
    if (wakeLock) {
        wakeLock.release();
        wakeLock = null;
    }
}

// Request notification permission on first interaction
document.addEventListener('click', () => {
    if ('Notification' in window && Notification.permission === 'default') {
        Notification.requestPermission();
    }
}, { once: true });
