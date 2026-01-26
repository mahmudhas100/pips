// Renderer Process - UI Logic
let settings = {};

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', async () => {
    // Load settings
    settings = await window.electronAPI.getAllSettings();
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

    // Initialize audio context early to prevent missed first beeps
    // This happens after user interaction (DOMContentLoaded)
    window.audioSystem.init();
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

    // Time format
    const formatRadio = document.querySelector(`input[name="timeFormat"][value="${settings.timeFormat || '24hr'}"]`);
    if (formatRadio) {
        formatRadio.checked = true;
    }

    // Quiet hours
    const quietHours = document.getElementById('quietHours');
    quietHours.checked = settings.quietHours || false;

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
    let hours = now.getHours();
    const minutes = now.getMinutes();
    const seconds = now.getSeconds();

    // Apply time format
    let displayHours = hours;
    if (settings.timeFormat === '12hr') {
        displayHours = hours % 12 || 12; // Convert 0 to 12 for midnight
    }

    // Update numeric time
    const hoursStr = String(displayHours).padStart(2, '0');
    const minutesStr = String(minutes).padStart(2, '0');
    const secondsStr = String(seconds).padStart(2, '0');
    const timeText = `${hoursStr}:${minutesStr}:${secondsStr}`;
    document.getElementById('currentTime').textContent = timeText;

    // Update morse code display
    const morse = window.morseEncoder.timeToVisualMorse(displayHours, minutes, seconds);
    document.getElementById('morseHours').textContent = morse.hours;
    document.getElementById('morseMinutes').textContent = morse.minutes;
    document.getElementById('morseSeconds').textContent = morse.seconds;
}

// Set up event listeners
function setupEventListeners() {
    // Settings modal
    const settingsIcon = document.getElementById('settingsIcon');
    const settingsModal = document.getElementById('settingsModal');
    const closeSettings = document.getElementById('closeSettings');

    settingsIcon.addEventListener('click', () => {
        settingsModal.classList.add('active');
    });

    closeSettings.addEventListener('click', () => {
        settingsModal.classList.remove('active');
    });

    // Close modal when clicking outside
    settingsModal.addEventListener('click', (e) => {
        if (e.target === settingsModal) {
            settingsModal.classList.remove('active');
        }
    });

    // Master toggle
    document.getElementById('masterToggle').addEventListener('change', async (e) => {
        settings.masterPause = !e.target.checked;
        await window.electronAPI.setSetting('masterPause', settings.masterPause);

        // Pass updated settings to scheduler with new object
        window.timeScheduler.updateSettings({
            masterPause: settings.masterPause,
            quarterBeepsEnabled: settings.quarterBeepsEnabled,
            quietHours: settings.quietHours
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
        await window.electronAPI.setSetting('quarterBeepsEnabled', e.target.checked);

        // Pass updated settings to scheduler with new object
        window.timeScheduler.updateSettings({
            masterPause: settings.masterPause,
            quarterBeepsEnabled: settings.quarterBeepsEnabled,
            quietHours: settings.quietHours
        });
    });

    // Time format radio buttons
    document.querySelectorAll('input[name="timeFormat"]').forEach(radio => {
        radio.addEventListener('change', async (e) => {
            if (e.target.checked) {
                settings.timeFormat = e.target.value;
                await window.electronAPI.setSetting('timeFormat', e.target.value);
                updateTimeDisplay(); // Immediately update display
            }
        });
    });

    // Quiet hours toggle
    document.getElementById('quietHours').addEventListener('change', async (e) => {
        settings.quietHours = e.target.checked;
        await window.electronAPI.setSetting('quietHours', e.target.checked);

        // Pass updated settings to scheduler
        window.timeScheduler.updateSettings({
            masterPause: settings.masterPause,
            quarterBeepsEnabled: settings.quarterBeepsEnabled,
            quietHours: settings.quietHours
        });
    });

    // Auto-launch toggle
    document.getElementById('autoLaunch').addEventListener('change', async (e) => {
        const enabled = e.target.checked;
        const success = await window.electronAPI.setAutoLaunch(enabled);
        if (!success) {
            // Revert checkbox if failed
            e.target.checked = !enabled;
        }
    });

    // Load auto-launch status on startup
    window.electronAPI.getAutoLaunch().then(enabled => {
        document.getElementById('autoLaunch').checked = enabled;
    });

    // Test morse button
    document.getElementById('testMorseBtn').addEventListener('click', () => {
        const now = new Date();
        let hours = now.getHours();
        const minutes = now.getMinutes();

        // Apply time format
        if (settings.timeFormat === '12hr') {
            hours = hours % 12 || 12;
        }

        const timeString = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
        window.audioSystem.playMorseTime(timeString);
    });

    // Initialize audio context on first user interaction
    document.body.addEventListener('click', () => {
        window.audioSystem.init();
    }, { once: true });
}

// Update status indicator
function updateStatusIndicator() {
    const indicator = document.getElementById('statusIndicator');
    if (settings.masterPause) {
        indicator.textContent = 'Paused';
        indicator.className = 'status-badge status-paused';
    } else {
        indicator.textContent = 'Active';
        indicator.className = 'status-badge status-active';
    }
}
