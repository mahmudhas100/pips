// Time Scheduler - Handles time checking and audio triggers
class TimeScheduler {
    constructor(audioSystem) {
        this.audioSystem = audioSystem;
        this.settings = {
            masterPause: false,
            quarterBeepsEnabled: true
        };
        this.lastMinuteChecked = -1;
    }

    // Update settings
    updateSettings(settings) {
        this.settings = { ...this.settings, ...settings };
        console.log('TimeScheduler settings updated:', this.settings);
    }

    // Start the scheduler
    start() {
        // Check every minute for audio triggers
        this.checkInterval = setInterval(() => {
            this.checkForAudioTriggers();
        }, 1000); // Check every second to catch the exact minute
    }

    // Stop the scheduler
    stop() {
        if (this.checkInterval) {
            clearInterval(this.checkInterval);
        }
    }

    // Check if we need to play audio
    checkForAudioTriggers() {
        const now = new Date();
        const minutes = now.getMinutes();
        const seconds = now.getSeconds();

        // Only trigger once per minute (when seconds == 0)
        if (seconds !== 0) {
            return;
        }

        // Prevent double-triggering in same minute
        if (minutes === this.lastMinuteChecked) {
            return;
        }

        this.lastMinuteChecked = minutes;

        console.log(`Minute check: ${minutes}, masterPause: ${this.settings.masterPause}, quarterBeepsEnabled: ${this.settings.quarterBeepsEnabled}`);

        // Don't play if paused
        if (this.settings.masterPause) {
            console.log('Skipping audio - app is paused');
            return;
        }

        // Check for quarter-hour beeps
        if (this.settings.quarterBeepsEnabled) {
            if (minutes === 15) {
                console.log('Triggering 1 beep at :15');
                this.audioSystem.playBeeps(1);
            } else if (minutes === 30) {
                console.log('Triggering 2 beeps at :30');
                this.audioSystem.playBeeps(2);
            } else if (minutes === 45) {
                console.log('Triggering 3 beeps at :45');
                this.audioSystem.playBeeps(3);
            }
        } else {
            console.log('Quarter beeps are disabled');
        }

        // Hourly morse code announcement
        if (minutes === 0) {
            console.log('Triggering hourly morse announcement');
            let hours = now.getHours();
            const mins = now.getMinutes();

            // Apply time format
            if (this.settings.timeFormat === '12hr') {
                hours = hours % 12 || 12;
            }

            const timeString = `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}`;
            this.audioSystem.playMorseTime(timeString);
        }
    }
}

// Export for use in renderer.js
window.timeScheduler = new TimeScheduler(window.audioSystem);
