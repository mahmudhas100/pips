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

        // Log visibility changes to debug background issues
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                console.log('⚠️ Window hidden - scheduler should continue running');
            } else {
                console.log('✓ Window visible');
            }
        });
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
        const seconds = now.getSeconds();
        const minutes = now.getMinutes();
        const hours = now.getHours();

        // Only trigger at the exact start of a minute (seconds === 0)
        // This ensures precise timing aligned with system clock
        if (seconds !== 0) {
            return;
        }

        const currentMinute = `${hours}:${minutes}`;

        // Skip if we already checked this minute
        if (this.lastMinuteChecked === currentMinute) {
            return;
        }
        this.lastMinuteChecked = currentMinute;

        console.log(`[${currentMinute}:00] Checking for audio triggers`);

        // Check if we're in Quiet Hours (00:00-08:00)
        const isQuietHours = this.settings.quietHours && (hours >= 0 && hours < 8);

        if (isQuietHours) {
            console.log('Quiet Hours active - skipping audio notifications');
            return;
        }

        // Check if master pause is active
        if (this.settings.masterPause) {
            console.log('Master pause is active - skipping audio triggers');
            return;
        }

        // Ensure audio context is initialized before playing
        this.audioSystem.init();

        // Quarter-hour beeps
        if (this.settings.quarterBeepsEnabled) {
            if (minutes === 15) {
                console.log('✓ Triggering 1 beep at :15');
                this.audioSystem.playBeeps(1);
            } else if (minutes === 30) {
                console.log('✓ Triggering 2 beeps at :30');
                this.audioSystem.playBeeps(2);
            } else if (minutes === 45) {
                console.log('✓ Triggering 3 beeps at :45');
                this.audioSystem.playBeeps(3);
            }
        }

        // Hourly morse code announcement
        if (minutes === 0) {
            console.log('✓ Triggering hourly morse announcement');
            let displayHours = hours;

            // Apply time format
            if (this.settings.timeFormat === '12hr') {
                displayHours = hours % 12 || 12;
            }

            const timeString = `${String(displayHours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
            this.audioSystem.playMorseTime(timeString);
        }
    }
}

// Export for use in renderer.js
window.timeScheduler = new TimeScheduler(window.audioSystem);
