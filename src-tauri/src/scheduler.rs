// Time scheduler - Rust port of renderer/time-scheduler.js.
// The Electron app polled with setInterval(1s) inside a browser and fought
// Chromium's background throttling (backgroundThrottling: false + AudioContext
// auto-resume hacks). Here the scheduler lives in native code: no throttling,
// no audio-context babysitting, and the webview only renders + plays audio.

use chrono::{Local, Timelike};
use std::thread;
use std::time::Duration;
use tauri::Emitter;

use crate::store;

/// Poll cadence. 250ms keeps CPU cost near zero while guaranteeing we never
/// skip the `seconds == 0` boundary (a naive 1s sleep can drift past it).
const TICK: Duration = Duration::from_millis(250);

/// Give the webview time to finish loading and attach its event listeners so
/// the first trigger right after launch is not emitted into the void.
const STARTUP_DELAY: Duration = Duration::from_millis(1500);

pub fn start(app: tauri::AppHandle) {
    thread::spawn(move || run(app));
}

fn run(app: tauri::AppHandle) {
    thread::sleep(STARTUP_DELAY);

    // Manual end-to-end verification hook: launch with MORSEO_TEST_TRIGGER=1 set
    // to hear a scheduled trigger a few seconds after startup instead of waiting
    // for :15/:30/:45/:00. Inert in normal usage.
    if std::env::var("MORSEO_TEST_TRIGGER").is_ok() {
        let settings = store::current(&app);
        thread::sleep(Duration::from_secs(2));
        emit_quarter_beeps(&app, 1);
        thread::sleep(Duration::from_secs(4));
        let display_hour = if settings.time_format == "12hr" {
            let h = Local::now().hour() % 12;
            if h == 0 { 12 } else { h }
        } else {
            Local::now().hour()
        };
        emit_hourly_morse(&app, format!("{:02}:00", display_hour));
        eprintln!("MORSEO_TEST_TRIGGER: both events emitted");
    }

    let mut last_triggered_minute = String::new();

    loop {
        thread::sleep(TICK);
        let now = Local::now();

        // Only trigger at the exact start of a minute...
        if now.second() != 0 {
            continue;
        }
        // ...and only once per minute. Mark the minute BEFORE the checks
        // (parity with the original scheduler) so the same 0-second burst
        // can never re-trigger if quiet hours or pause turn off mid-minute.
        let minute_key = format!("{}:{:02}", now.hour(), now.minute());
        if last_triggered_minute == minute_key {
            continue;
        }
        last_triggered_minute = minute_key;

        let settings = store::current(&app);

        // Quiet Hours (00:00-08:00)
        if settings.quiet_hours && now.hour() < 8 {
            continue;
        }

        // Master pause
        if settings.master_pause {
            continue;
        }

        match now.minute() {
            // Quarter-hour beeps: 1 at :15, 2 at :30, 3 at :45
            15 => emit_quarter_beeps(&app, 1),
            30 => emit_quarter_beeps(&app, 2),
            45 => emit_quarter_beeps(&app, 3),
            // Hourly morse code announcement
            0 => {
                let display_hour = if settings.time_format == "12hr" {
                    let h = now.hour() % 12;
                    if h == 0 {
                        12
                    } else {
                        h
                    }
                } else {
                    now.hour()
                };
                let time = format!("{:02}:00", display_hour);
                emit_hourly_morse(&app, time);
            }
            _ => {}
        }
    }
}

fn emit_quarter_beeps(app: &tauri::AppHandle, count: u32) {
    eprintln!("✓ Triggering {} beep(s)", count);
    let payload = serde_json::json!({ "count": count });
    if let Err(error) = app.emit("quarter-beeps", payload) {
        eprintln!("Failed to emit quarter-beeps: {}", error);
    }
}

fn emit_hourly_morse(app: &tauri::AppHandle, time: String) {
    eprintln!("✓ Triggering hourly morse announcement ({})", time);
    let payload = serde_json::json!({ "time": time });
    if let Err(error) = app.emit("hourly-morse", payload) {
        eprintln!("Failed to emit hourly-morse: {}", error);
    }
}
