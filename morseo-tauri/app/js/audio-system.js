// Audio System using Web Audio API and pre-recorded morse files
class AudioSystem {
    constructor() {
        this.audioContext = null;
        this.volume = 0.5; // 0 to 1
        this.audioBuffers = {}; // Cache for loaded audio files
        this.loadingPromise = null;
    }

    // Initialize AudioContext
    init() {
        if (!this.audioContext) {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();

            // Auto-resume whenever Chromium suspends the context (e.g. window hidden)
            this.audioContext.onstatechange = () => {
                if (this.audioContext.state === 'suspended') {
                    console.log('AudioContext suspended - auto-resuming...');
                    this.audioContext.resume();
                }
            };

            this.loadingPromise = this.loadMorseAudioFiles();
        }
    }

    // Ensure AudioContext is running and all files are loaded before playing
    async ensureReady() {
        this.init();

        // Chromium suspends AudioContext until a user gesture - resume it
        if (this.audioContext.state === 'suspended') {
            await this.audioContext.resume();
        }

        // Wait for audio files to finish loading before trying to play
        if (this.loadingPromise) {
            await this.loadingPromise;
        }
    }

    // Load all morse digit audio files
    async loadMorseAudioFiles() {
        console.log('Loading morse audio files...');
        const loadPromises = [];

        for (let i = 0; i <= 9; i++) {
            loadPromises.push(this.loadAudioFile(i));
        }

        await Promise.all(loadPromises);
        this.loadingPromise = null; // Clear so ensureReady() doesn't re-await
        console.log('All morse audio files loaded successfully');
    }

    // Load a single audio file
    async loadAudioFile(digit) {
        try {
            const response = await fetch(`assets/audio/morse (${digit}).wav`);
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
    async playBeep(duration = 200, frequency = 700) {
        await this.ensureReady();

        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(this.audioContext.destination);

        oscillator.frequency.value = frequency;
        oscillator.type = 'sine';

        // Sharp envelope to avoid clicks
        const now = this.audioContext.currentTime;
        gainNode.gain.setValueAtTime(0, now);
        gainNode.gain.linearRampToValueAtTime(this.volume * 0.3, now + 0.002);
        gainNode.gain.setValueAtTime(this.volume * 0.3, now + duration / 1000 - 0.002);
        gainNode.gain.linearRampToValueAtTime(0, now + duration / 1000);

        oscillator.start(now);
        oscillator.stop(now + duration / 1000);

        // Wait for beep to complete before returning
        await this.sleep(duration);
    }

    // Play multiple beeps with pauses (for quarter-hour notifications)
    async playBeeps(count) {
        console.log(`Playing ${count} beep(s)`);
        for (let i = 0; i < count; i++) {
            await this.playBeep(200, 700);
            if (i < count - 1) {
                await this.sleep(300);
            }
        }
    }

    // Play morse code for a single digit using pre-recorded audio
    async playMorseDigit(digit) {
        await this.ensureReady();

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

        gainNode.gain.value = this.volume;
        source.start(0);

        // Wait for the audio to finish
        await this.sleep(buffer.duration * 1000);
    }

    // Play time in morse code (HH:MM format)
    async playMorseTime(timeString) {
        console.log(`Playing morse time: ${timeString}`);

        const digits = timeString.replace(/:/g, '');

        for (let i = 0; i < digits.length; i++) {
            await this.playMorseDigit(digits[i]);
            if (i < digits.length - 1) {
                await this.sleep(700); // Farnsworth spacing between digits
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
