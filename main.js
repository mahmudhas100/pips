const { app, BrowserWindow, Tray, Menu, ipcMain } = require('electron');
const path = require('path');
const SimpleStore = require('./utils/simple-store');

// Initialize settings store
const store = new SimpleStore({
    defaults: {
        volume: 50,
        masterPause: false,
        quarterBeepsEnabled: true,
        timeFormat: '24hr',
        launchAtStartup: false
    }
});

let mainWindow = null;
let tray = null;

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 800,  // Increased for testing
        height: 600, // Increased for testing
        resizable: true, // Enable resizing for testing
        backgroundColor: '#000000',
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            contextIsolation: true,
            nodeIntegration: false
        },
        icon: path.join(__dirname, 'assets', 'icons', 'tray-icon.png')
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

function createTray() {
    try {
        const iconPath = path.join(__dirname, 'assets', 'icons', 'tray-icon.png');

        // Check if icon exists
        const fs = require('fs');
        if (!fs.existsSync(iconPath)) {
            console.warn('Tray icon not found, skipping tray creation');
            return;
        }

        tray = new Tray(iconPath);

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
