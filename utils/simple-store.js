const fs = require('fs');
const path = require('path');
const { app } = require('electron');

class SimpleStore {
    constructor(options = {}) {
        const userDataPath = app.getPath('userData');
        this.filePath = path.join(userDataPath, 'config.json');
        this.defaults = options.defaults || {};
        this.store = this.loadStore();
    }

    loadStore() {
        try {
            if (fs.existsSync(this.filePath)) {
                const data = fs.readFileSync(this.filePath, 'utf8');
                return { ...this.defaults, ...JSON.parse(data) };
            }
        } catch (error) {
            console.error('Settings file is corrupt or unreadable — resetting to defaults.', error);
            // Attempt to delete the corrupt file so next save starts fresh
            try { fs.unlinkSync(this.filePath); } catch (_) { }
        }
        return { ...this.defaults };
    }

    saveStore() {
        try {
            const dir = path.dirname(this.filePath);
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
            }
            fs.writeFileSync(this.filePath, JSON.stringify(this.store, null, 2), 'utf8');
        } catch (error) {
            console.error('Error saving store:', error);
        }
    }

    get(key) {
        return this.store[key];
    }

    set(key, value) {
        this.store[key] = value;
        this.saveStore();
    }

    getAll() {
        return { ...this.store };
    }
}

module.exports = SimpleStore;
