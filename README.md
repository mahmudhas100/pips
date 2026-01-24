# Morseo- Time, coded

A minimalist desktop application that provides time awareness through morse code audio and visual display.

## Features (Phase 1 - MVP)

✅ **Quarter-Hour Beeps**
- Audio beeps at :15, :30, :45 minutes
- 1, 2, or 3 beeps respectively
- 0.3 second pause between beeps

✅ **Real-Time Clock Display**
- Digital clock updating every second
- Clean, minimal interface (800×600px window)

✅ **Audio Controls**
- Master ON/OFF toggle to pause all audio
- Volume control (0-100%)
- Quarter-hour beeps toggle

✅ **Settings Persistence**
- Settings saved automatically across restarts
- Stored in JSON format using Electron's userData directory

✅ **Web Audio API**
- Programmatically generated beeps (700Hz sine wave)
- Smooth attack/release to prevent clicks
- No external audio files needed

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
│   ├── audio-system.js          # Web Audio API implementation
│   └── time-scheduler.js        # Time checking and audio triggers
│
├── utils/
│   └── simple-store.js          # Custom settings storage
│
└── assets/
    └── icons/
        └── tray-icon.png        # System tray icon
```

## Development

```bash
# Run in development mode with debugging
npm run dev
```

## Roadmap

### Phase 2 (Planned)
- [ ] Morse code audio generation (dits and dahs)
- [ ] Hourly morse code time announcements
- [ ] Visual morse code display (▪▬ symbols)
- [ ] 24hr/12hr time format toggle
- [ ] Test morse button
- [ ] Farnsworth timing (20 WPM character speed, 10 WPM word spacing)

### Phase 3 (Planned)
- [ ] Do Not Disturb mode detection
- [ ] Auto-launch on startup
- [ ] Improved tray icon
- [ ] UI animations and polish

## License

ISC

## Acknowledgments

Built with ❤️ to be aware of time minimally.
