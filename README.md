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

✅ **Modern UI**
- Clean main screen with only morse display and time
- Settings accessible via sliders icon (top-right)
- Modal overlay with smooth animations
- Fade-in, slide-in, and hover effects

✅ **Time Format Toggle**
- Switch between 24-hour and 12-hour format
- Affects both visual display and morse announcements
- Settings saved automatically

✅ **Quiet Hours**
- Auto-mute during sleep hours (00:00-08:00)
- Configurable via settings toggle
- Scheduler continues running silently

✅ **Audio Controls**
- Master ON/OFF toggle to pause all audio
- Volume control (0-100%)
- Quarter-hour beeps toggle
- Test Morse button to preview current time

✅ **System Integration**
- Launch on startup (optional)
- System tray icon with morse code design
- Minimize to tray
- Background persistence (works when window closed)

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

### Phase 1 ✅ Complete - MVP Foundation
- [x] Electron app setup and configuration
- [x] Real-time clock display with second updates
- [x] Quarter-hour beeps (:15, :30, :45)
- [x] Web Audio API integration (programmatic beeps)
- [x] Master ON/OFF toggle
- [x] Volume control slider (0-100%)
- [x] Quarter beeps toggle
- [x] Settings persistence (JSON storage)
- [x] System tray integration
- [x] Minimize to tray functionality

### Phase 2 ✅ Complete - Morse Code Features
- [x] Morse code encoder utility (digits 0-9)
- [x] Visual morse display (3-line ▪▬ symbols)
- [x] Pre-recorded morse audio files integration
- [x] Hourly morse code time announcements (at :00)
- [x] Audio buffer loading and caching
- [x] Farnsworth timing (700ms between digits)
- [x] 24hr/12hr time format toggle
- [x] Test Morse button
- [x] Time format persistence
- [x] Audio quality optimization

### Phase 3 ✅ Complete - Polish & System Integration
- [x] UI redesign (clean main screen)
- [x] Settings modal with animations
- [x] Sliders icon (intuitive settings access)
- [x] Fade-in, slide-in, hover animations
- [x] Quiet Hours (00:00-08:00) auto-mute
- [x] Auto-launch on startup toggle
- [x] Custom app icon (morse + analog clock)
- [x] Custom tray icon (6-line morse design)
- [x] Background persistence (backgroundThrottling: false)
- [x] Timing accuracy improvements (seconds === 0)
- [x] Early audio context initialization
- [x] Visibility change tracking
- [x] Tray icon PNG file implementation

## License

ISC

## Acknowledgments

Built with ❤️ to be aware of time minimally.
