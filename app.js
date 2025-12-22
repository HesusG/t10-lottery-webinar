import Store from './modules/store.js';
import UI from './modules/ui.js';
import DataHandler from './modules/data.js';
import Wheel from './modules/wheel.js';
import Celebration from './modules/celebration.js';

// App Orchestration
class App {
    constructor() {
        this.store = new Store();
        this.ui = new UI(this.store);
        this.data = new DataHandler(this.store);
        this.wheel = new Wheel();
        this.celebration = new Celebration();

        this.init();
    }

    async init() {
        console.log('T10 Lottery App Initializing...');

        // 1. Load Settings & Theme
        const settings = this.store.getSettings();
        this.ui.applyTheme(settings.theme);
        this.ui.applyLayout(settings.splitRatio, settings.tabOrientation);
        this.ui.renderSettings(settings);

        // 2. Load Persisted Data
        const savedDataset = this.store.getDataset();
        if (savedDataset && savedDataset.rows.length > 0) {
            console.log('Found saved dataset:', savedDataset.meta.filename);
            this.ui.showResumeOption(() => {
                this.loadData(savedDataset.rows, savedDataset.meta, true);
            });
        }

        // 3. Bind Events
        this.bindEvents();
    }

    bindEvents() {
        // File Upload
        document.getElementById('file-upload').addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                this.handleFileUpload(file);
            }
        });

        // Spin Button
        document.getElementById('btn-spin').addEventListener('click', () => {
            this.startSpinSequence();
        });

        // Skip Celebration
        document.getElementById('btn-skip-celebration').addEventListener('click', () => {
            this.celebration.stop();
        });

        // Global Keys
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') this.celebration.stop();
        });

        // Checkbox: External RNG
        document.getElementById('chk-external-rng').addEventListener('change', (e) => {
            const isEnabled = e.target.checked;
            this.toggleRngMode(isEnabled);
        });

        // Settings Changes
        this.ui.on('settingChange', (key, value) => {
            const current = this.store.getSettings();
            current[key] = value;
            this.store.saveSettings(current);

            if (key === 'theme') this.ui.applyTheme(value);
            if (key === 'splitRatio' || key === 'tabOrientation') {
                this.ui.applyLayout(current.splitRatio, current.tabOrientation);
            }
        });

        // Header Toggle in Table
        this.ui.on('headerToggle', (isChecked) => {
            // Re-interpret current data with/without header
            // This is complex because we might need to re-parse or just re-index
            // For simplicity, we might just reload the dataset if we had the raw file, 
            // OR simpler: The Store saves "raw" rows. 
            // DataHandler.setUseHeaderRow(isChecked) -> returns formatted rows
            const rawData = this.store.getRawRows();
            if (rawData) {
                const processed = this.data.processRows(rawData, isChecked);
                this.store.saveDataset(processed.rows, processed.meta, rawData); // Resave with new mode
                this.ui.renderTable(processed.rows);
                this.wheel.initWheel(processed.rows.length);
            }
        });
    }

    toggleRngMode(enabled) {
        const wheelPane = document.getElementById('pane-wheel');

        if (enabled) {
            wheelPane.classList.add('split-mode');
        } else {
            wheelPane.classList.remove('split-mode');
        }
    }

    async handleFileUpload(file) {
        try {
            const rawRows = await this.data.parseFile(file);
            const useHeader = document.getElementById('chk-header').checked;
            const processed = this.data.processRows(rawRows, useHeader, file.name);

            // Save & Render
            this.loadData(processed.rows, processed.meta, false, rawRows);
        } catch (err) {
            alert('Error parsing file: ' + err.message);
            console.error(err);
        }
    }

    loadData(rows, meta, isResume = false, rawRows = null) {
        // If resuming, we might not have rawRows in memory if we optimized storage
        // But Store should handle that.

        if (!isResume && rawRows) {
            this.store.saveDataset(rows, meta, rawRows);
        }

        this.ui.renderTable(rows);
        this.ui.enableControls();

        // Initialize wheel with N items
        this.wheel.initWheel(rows.length);

        // Hide empty state
        this.ui.hideEmptyState();
    }

    async startSpinSequence() {
        const rows = this.store.getDataset().rows;
        if (!rows || rows.length === 0) return;

        // 1. Determine Winner
        const settings = this.store.getSettings();
        let winningIndex; // 0-based index in the 'rows' array

        // Check for External RNG
        const useExternalRng = document.getElementById('chk-external-rng').checked;

        this.ui.setSpinningState(true);

        if (useExternalRng) {
            // -- EXTERNAL MODE (ANU Quantum) --
            const rngValue = document.getElementById('rng-value');
            const rngRawValue = document.getElementById('rng-raw-value');

            rngValue.innerText = "Quantum...";
            rngRawValue.innerText = "Conectando al laboratorio...";
            rngValue.classList.remove('revealed');

            try {
                // Fetch random number from ANU API (Uint16: 0-65535)
                // Use a proxy or direct depending on CORS. ANU usually supports CORS.
                // Using fallback endpoint if primary fails is good practice, but we'll try primary.
                const response = await fetch(`https://qrng.anu.edu.au/API/jsonI.php?length=1&type=uint16`);
                if (!response.ok) throw new Error('API Error');

                const json = await response.json();
                if (!json.success && !json.data) throw new Error('Invalid JSON');

                const quantumNum = json.data[0]; // 0 - 65535

                // Map 0-65535 to 0-(rows.length-1)
                // This is a simple modulo mapping. For strict uniformity, we'd accept only if < limit, but modulo is fine for this UI.
                winningIndex = quantumNum % rows.length;

                rngRawValue.innerText = `Source: ${quantumNum} (Uint16)`;

            } catch (err) {
                console.error("Quantum RNG Error, falling back to local:", err);
                rngRawValue.innerText = "Error - Fallback Local";
                winningIndex = Math.floor(Math.random() * rows.length);
            }

        } else {
            // -- LOCAL MODE --
            // Rigged mode check
            if (settings.riggedRow && settings.riggedRow > 0 && settings.riggedRow <= rows.length) {
                winningIndex = settings.riggedRow - 1; // Convert 1-based row # to 0-based index
                console.log('Rigged winner:', winningIndex + 1);
            } else {
                winningIndex = Math.floor(Math.random() * rows.length);
            }
        }

        const winningRow = rows[winningIndex];
        const targetNumber = winningIndex + 1;

        // 3. Spin Wheel
        this.wheel.spinTo(targetNumber, settings.animationDuration, settings.slowdownDuration).then(() => {
            // 4. Reveal RNG if needed
            if (useExternalRng) {
                const rngValue = document.getElementById('rng-value');
                rngValue.innerText = targetNumber;
                rngValue.classList.add('revealed');
            }

            // 5. Celebration
            this.ui.setSpinningState(false);
            this.celebration.start(winningRow, targetNumber, settings.celebrationDuration);

            // 6. Update Table & History
            this.ui.scrollToRow(targetNumber);
            this.ui.highlightWinner(targetNumber);
            this.store.addHistory({
                rowNumber: targetNumber,
                timestamp: new Date().toISOString(),
                winnerData: winningRow,
                datasetName: this.store.getDataset().meta.filename,
                source: useExternalRng ? 'ANU Quantum Origin' : 'Local RNG'
            });
            this.ui.updateHistoryList(); // Refresh history UI
        });
    }
}

// Start
document.addEventListener('DOMContentLoaded', () => {
    window.app = new App();
});
