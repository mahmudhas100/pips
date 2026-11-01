// IPC commands - Rust port of the ipcMain.handle() registry in main.js
// plus the auto-launch handlers. Called from the webview via window.__TAURI__.

use serde_json::Value;
use tauri::{AppHandle, Emitter};

use crate::store::{self, Settings};
use crate::tray;

#[tauri::command]
pub fn get_all_settings(app: AppHandle) -> Settings {
    store::current(&app)
}

#[tauri::command]
pub fn set_setting(app: AppHandle, key: String, value: Value) -> bool {
    let key_for_apply = key.clone();
    let updated = store::update(&app, |settings| {
        apply_setting(settings, key_for_apply, value);
    });

    let Some(new_settings) = updated else {
        return false;
    };

    if key == "masterPause" {
        // Tray label mirrors the new pause state; notify the webview.
        tray::rebuild(&app);
        let _ = app.emit(
            "pause-state-changed",
            serde_json::json!({ "paused": new_settings.master_pause }),
        );
    }

    true
}

fn apply_setting(settings: &mut Settings, key: String, value: Value) {
    match (key.as_str(), value) {
        ("volume", Value::Number(number)) => {
            if let Some(v) = number.as_f64() {
                settings.volume = v.clamp(0.0, 100.0) as u32;
            }
        }
        ("quarterBeepsEnabled", Value::Bool(enabled)) => {
            settings.quarter_beeps_enabled = enabled;
        }
        ("timeFormat", Value::String(format)) => {
            settings.time_format = format;
        }
        ("quietHours", Value::Bool(enabled)) => {
            settings.quiet_hours = enabled;
        }
        ("masterPause", Value::Bool(paused)) => {
            settings.master_pause = paused;
        }
        _ => {}
    }
}

// Auto-launch: in dev mode the toggle is a no-op, exactly like the Electron app
// (registering the cargo/test binary in the registry would be wrong).

#[tauri::command]
pub fn get_auto_launch(app: AppHandle) -> bool {
    if cfg!(debug_assertions) {
        return false;
    }
    use tauri_plugin_autostart::ManagerExt;
    app.autolaunch().is_enabled().unwrap_or(false)
}

#[tauri::command]
pub fn set_auto_launch(app: AppHandle, enabled: bool) -> bool {
    if cfg!(debug_assertions) {
        return false;
    }
    use tauri_plugin_autostart::ManagerExt;
    let auto_launch = app.autolaunch();
    if enabled {
        auto_launch.enable().is_ok()
    } else {
        auto_launch.disable().is_ok()
    }
}
