export default class Store {
    constructor() {
        this.KEYS = {
            DATASET: 't10_dataset',
            SETTINGS: 't10_settings',
            HISTORY: 't10_history'
        };

        // Default Settings
        this.defaultSettings = {
            theme: 'orange',
            splitRatio: '50-50',
            tabOrientation: 'horizontal',
            animationDuration: 10,
            slowdownDuration: 4,
            celebrationDuration: 20,
            showAdvanced: false,
            riggedRow: null
        };
    }

    getSettings() {
        const s = localStorage.getItem(this.KEYS.SETTINGS);
        return s ? { ...this.defaultSettings, ...JSON.parse(s) } : this.defaultSettings;
    }

    saveSettings(settings) {
        localStorage.setItem(this.KEYS.SETTINGS, JSON.stringify(settings));
    }

    // Save processed rows + raw rows to allow re-parsing
    saveDataset(rows, meta, rawRows) {
        const payload = {
            rows,
            meta, // filename, count, etc
            rawRows // Simplest way to handle "First row header" toggle without re-reading file
        };
        try {
            localStorage.setItem(this.KEYS.DATASET, JSON.stringify(payload));
        } catch (e) {
            console.error('Storage quota exceeded probably', e);
            alert('Dataset is too large for LocalStorage persistence, but will work for this session.');
            // In a real app we'd use IndexedDB, but for now fallback to memory only for specific fallback
            this._memDataset = payload;
        }
    }

    getDataset() {
        if (this._memDataset) return this._memDataset;
        const d = localStorage.getItem(this.KEYS.DATASET);
        return d ? JSON.parse(d) : null;
    }

    getRawRows() {
        const d = this.getDataset();
        return d ? d.rawRows : null;
    }

    addHistory(record) {
        const history = this.getHistory();
        history.unshift(record);
        // Keep last 50
        if (history.length > 50) history.pop();
        localStorage.setItem(this.KEYS.HISTORY, JSON.stringify(history));
    }

    getHistory() {
        const h = localStorage.getItem(this.KEYS.HISTORY);
        return h ? JSON.parse(h) : [];
    }

    clearData() {
        localStorage.removeItem(this.KEYS.DATASET);
        localStorage.removeItem(this.KEYS.HISTORY);
        this._memDataset = null;
    }
}
