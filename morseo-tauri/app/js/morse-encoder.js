// Morse Code Encoder for digits 0-9
class MorseEncoder {
    constructor() {
        // Morse code patterns (. = dit, - = dah)
        this.morseMap = {
            '0': '-----',
            '1': '.----',
            '2': '..---',
            '3': '...--',
            '4': '....-',
            '5': '.....',
            '6': '-....',
            '7': '--...',
            '8': '---..',
            '9': '----.'
        };

        // Visual morse characters
        this.ditChar = '▪';
        this.dahChar = '▬';
    }

    // Convert a single digit to morse pattern (dots and dashes)
    digitToMorse(digit) {
        return this.morseMap[digit] || '';
    }

    // Convert a single digit to visual morse (▪ and ▬)
    digitToVisualMorse(digit) {
        const pattern = this.digitToMorse(digit);
        return pattern
            .replace(/\./g, this.ditChar)
            .replace(/-/g, this.dahChar);
    }

    // Convert two digits to visual morse with spacing
    // Used for hours, minutes, seconds (each is 2 digits)
    twoDigitsToVisualMorse(value) {
        const str = String(value).padStart(2, '0');
        const digit1 = this.digitToVisualMorse(str[0]);
        const digit2 = this.digitToVisualMorse(str[1]);

        // Add multiple spaces between digits for visual separation
        return `${digit1}    ${digit2}`;
    }

    // Convert time object to full visual morse (3 lines)
    timeToVisualMorse(hours, minutes, seconds) {
        return {
            hours: this.twoDigitsToVisualMorse(hours),
            minutes: this.twoDigitsToVisualMorse(minutes),
            seconds: this.twoDigitsToVisualMorse(seconds)
        };
    }

    // Get array of morse patterns for a time string "HH:MM"
    // Returns array of 4 patterns (one per digit)
    timeToMorsePatterns(timeString) {
        // Remove colons and get just the digits
        const digits = timeString.replace(/:/g, '');
        return digits.split('').map(d => this.digitToMorse(d));
    }
}

// Export for use in renderer
window.morseEncoder = new MorseEncoder();
