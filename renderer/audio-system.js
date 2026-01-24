// Audio System using Web Audio API and pre-recorded morse files
class AudioSystem {
    constructor() {
        this.audioContext = null;
        this.volume = 0.5; // 0 to 1
        this.audioBuffers = {}; // Cache for loaded audio files
    }

    // Initialize AudioContext (must be called after user interaction)
    init() {
        if (!this.audioContext) {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            this.loadMorseAudioFiles();
        }
    }

    // Load all morse digit audio files
    async loadMorseAudioFiles() {
        console.log('Loading morse audio files...');
        const loadPromises = [];

        for (let i = 0; i <= 9; i++) {
            const promise = this.loadAudioFile(i);
            loadPromises.push(promise);
        }

        await Promise.all(loadPromises);
        console.log('All morse audio files loaded successfully');
    }

    // Load a single audio file
    async loadAudioFile(digit) {
        try {
            const response = await fetch(`../assets/audio/morse (${digit}).wav`);
            const arrayBuffer = await response.arrayBuffer();
            const audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);
            this.audioBuffers[digit] = audioBuffer;
            console.log(`Loaded morse audio for digit ${digit}`);
        } catch (error) {
            console.error(`Failed to load morse audio for digit ${digit}:`, error);
        }
    }

    // Set volume (0-100)
    setVolume(volumePercent) {
        this.volume = volumePercent / 100;
    }

    // Play a simple beep (for quarter-hour beeps)
    playBeep(duration = 200, frequency = 700) {
        this.init();

        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(this.audioContext.destination);

        // Beep settings
        oscillator.frequency.value = frequency;
        oscillator.type = 'sine';

        // Sharp envelope for cleaner morse code
        const now = this.audioContext.currentTime;
        gainNode.gain.setValueAtTime(0, now);
        gainNode.gain.linearRampToValueAtTime(this.volume * 0.3, now + 0.002); // Sharp attack (2ms)
        gainNode.gain.setValueAtTime(this.volume * 0.3, now + duration / 1000 - 0.002);
        gainNode.gain.linearRampToValueAtTime(0, now + duration / 1000); // Sharp release (2ms)

        oscillator.start(now);
        oscillator.stop(now + duration / 1000);
    }

    // Play multiple beeps with pauses (for quarter-hour notifications)
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

    // Play morse code for a single digit using pre-recorded audio
    async playMorseDigit(digit) {
        this.init();

        const buffer = this.audioBuffers[digit];
        if (!buffer) {
            console.error(`Audio buffer not loaded for digit ${digit}`);
            return;
        }

        const source = this.audioContext.createBufferSource();
        const gainNode = this.audioContext.createGain();

        source.buffer = buffer;
        source.connect(gainNode);
        gainNode.connect(this.audioContext.destination);

        // Set volume
        gainNode.gain.value = this.volume;

        // Play the audio
        source.start(0);

        // Wait for the audio to finish
        const duration = buffer.duration * 1000; // Convert to ms
        await this.sleep(duration);
    }

    // Play time in morse code (HH:MM format)
    async playMorseTime(timeString) {
        console.log(`Playing morse time: ${timeString}`);

        // Get just the digits (remove colon)
        const digits = timeString.replace(/:/g, '');

        for (let i = 0; i < digits.length; i++) {
            const digit = digits[i];
            await this.playMorseDigit(digit);

            // Farnsworth spacing between digits (longer pause for word spacing)
            if (i < digits.length - 1) {
                await this.sleep(700); // Farnsworth timing - long pause between digits
            }
        }

        console.log('Morse time announcement complete');
    }

    // Helper: sleep function
    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

// Export for use in other scripts
window.audioSystem = new AudioSystem();
