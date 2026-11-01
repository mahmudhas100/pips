// Renderer Process - UI Logic
let settings = {};

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', async () => {
    // Load settings
    settings = await window.__TAURI__.core.invoke('get_all_settings');
    applySettingsToUI();

    // Start time display updates
    startTimeDisplay();

    // Set up event listeners
    setupEventListeners();

    // Listen for pause state changes from tray menu
    window.__TAURI__.event.listen('pause-state-changed', (event) => {
        settings.masterPause = event.payload.paused;
        applySettingsToUI();
    });

    // Audio triggers are scheduled in Rust (native scheduler, no webview throttling)
    window.__TAURI__.event.listen('quarter-beeps', (event) => {
        window.audioSystem.playBeeps(event.payload.count);
    });
    window.__TAURI__.event.listen('hourly-morse', (event) => {
        window.audioSystem.playMorseTime(event.payload.time);
    });

    // Initialize audio context at startup - no user gesture required
    // (autoplay-policy flag set via additionalBrowserArgs removes the restriction)
    window.audioSystem.init();
});

// Apply loaded settings to UI
function applySettingsToUI() {
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
    // Settings modal - icon toggles between gear and X
    const settingsIcon = document.getElementById('settingsIcon');
    const settingsModal = document.getElementById('settingsModal');

    settingsIcon.addEventListener('click', () => {
        const isOpen = settingsModal.classList.toggle('active');
        settingsIcon.classList.toggle('active', isOpen);
    });

    // Close modal when clicking outside
    settingsModal.addEventListener('click', (e) => {
        if (e.target === settingsModal) {
            settingsModal.classList.remove('active');
            settingsIcon.classList.remove('active');
        }
    });

    // Volume slider
    document.getElementById('volumeSlider').addEventListener('input', async (e) => {
        const volume = parseInt(e.target.value);
        settings.volume = volume;
        document.getElementById('volumeValue').textContent = `${volume}%`;
        window.audioSystem.setVolume(volume);
        await window.__TAURI__.core.invoke('set_setting', { key: 'volume', value: volume });
    });

    // Quarter beeps toggle
    document.getElementById('quarterBeeps').addEventListener('change', async (e) => {
        settings.quarterBeepsEnabled = e.target.checked;
        await window.__TAURI__.core.invoke('set_setting', { key: 'quarterBeepsEnabled', value: e.target.checked });
    });

    // Time format radio buttons
    document.querySelectorAll('input[name="timeFormat"]').forEach(radio => {
        radio.addEventListener('change', async (e) => {
            if (e.target.checked) {
                settings.timeFormat = e.target.value;
                await window.__TAURI__.core.invoke('set_setting', { key: 'timeFormat', value: e.target.value });
                updateTimeDisplay(); // Immediately update display
            }
        });
    });

    // Quiet hours toggle
    document.getElementById('quietHours').addEventListener('change', async (e) => {
        settings.quietHours = e.target.checked;
        await window.__TAURI__.core.invoke('set_setting', { key: 'quietHours', value: e.target.checked });
    });

    // Auto-launch toggle
    document.getElementById('autoLaunch').addEventListener('change', async (e) => {
        const enabled = e.target.checked;
        const success = await window.__TAURI__.core.invoke('set_auto_launch', { enabled });
        if (!success) {
            // Revert checkbox if failed
            e.target.checked = !enabled;
        }
    });

    // Load auto-launch status on startup
    window.__TAURI__.core.invoke('get_auto_launch').then(enabled => {
        document.getElementById('autoLaunch').checked = enabled;
    });

    // Click morse display to play current time in morse
    document.querySelector('.morse-display').addEventListener('click', () => {
        const now = new Date();
        let hours = now.getHours();
        const minutes = now.getMinutes();

        if (settings.timeFormat === '12hr') {
            hours = hours % 12 || 12;
        }

        const timeString = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
        window.audioSystem.playMorseTime(timeString);
    });

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
