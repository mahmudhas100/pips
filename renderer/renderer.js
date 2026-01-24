// Renderer Process - UI Logic
let settings = {};

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', async () => {
    // Load settings
    settings = await window.electronAPI.getAllSettings();
    console.log('Initial settings loaded:', JSON.stringify(settings));
    applySettingsToUI();

    // Start time display updates
    startTimeDisplay();

    // Start audio scheduler
    window.timeScheduler.updateSettings(settings);
    window.timeScheduler.start();

    // Set up event listeners
    setupEventListeners();

    // Listen for pause state changes from tray menu
    window.electronAPI.onPauseStateChanged((isPaused) => {
        settings.masterPause = isPaused;
        applySettingsToUI();
        window.timeScheduler.updateSettings(settings);
    });
});

// Apply loaded settings to UI
function applySettingsToUI() {
    // Master toggle
    const masterToggle = document.getElementById('masterToggle');
    masterToggle.checked = !settings.masterPause;

    // Volume
    const volumeSlider = document.getElementById('volumeSlider');
    const volumeValue = document.getElementById('volumeValue');
    volumeSlider.value = settings.volume;
    volumeValue.textContent = `${settings.volume}%`;
    window.audioSystem.setVolume(settings.volume);

    // Quarter beeps
    const quarterBeeps = document.getElementById('quarterBeeps');
    quarterBeeps.checked = settings.quarterBeepsEnabled;

    // Update status indicator
    updateStatusIndicator();
}

// Update time display
function startTimeDisplay() {
    updateTimeDisplay();
    setInterval(updateTimeDisplay, 1000);
}

function updateTimeDisplay() {
    const now = new Date();
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');

    const timeText = `${hours}:${minutes}:${seconds}`;
    document.getElementById('currentTime').textContent = timeText;
}

// Set up event listeners
function setupEventListeners() {
    // Master toggle
    document.getElementById('masterToggle').addEventListener('change', async (e) => {
        settings.masterPause = !e.target.checked;
        console.log(`Master toggle changed: checked=${e.target.checked}, masterPause=${settings.masterPause}`);;
        console.log('Current settings object:', JSON.stringify(settings));
        await window.electronAPI.setSetting('masterPause', settings.masterPause);

        // Pass updated settings to scheduler with new object
        window.timeScheduler.updateSettings({
            masterPause: settings.masterPause,
            quarterBeepsEnabled: settings.quarterBeepsEnabled
        });
        updateStatusIndicator();
    });

    // Volume slider
    document.getElementById('volumeSlider').addEventListener('input', async (e) => {
        const volume = parseInt(e.target.value);
        settings.volume = volume;
        document.getElementById('volumeValue').textContent = `${volume}%`;
        window.audioSystem.setVolume(volume);
        await window.electronAPI.setSetting('volume', volume);
    });

    // Quarter beeps toggle
    document.getElementById('quarterBeeps').addEventListener('change', async (e) => {
        settings.quarterBeepsEnabled = e.target.checked;
        console.log(`Quarter beeps toggle changed: ${e.target.checked}`);
        console.log('Current settings object:', JSON.stringify(settings));
        await window.electronAPI.setSetting('quarterBeepsEnabled', e.target.checked);

        // Pass updated settings to scheduler with new object
        window.timeScheduler.updateSettings({
            masterPause: settings.masterPause,
            quarterBeepsEnabled: settings.quarterBeepsEnabled
        });
    });

    // Initialize audio context on first user interaction
    document.body.addEventListener('click', () => {
        window.audioSystem.init();
    }, { once: true });
}

// Update status indicator
function updateStatusIndicator() {
    const statusIndicator = document.getElementById('statusIndicator');

    if (settings.masterPause) {
        statusIndicator.textContent = 'Paused';
        statusIndicator.className = 'status-paused';
    } else {
        statusIndicator.textContent = 'Active';
        statusIndicator.className = 'status-active';
    }
}
