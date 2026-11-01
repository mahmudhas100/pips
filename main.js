const { app, BrowserWindow, ipcMain, Tray, Menu, nativeImage } = require('electron');
const path = require('path');
const fs = require('fs');
const Store = require('./utils/simple-store');
const AutoLaunch = require('auto-launch');

// Allow AudioContext to work without user gesture (needed for scheduled beeps when window is hidden)
app.commandLine.appendSwitch('autoplay-policy', 'no-user-gesture-required');

let mainWindow;
let tray = null;

// Initialize auto-launcher (don't pass path - let it auto-detect)
const morseoAutoLauncher = new AutoLaunch({
    name: 'Morseo',
    isHidden: true  // Pass --hidden flag on auto-launch
});

// Initialize settings store
const store = new Store({
    defaults: {
        volume: 50,
        masterPause: false,
        quarterBeepsEnabled: true,
        timeFormat: '24hr',
        launchAtStartup: false
    }
});

function createWindow() {
    // Check if launched with --hidden flag (auto-launch at startup)
    const startHidden = process.argv.includes('--hidden');

    mainWindow = new BrowserWindow({
        width: 400,
        height: 450,
        resizable: false,
        show: !startHidden,  // Don't show window if auto-launched
        backgroundColor: '#000000',
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            contextIsolation: true,
            nodeIntegration: false,
            backgroundThrottling: false // Prevent timer throttling when hidden
        },
        icon: path.join(__dirname, 'assets', 'icons', 'app-icon.png')
    });

    mainWindow.loadFile(path.join(__dirname, 'renderer', 'index.html'));

    // Minimize to tray instead of taskbar
    mainWindow.on('minimize', (event) => {
        event.preventDefault();
        mainWindow.hide();
    });

    mainWindow.on('close', (event) => {
        if (!app.isQuitting) {
            event.preventDefault();
            mainWindow.hide();
        }
        return false;
    });
}

// Build tray context menu template (single source of truth)
function buildMenuTemplate() {
    return [
        {
            label: 'Open',
            click: () => { mainWindow.show(); }
        },
        {
            label: store.get('masterPause') ? 'Resume' : 'Pause',
            click: () => {
                const currentState = store.get('masterPause');
                store.set('masterPause', !currentState);
                updateTrayMenu();
                if (mainWindow) {
                    mainWindow.webContents.send('pause-state-changed', !currentState);
                }
            }
        },
        { type: 'separator' },
        {
            label: 'Quit',
            click: () => { app.quit(); }
        }
    ];
}

// Create system tray icon
function createTray() {
    try {
        const iconPath = path.join(__dirname, 'assets', 'icons', 'tray-icon.png');

        if (!fs.existsSync(iconPath)) {
            console.error('Tray icon file not found at:', iconPath);
            return;
        }

        const trayIcon = nativeImage.createFromPath(iconPath);

        if (trayIcon.isEmpty()) {
            console.error('Tray icon is empty!');
            return;
        }

        tray = new Tray(trayIcon);
        console.log('Tray icon loaded from file');

        tray.setToolTip('Morseo');
        tray.setContextMenu(Menu.buildFromTemplate(buildMenuTemplate()));
        tray.on('click', () => { mainWindow.show(); });

        console.log('Tray icon created successfully');
    } catch (error) {
        console.error('Failed to create tray:', error);
    }
}

function updateTrayMenu() {
    if (!tray) return;
    tray.setContextMenu(Menu.buildFromTemplate(buildMenuTemplate()));
}

// IPC Handlers
ipcMain.handle('get-setting', (event, key) => {
    return store.get(key);
});

ipcMain.handle('set-setting', (event, key, value) => {
    store.set(key, value);

    // Update tray menu if pause state changed
    if (key === 'masterPause') {
        updateTrayMenu();
    }

    return true;
});

ipcMain.handle('get-all-settings', () => {
    return store.getAll();
});

// Detect if running in dev mode (not packaged)
const isDev = !app.isPackaged;

// Auto-launch handlers (only work in packaged mode)
ipcMain.handle('get-auto-launch', async () => {
    if (isDev) {
        console.log('Auto-launch check skipped (dev mode)');
        return false;
    }
    try {
        return await morseoAutoLauncher.isEnabled();
    } catch (error) {
        console.error('Error checking auto-launch:', error);
        return false;
    }
});

ipcMain.handle('set-auto-launch', async (event, enabled) => {
    if (isDev) {
        console.warn('Auto-launch toggle ignored in dev mode - only works in packaged app');
        return false;
    }
    try {
        if (enabled) {
            await morseoAutoLauncher.enable();
        } else {
            await morseoAutoLauncher.disable();
        }
        return true;
    } catch (error) {
        console.error('Error setting auto-launch:', error);
        return false;
    }
});

// App lifecycle
app.whenReady().then(() => {
    createWindow();
    createTray();

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            createWindow();
        }
    });
});

app.on('window-all-closed', () => {
    // Don't quit on window close, keep running in tray
});

app.on('before-quit', () => {
    app.isQuitting = true;
});
