// Audio System using Web Audio API
class AudioSystem {
    constructor() {
        this.audioContext = null;
        this.volume = 0.5; // 0 to 1
    }

    // Initialize AudioContext (must be called after user interaction)
    init() {
        if (!this.audioContext) {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        }
    }

    // Set volume (0-100)
    setVolume(volumePercent) {
        this.volume = volumePercent / 100;
    }

    // Play a simple beep
    playBeep(duration = 200, frequency = 700) {
        this.init();

        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(this.audioContext.destination);

        // Beep settings
        oscillator.frequency.value = frequency;
        oscillator.type = 'sine';

        // Volume with smooth envelope
        const now = this.audioContext.currentTime;
        gainNode.gain.setValueAtTime(0, now);
        gainNode.gain.linearRampToValueAtTime(this.volume * 0.3, now + 0.005); // Attack (5ms)
        gainNode.gain.setValueAtTime(this.volume * 0.3, now + duration / 1000 - 0.005);
        gainNode.gain.linearRampToValueAtTime(0, now + duration / 1000); // Release (5ms)

        oscillator.start(now);
        oscillator.stop(now + duration / 1000);
    }

    // Play multiple beeps with pauses
    async playBeeps(count) {
        console.log(`Playing ${count} beep(s)`);
        for (let i = 0; i < count; i++) {
            this.playBeep(200, 700);

            // Wait 0.3 second before next beep (unless it's the last one)
            if (i < count - 1) {
                await this.sleep(300);
            }
        }
    }

    // Helper: sleep function
    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

// Export for use in other scripts
window.audioSystem = new AudioSystem();
