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
        console.log('TimeScheduler started');
        // Check every second to catch the exact minute
        this.checkInterval = setInterval(() => {
            this.checkForAudioTriggers();
        }, 1000);
    }

    // Stop the scheduler
    stop() {
        if (this.checkInterval) {
            clearInterval(this.checkInterval);
        }
    }

    // Check if we need to play audio
    async checkForAudioTriggers() {
        const now = new Date();
        const seconds = now.getSeconds();
        const minutes = now.getMinutes();
        const hours = now.getHours();

        // Only trigger at the exact start of a minute
        if (seconds !== 0) return;

        const currentMinute = `${hours}:${minutes}`;

        // Skip if we already triggered this minute
        if (this.lastMinuteChecked === currentMinute) return;
        this.lastMinuteChecked = currentMinute;

        console.log(`[${currentMinute}:00] Checking for audio triggers`);

        // Check Quiet Hours (00:00-08:00)
        if (this.settings.quietHours && hours >= 0 && hours < 8) {
            console.log('Quiet Hours active - skipping');
            return;
        }

        // Check master pause
        if (this.settings.masterPause) {
            console.log('Master pause active - skipping');
            return;
        }

        // Quarter-hour beeps
        if (this.settings.quarterBeepsEnabled) {
            if (minutes === 15) {
                console.log('✓ Triggering 1 beep at :15');
                await this.audioSystem.playBeeps(1);
            } else if (minutes === 30) {
                console.log('✓ Triggering 2 beeps at :30');
                await this.audioSystem.playBeeps(2);
            } else if (minutes === 45) {
                console.log('✓ Triggering 3 beeps at :45');
                await this.audioSystem.playBeeps(3);
            }
        }

        // Hourly morse code announcement
        if (minutes === 0) {
            console.log('✓ Triggering hourly morse announcement');
            let displayHours = hours;
            if (this.settings.timeFormat === '12hr') {
                displayHours = hours % 12 || 12;
            }
            const timeString = `${String(displayHours).padStart(2, '0')}:00`;
            await this.audioSystem.playMorseTime(timeString);
        }
    }
}

// Export for use in renderer.js
window.timeScheduler = new TimeScheduler(window.audioSystem);
