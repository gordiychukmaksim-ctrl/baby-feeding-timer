// Sound Notifications using Web Audio API
class SoundManager {
    constructor() {
        this.audioContext = null;
        this.enabled = true;
        this.volume = 0.5;
        this.loadSettings();
    }

    loadSettings() {
        const settings = JSON.parse(localStorage.getItem('soundSettings') || '{}');
        this.enabled = settings.enabled !== false;
        this.volume = settings.volume || 0.5;
    }

    saveSettings() {
        localStorage.setItem('soundSettings', JSON.stringify({
            enabled: this.enabled,
            volume: this.volume
        }));
    }

    initAudioContext() {
        if (!this.audioContext) {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        }
    }

    playCompletionSound() {
        if (!this.enabled) return;
        this.initAudioContext();

        const ctx = this.audioContext;
        const now = ctx.currentTime;

        // Create a pleasant completion sound (ascending notes)
        const frequencies = [523.25, 659.25, 783.99]; // C5, E5, G5

        frequencies.forEach((freq, index) => {
            const oscillator = ctx.createOscillator();
            const gainNode = ctx.createGain();

            oscillator.connect(gainNode);
            gainNode.connect(ctx.destination);

            oscillator.frequency.value = freq;
            oscillator.type = 'sine';

            const startTime = now + (index * 0.15);
            gainNode.gain.setValueAtTime(0, startTime);
            gainNode.gain.linearRampToValueAtTime(this.volume * 0.3, startTime + 0.05);
            gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + 0.4);

            oscillator.start(startTime);
            oscillator.stop(startTime + 0.4);
        });
    }

    playReminderSound() {
        if (!this.enabled) return;
        this.initAudioContext();

        const ctx = this.audioContext;
        const now = ctx.currentTime;

        // Create a gentle reminder sound (two soft beeps)
        for (let i = 0; i < 2; i++) {
            const oscillator = ctx.createOscillator();
            const gainNode = ctx.createGain();

            oscillator.connect(gainNode);
            gainNode.connect(ctx.destination);

            oscillator.frequency.value = 800;
            oscillator.type = 'sine';

            const startTime = now + (i * 0.3);
            gainNode.gain.setValueAtTime(0, startTime);
            gainNode.gain.linearRampToValueAtTime(this.volume * 0.2, startTime + 0.05);
            gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + 0.2);

            oscillator.start(startTime);
            oscillator.stop(startTime + 0.2);
        }
    }

    playCountdownSound() {
        if (!this.enabled) return;
        this.initAudioContext();

        const ctx = this.audioContext;
        const now = ctx.currentTime;

        // Create an alert sound for countdown completion
        const frequencies = [880, 880, 880, 1046.5]; // A5, A5, A5, C6

        frequencies.forEach((freq, index) => {
            const oscillator = ctx.createOscillator();
            const gainNode = ctx.createGain();

            oscillator.connect(gainNode);
            gainNode.connect(ctx.destination);

            oscillator.frequency.value = freq;
            oscillator.type = 'square';

            const startTime = now + (index * 0.2);
            gainNode.gain.setValueAtTime(0, startTime);
            gainNode.gain.linearRampToValueAtTime(this.volume * 0.25, startTime + 0.02);
            gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + 0.15);

            oscillator.start(startTime);
            oscillator.stop(startTime + 0.15);
        });
    }

    setEnabled(enabled) {
        this.enabled = enabled;
        this.saveSettings();
    }

    setVolume(volume) {
        this.volume = Math.max(0, Math.min(1, volume));
        this.saveSettings();
    }
}

// Export singleton instance
const soundManager = new SoundManager();
