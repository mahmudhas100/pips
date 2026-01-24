# Morseo- Time, coded

A minimalist desktop application that provides time awareness through morse code audio and visual display.

## Features

✅ **Visual Morse Display**
- Real-time 3-line morse code visualization
- Hours, minutes, and seconds displayed as ▪ (dit) and ▬ (dah)
- Large, readable monospace font
- Updates every second

✅ **Morse Code Audio**
- Professional pre-recorded morse audio files
- Crystal-clear dit and dah sounds
- Hourly time announcements in morse code (at :00)
- Farnsworth timing (700ms between digits) for optimal learning

✅ **Quarter-Hour Beeps**
- Audio beeps at :15, :30, :45 minutes
- 1, 2, or 3 beeps respectively
- 0.3 second pause between beeps

✅ **Time Format Toggle**
- Switch between 24-hour and 12-hour format
- Affects both visual display and morse announcements
- Settings saved automatically

✅ **Audio Controls**
- Master ON/OFF toggle to pause all audio
- Volume control (0-100%)
- Quarter-hour beeps toggle
- Test Morse button to preview current time

✅ **Settings Persistence**
- All settings saved automatically across restarts
- Stored in JSON format using Electron's userData directory

## Tech Stack

- **Electron** 40.0.0 - Desktop application framework
- **Node.js** - Backend runtime
- **Web Audio API** - Audio generation
- **Custom JSON Storage** - Settings persistence

## Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/morseo.git
cd morseo

# Install dependencies
npm install

# Run the application
npm start
```

## Project Structure

```
morseo/
├── main.js                      # Electron main process
├── preload.js                   # Context bridge for security
├── package.json                 # Project configuration
│
├── renderer/
│   ├── index.html               # Main UI
│   ├── styles.css               # Minimal black/white styling
│   ├── renderer.js              # UI logic and event handlers
│   ├── audio-system.js          # Audio playback with pre-recorded files
│   └── time-scheduler.js        # Time checking and audio triggers
│
├── utils/
│   ├── simple-store.js          # Custom settings storage
│   └── morse-encoder.js         # Morse code conversion utility
│
└── assets/
    ├── audio/
    │   └── morse (0-9).wav      # Pre-recorded morse code audio
    └── icons/
        └── tray-icon.png        # System tray icon
```

## Development

```bash
# Run in development mode with debugging
npm run dev
```

## Roadmap

### Phase 2 ✅ Complete
- [x] Morse code audio with pre-recorded files
- [x] Hourly morse code time announcements
- [x] Visual morse code display (▪▬ symbols)
- [x] 24hr/12hr time format toggle
- [x] Test morse button
- [x] Farnsworth timing (700ms between digits)

### Phase 3 (Planned)
- [ ] Do Not Disturb mode detection
- [ ] Auto-launch on startup
- [ ] Improved tray icon
- [ ] UI animations and polish

## License

ISC

## Acknowledgments

Built with ❤️ to be aware of time minimally.
