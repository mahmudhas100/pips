// Settings persistence - Rust port of utils/simple-store.js.
// Same config.json fields, same defaults, same corrupt-file recovery behavior.

use serde::{Deserialize, Serialize};
use std::fs;
use std::path::PathBuf;
use std::sync::Mutex;
use tauri::{AppHandle, Manager};

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(default, rename_all = "camelCase")]
pub struct Settings {
    pub volume: u32,
    pub master_pause: bool,
    pub quarter_beeps_enabled: bool,
    pub time_format: String,
    pub quiet_hours: bool,
}

impl Default for Settings {
    fn default() -> Self {
        Self {
            volume: 50,
            master_pause: false,
            quarter_beeps_enabled: true,
            time_format: "24hr".to_string(),
            quiet_hours: false,
        }
    }
}

/// App-managed live settings, shared between commands, the tray and the scheduler.
/// `#[derive(Default)]` works because `Mutex<Settings: Default>` is Default.
#[derive(Default)]
pub struct SharedSettings {
    settings: Mutex<Settings>,
}

fn config_path(app: &AppHandle) -> Option<PathBuf> {
    app.path()
        .app_config_dir()
        .ok()
        .map(|dir| dir.join("config.json"))
}

/// Read the config file written by an older build, if the user had one.
/// The pre-rename first Tauri build (Morseo) stored its config under
/// %APPDATA%\com.mahmudhas.morseo; the original Electron app under
/// %APPDATA%\<app name>.
const LEGACY_CONFIG_DIRS: [&str; 3] = [
    "com.mahmudhas.morseo", // First Tauri build, before the rename to Pips
    "Morseo",               // Electron (product name userData)
    "morseo",               // Electron (package name userData)
];

fn load_legacy_settings() -> Option<Settings> {
    let appdata = std::env::var("APPDATA").ok()?;
    for name in LEGACY_CONFIG_DIRS {
        let path = PathBuf::from(&appdata).join(name).join("config.json");
        if let Ok(content) = fs::read_to_string(&path) {
            // serde(default) fills in any missing keys, mirroring
            // `{ ...defaults, ...JSON.parse(data) }` in simple-store.js.
            if let Ok(settings) = serde_json::from_str::<Settings>(&content) {
                eprintln!("Migrated settings from legacy config ({})", name);
                return Some(settings);
            }
        }
    }
    None
}

fn load_file_settings(app: &AppHandle) -> Option<Settings> {
    let path = config_path(app)?;
    let content = fs::read_to_string(path).ok()?;
    match serde_json::from_str::<Settings>(&content) {
        Ok(settings) => Some(settings),
        Err(error) => {
            // Corrupt config resets to defaults, like simple-store.js.
            eprintln!(
                "Settings file is corrupt or unreadable - resetting to defaults: {}",
                error
            );
            None
        }
    }
}

/// Load existing settings (or migrate them from the Electron install) into the
/// managed state, then persist so the new location is authoritative.
pub fn init(app: &AppHandle) {
    let loaded = load_file_settings(app).or_else(load_legacy_settings);
    if let Some(settings) = loaded {
        *app.state::<SharedSettings>().settings.lock().unwrap() = settings;
    }
    persist(app, &current(app));
}

/// Point-in-time copy of settings (cheap; used by the scheduler every tick).
pub fn current(app: &AppHandle) -> Settings {
    app.state::<SharedSettings>()
        .settings
        .lock()
        .unwrap()
        .clone()
}

/// Mutate the live settings through `f`, then persist to disk.
/// Returns a snapshot of the new state, or None if the state lock failed.
pub fn update(app: &AppHandle, f: impl FnOnce(&mut Settings)) -> Option<Settings> {
    let state = app.state::<SharedSettings>();
    let mut settings = state.settings.lock().ok()?;
    f(&mut settings);
    persist(app, &settings.clone());
    Some(settings.clone())
}

/// Write settings to disk (pretty JSON, like simple-store.js).
pub fn persist(app: &AppHandle, settings: &Settings) {
    if let Some(path) = config_path(app) {
        if let Some(parent) = path.parent() {
            let _ = fs::create_dir_all(parent);
        }
        match serde_json::to_string_pretty(settings) {
            Ok(json) => {
                // Write to a temp file, then rename over the real one. Renaming
                // within the same volume is atomic, so a crash or power cut
                // mid-write can at worst leave the stale-but-valid previous
                // config instead of a truncated one.
                let temp = path.with_extension("json.tmp");
                if let Err(error) = fs::write(&temp, json).and_then(|_| fs::rename(&temp, &path)) {
                    eprintln!("Error saving store: {}", error);
                    let _ = fs::remove_file(&temp);
                }
            }
            Err(error) => eprintln!("Error serializing store: {}", error),
        }
    }
}
