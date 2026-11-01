// Prevents an additional console window on Windows in release builds.
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod commands;
mod scheduler;
mod store;
mod tray;

use tauri::{Manager, WindowEvent};

fn main() {
    tauri::Builder::default()
        .plugin(tauri_plugin_autostart::init(
            tauri_plugin_autostart::MacosLauncher::LaunchAgent,
            // Match the Electron app: auto-launched instances start hidden in the tray.
            Some(vec!["--hidden"]),
        ))
        .manage(store::SharedSettings::default())
        .invoke_handler(tauri::generate_handler![
            commands::get_all_settings,
            commands::set_setting,
            commands::get_auto_launch,
            commands::set_auto_launch
        ])
        .setup(|app| {
            store::init(app.handle());
            tray::create(app.handle());

            // Start audio-independent scheduling in native code.
            // The webview can throttle timers while hidden; Rust never does.
            scheduler::start(app.handle().clone());

            // Show the window unless launched with --hidden (auto-launch / tray startup).
            let start_hidden = std::env::args().any(|arg| arg == "--hidden");
            if let Some(window) = app.get_webview_window("main") {
                if !start_hidden {
                    window.show().unwrap();
                    window.set_focus().unwrap();
                }
            }

            Ok(())
        })
        .on_window_event(|window, event| {
            // Closing minimizes to the tray instead of quitting (Electron parity).
            if let WindowEvent::CloseRequested { api, .. } = event {
                api.prevent_close();
                window.hide().unwrap();
            }
        })
        .run(tauri::generate_context!())
        .expect("error while running Pips");
}
