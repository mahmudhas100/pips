const { app, BrowserWindow, ipcMain, Tray, Menu, nativeImage } = require('electron');
const path = require('path');
const Store = require('./utils/simple-store');
const AutoLaunch = require('auto-launch');

let mainWindow;
let tray = null;
let store;

// Initialize auto-launcher
const morseoAutoLauncher = new AutoLaunch({
    name: 'Morseo',
    path: app.getPath('exe'),
});

// Initialize settings store
store = new Store({
    defaults: {
        volume: 50,
        masterPause: false,
        quarterBeepsEnabled: true,
        timeFormat: '24hr',
        launchAtStartup: false
    }
});

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 400,
        height: 450,
        resizable: false,
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

// Create system tray icon
function createTray() {
    try {
        const { nativeImage } = require('electron');
        const iconPath = path.join(__dirname, 'assets', 'icons', 'tray-icon.png');

        // Check if file exists
        const fs = require('fs');
        if (!fs.existsSync(iconPath)) {
            console.error('Tray icon file not found at:', iconPath);
            return;
        }

        // Load from file - more reliable than base64 on Windows
        const trayIcon = nativeImage.createFromPath(iconPath);

        if (trayIcon.isEmpty()) {
            console.error('Tray icon is empty!');
            return;
        }

        tray = new Tray(trayIcon);
        console.log('Tray icon loaded from file');

        const contextMenu = Menu.buildFromTemplate([
            {
                label: 'Open',
                click: () => {
                    mainWindow.show();
                }
            },
            {
                label: store.get('masterPause') ? 'Resume' : 'Pause',
                click: () => {
                    const currentState = store.get('masterPause');
                    store.set('masterPause', !currentState);
                    updateTrayMenu();
                    // Notify renderer of pause state change
                    if (mainWindow) {
                        mainWindow.webContents.send('pause-state-changed', !currentState);
                    }
                }
            },
            {
                type: 'separator'
            },
            {
                label: 'Quit',
                click: () => {
                    app.isQuitting = true;
                    app.quit();
                }
            }
        ]);

        tray.setToolTip('Morseo');
        tray.setContextMenu(contextMenu);

        // Show window on tray click
        tray.on('click', () => {
            mainWindow.show();
        });

        console.log('Tray icon created successfully');
    } catch (error) {
        console.error('Failed to create tray:', error);
    }
}

function updateTrayMenu() {
    if (!tray) return; // Skip if tray wasn't created

    const contextMenu = Menu.buildFromTemplate([
        {
            label: 'Open',
            click: () => {
                mainWindow.show();
            }
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
        {
            type: 'separator'
        },
        {
            label: 'Quit',
            click: () => {
                app.isQuitting = true;
                app.quit();
            }
        }
    ]);

    tray.setContextMenu(contextMenu);
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

// Auto-launch handlers
ipcMain.handle('get-auto-launch', async () => {
    try {
        return await morseoAutoLauncher.isEnabled();
    } catch (error) {
        console.error('Error checking auto-launch:', error);
        return false;
    }
});

ipcMain.handle('set-auto-launch', async (event, enabled) => {
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
    // Only quit when user selects Quit from tray menu
});

app.on('before-quit', () => {
    app.isQuitting = true;
});
