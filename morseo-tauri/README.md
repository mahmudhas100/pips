# Pips — Time, coded

A minimalist desktop application that provides time awareness through morse code audio and visual display.

> Formerly **Morseo**. The Electron v1 app became a **Tauri 2** rewrite (v1), and v2.0.0 is both the rebuild and the rename.

Same features, rebuilt on **Tauri 2** for dramatically lower resource usage:

| | Electron (v1) | Tauri (v2) |
|---|---|---|
| Installer | ~90 MB | ~2 MB |
| RAM (idle, tray-resident) | ~150–250 MB | ~30–60 MB |
| Processes | 4–6 (Chromium + Node) | 1 + WebView2 (shared with Windows) |
| Runtime deps shipped | full Chromium + Node | none (uses OS WebView2) |
| Scheduler | JS `setInterval` (+ throttling workarounds) | Native Rust thread |

## Features

Same as the Electron version:

- Visual morse display (hours / minutes / seconds as ▪ and ▬, updating every second)
- Professional pre-recorded morse audio files (hourly announcement at :00)
- Farnsworth timing (700ms between digits)
- Quarter-hour beeps at :15, :30, :45 (1, 2, 3 beeps)
- 24hr/12hr time format
- Quiet Hours (00:00–08:00) auto-mute
- Audio controls: master pause, volume 0–100%, quarter-beeps toggle, click display to test
- Launch on startup, system tray, close-to-tray persistence
- Settings persistence in JSON; **migrates automatically** from the old Electron config
  (or the pre-rename Morseo Tauri build) on first run

## Architecture

```
pips-tauri/ (currently morseo-tauri/ until final repo cleanup)
├── app/                             # Frontend (was renderer/ + assets)
│   ├── index.html                   # Same UI, Tauri global API instead of preload bridge
│   ├── styles.css                   # Unchanged
│   ├── js/
│   │   ├── morse-encoder.js         # Unchanged
│   │   ├── audio-system.js          # Web Audio API + pre-recorded WAVs (unchanged logic)
│   │   └── renderer.js              # UI logic; invoke()/listen() instead of electronAPI
│   └── assets/audio/morse (0-9).wav # Same pre-recorded files
│
└── src-tauri/                       # Native core (was main.js + time-scheduler.js)
    ├── Cargo.toml
    ├── tauri.conf.json              # Window, bundle, NSIS installer config
    ├── capabilities/default.json    # Grants core:event to the main window (required!)
    └── src/
        ├── main.rs                  # App lifecycle, window close→tray, --hidden handling
        ├── store.rs                 # Settings JSON store (port of utils/simple-store.js)
        ├── scheduler.rs             # Time scheduler (port of renderer/time-scheduler.js)
        ├── tray.rs                  # System tray icon + Open/Pause/Quit menu
        └── commands.rs              # IPC: get/set settings, auto-launch
```

### What changed conceptually

1. **The scheduler moved to Rust.** The Electron app checked the time every second inside
   Chromium and needed `backgroundThrottling: false` plus AudioContext auto-resume hacks to
   work while hidden. Here `src-tauri/src/scheduler.rs` polls every 250ms in a native thread
   (immune to webview throttling), and emits `quarter-beeps` / `hourly-morse` events to the
   webview only when an actual trigger fires. The webview just renders and plays audio.
2. **No preload bridge.** `window.electronAPI` is replaced by Tauri's global
   `window.__TAURI__` (`withGlobalTauri: true`) — `invoke()` for commands, `listen()` for events.
3. **Capabilities are mandatory in Tauri v2.** Webview-side `event.listen()` requires
   `core:event:default` granted via `src-tauri/capabilities/default.json`. App commands
   (`invoke`) are allowed by default. Without the capability, scheduled events would fire
   in Rust but never reach the webview.
4. **Settings continuity.** `store.rs` reads legacy configurations on first run, in priority
   order: `%APPDATA%\com.mahmudhas.morseo` (first Tauri build) → `%APPDATA%\Morseo` /
   `%APPDATA%\morseo` (Electron) — then persists to `%APPDATA%\com.mahmudhas.pips`.
5. **Audio stays in the webview** (Web Audio API playing the same 10 WAV files), so the
   frontend audio code is essentially untouched. `--autoplay-policy=no-user-gesture-required`
   is set via `additionalBrowserArgs` (the equivalent of the Electron switch).

### Differences from the Electron version

- **Minimize goes to the taskbar** instead of hiding to tray (Tauri has no minimize event).
  Closing the window still hides to tray, so background persistence is unchanged.
- Dev-mode auto-launch toggle is a no-op, same as before (packaged app only).

## Development

```bash
# Prerequisites: Rust (rustup) + MSVC Build Tools + WebView2 (bundled with Win 10/11)
npm install
npm run dev        # dev window with full UI
npm run build      # release build + NSIS installer in src-tauri/target/release/bundle/nsis
```

### Verifying scheduled triggers without waiting for :15 / :30 / :45

Launch the release binary with the environment variable `MORSEO_TEST_TRIGGER=1` — 2 seconds
after startup it emits a quarter-hour beep sequence (1 beep), 4 seconds later an hourly
morse announcement. The variable gates a one-shot dev hook and does nothing when unset.

## License

ISC
