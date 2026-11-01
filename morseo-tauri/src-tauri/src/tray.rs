// System tray - Rust port of the createTray()/buildMenuTemplate()/updateTrayMenu()
// logic from main.js. Open / Pause-Resume / Quit, left click opens the window.

use tauri::menu::{Menu, MenuBuilder, MenuEvent, MenuItem};
use tauri::tray::{MouseButton, MouseButtonState, TrayIconBuilder, TrayIconEvent};
use tauri::{AppHandle, Emitter, Manager};

use crate::store;

const TRAY_ID: &str = "morseo-tray";

pub fn create(app: &AppHandle) {
    let built = TrayIconBuilder::with_id(TRAY_ID)
        .icon(tauri::include_image!("icons/tray-icon.png"))
        .tooltip("Pips")
        .menu(&build_menu(app))
        .on_menu_event(handle_menu)
        .on_tray_icon_event(|tray_icon, event| {
            // Left click opens the main window (parity with Electron tray).
            if let TrayIconEvent::Click {
                button: MouseButton::Left,
                button_state: MouseButtonState::Up,
                ..
            } = event
            {
                show_main_window(tray_icon.app_handle());
            }
        })
        .build(app);

    if let Err(error) = built {
        eprintln!("Failed to create tray: {}", error);
    }
}

fn show_main_window(app: &AppHandle) {
    if let Some(window) = app.get_webview_window("main") {
        let _ = window.show();
        let _ = window.set_focus();
    }
}

fn build_menu(app: &AppHandle) -> Menu<tauri::Wry> {
    let paused = store::current(app).master_pause;
    let pause_label = if paused { "Resume" } else { "Pause" };

    MenuBuilder::new(app)
        .item(&MenuItem::with_id(app, "open", "Open", true, None::<&str>).unwrap())
        .item(&MenuItem::with_id(app, "pause", pause_label, true, None::<&str>).unwrap())
        .separator()
        .item(&MenuItem::with_id(app, "quit", "Quit", true, None::<&str>).unwrap())
        .build()
        .unwrap()
}

/// Rebuild the tray menu when the pause state changes (label swaps Pause/Resume).
pub fn rebuild(app: &AppHandle) {
    if let Some(tray) = app.tray_by_id(TRAY_ID) {
        tray.set_menu(Some(build_menu(app))).unwrap();
    }
}

fn handle_menu(app: &AppHandle, event: MenuEvent) {
    match event.id().as_ref() {
        "open" => show_main_window(app),
        "pause" => {
            let new_paused = store::update(app, |settings| {
                settings.master_pause = !settings.master_pause;
            })
            .map(|s| s.master_pause);
            rebuild(app);
            let _ = app.emit(
                "pause-state-changed",
                serde_json::json!({ "paused": new_paused }),
            );
        }
        "quit" => app.exit(0),
        _ => {}
    }
}
