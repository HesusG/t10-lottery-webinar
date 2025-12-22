import themes from './themes.js';

const THEMES_CONFIG = {
    "light": "Light (Paper)",
    "dark": "Dark (Charcoal)",
    "orange": "Orange (TripleTen)",
    "christmas": "Christmas",
    "halloween": "Halloween",
    "black_friday": "Black Friday",
    "easter": "Easter"
};

export default class UI {
    constructor(store) {
        this.store = store;
        this.events = {};

        // DOM Elements
        this.tableContent = document.getElementById('virtual-content');
        this.scroller = document.getElementById('virtual-scroller');
        this.displayColSelect = document.getElementById('display-col-select');
    }

    on(event, callback) {
        this.events[event] = callback;
    }

    trigger(event, ...args) {
        if (this.events[event]) this.events[event](...args);
    }

    renderTable(rows) {
        this.currentRows = rows;
        const container = this.tableContent;
        container.innerHTML = '';
        document.getElementById('row-count').textContent = `${rows.length} rows`;
        document.getElementById('table-container').style.display = 'flex';
        document.getElementById('empty-state').style.display = 'none';

        this.updateColumnPicker();

        // Render Chunks Strategy for Performance
        const CHUNK_SIZE = 100;
        let renderedCount = 0;

        const renderChunk = () => {
            const chunk = rows.slice(renderedCount, renderedCount + CHUNK_SIZE);
            const fragment = document.createDocumentFragment();

            chunk.forEach(row => {
                const el = this.createRowElement(row);
                fragment.appendChild(el);
            });

            container.appendChild(fragment);
            renderedCount += CHUNK_SIZE;

            if (renderedCount < rows.length) {
                requestAnimationFrame(renderChunk);
            }
        };

        renderChunk();
    }

    createRowElement(row) {
        const div = document.createElement('div');
        div.className = 'data-row';
        div.id = `row-${row.id}`;

        const num = document.createElement('div');
        num.className = 'row-num';
        num.textContent = row.id;

        const content = document.createElement('div');
        content.className = 'row-data';
        content.textContent = this.getRowDisplayValue(row);

        div.appendChild(num);
        div.appendChild(content);
        return div;
    }

    getRowDisplayValue(row) {
        const dataset = this.store.getDataset();
        if (!dataset) return '';

        const selectedColIndex = this.displayColSelect.value || 0;
        const val = row.values[selectedColIndex];
        return val !== undefined ? val : '';
    }

    updateColumnPicker() {
        const dataset = this.store.getDataset();
        if (!dataset) return;

        const headers = dataset.meta.headers;
        const currentVal = this.displayColSelect.value;

        this.displayColSelect.innerHTML = '';
        headers.forEach((h, idx) => {
            const opt = document.createElement('option');
            opt.value = idx;
            opt.textContent = h;
            this.displayColSelect.appendChild(opt);
        });

        if (currentVal && headers[currentVal]) {
            this.displayColSelect.value = currentVal;
        }

        this.displayColSelect.onchange = () => {
            const rows = Array.from(this.tableContent.children);
            rows.forEach((el) => {
                const rowId = parseInt(el.id.replace('row-', ''));
                const rowData = this.currentRows[rowId - 1];
                if (rowData) {
                    el.querySelector('.row-data').textContent = this.getRowDisplayValue(rowData);
                }
            });
        };

        const chkHeader = document.getElementById('chk-header');
        chkHeader.onclick = (e) => {
            this.trigger('headerToggle', e.target.checked);
        };
    }

    scrollToRow(rowId) {
        const el = document.getElementById(`row-${rowId}`);
        if (el) {
            el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    }

    highlightWinner(rowId) {
        document.querySelectorAll('.data-row.winner').forEach(el => el.classList.remove('winner'));
        const el = document.getElementById(`row-${rowId}`);
        if (el) el.classList.add('winner');
    }

    applyTheme(themeKey) {
        const theme = themes[themeKey];
        if (theme) {
            const root = document.documentElement;
            Object.entries(theme.tokens).forEach(([k, v]) => {
                root.style.setProperty(k, v);
            });
        }
    }

    applyLayout(splitRatio, orientation) {
        const [left, right] = splitRatio.split('-');
        const wheelPane = document.getElementById('pane-wheel');
        const dataPane = document.getElementById('pane-data');

        if (orientation === 'vertical') {
            document.querySelector('.tab-controls').style.flexDirection = 'column';
        } else {
            document.querySelector('.tab-controls').style.flexDirection = 'row';
        }

        wheelPane.style.width = `${left}%`;
        dataPane.style.width = `${right}%`;

        document.querySelectorAll('.btn-group-item').forEach(b => b.classList.remove('active'));

        const splitBtn = document.querySelector(`[data-split="${splitRatio}"]`);
        if (splitBtn) splitBtn.classList.add('active');

        const orientBtn = document.querySelector(`[data-orient="${orientation}"]`);
        if (orientBtn) orientBtn.classList.add('active');
    }

    renderSettings(settings) {
        const themeSel = document.getElementById('setting-theme');
        themeSel.innerHTML = '';
        Object.entries(THEMES_CONFIG).forEach(([k, label]) => {
            const opt = document.createElement('option');
            opt.value = k;
            opt.textContent = label;
            themeSel.appendChild(opt);
        });
        themeSel.value = settings.theme;

        themeSel.onchange = (e) => this.trigger('settingChange', 'theme', e.target.value);

        document.querySelectorAll('[data-split]').forEach(btn => {
            btn.onclick = () => this.trigger('settingChange', 'splitRatio', btn.dataset.split);
        });

        document.querySelectorAll('[data-orient]').forEach(btn => {
            btn.onclick = () => this.trigger('settingChange', 'tabOrientation', btn.dataset.orient);
        });

        ['duration', 'celebration'].forEach(key => {
            const el = document.getElementById(`setting-${key}`);
            if (el) {
                if (key === 'duration') el.value = settings.animationDuration;
                if (key === 'celebration') el.value = settings.celebrationDuration;
                el.onchange = (e) => {
                    const k = key === 'duration' ? 'animationDuration' : 'celebrationDuration';
                    this.trigger('settingChange', k, parseInt(e.target.value));
                };
            }
        });

        const advChk = document.getElementById('chk-advanced');
        const advPanel = document.getElementById('advanced-controls');
        advChk.checked = settings.showAdvanced;
        if (settings.showAdvanced) advPanel.classList.remove('hidden');

        advChk.onchange = (e) => {
            const show = e.target.checked;
            if (show) advPanel.classList.remove('hidden');
            else advPanel.classList.add('hidden');
            this.trigger('settingChange', 'showAdvanced', show);
        };

        const rigInput = document.getElementById('setting-rigged-row');
        rigInput.value = settings.riggedRow || '';
        rigInput.onchange = (e) => this.trigger('settingChange', 'riggedRow', parseInt(e.target.value));

        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.onclick = () => {
                document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
                document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));

                btn.classList.add('active');
                document.getElementById(`tab-${btn.dataset.tab}`).classList.add('active');
            };
        });
    }

    showResumeOption(callback) {
        const div = document.getElementById('recent-files');
        div.style.display = 'block';
        document.getElementById('btn-resume').onclick = callback;
    }

    hideEmptyState() {
        document.getElementById('empty-state').style.display = 'none';
        document.getElementById('table-container').style.display = 'flex';
    }

    enableControls() {
        document.getElementById('btn-spin').disabled = false;
    }

    setSpinningState(isSpinning) {
        const btn = document.getElementById('btn-spin');
        btn.disabled = isSpinning;
        btn.textContent = isSpinning ? 'SPINNING...' : 'SPIN WHEEL';
    }

    updateHistoryList() {
        const list = document.getElementById('history-list');
        list.innerHTML = '';
        const history = this.store.getHistory();
        history.forEach(h => {
            const li = document.createElement('li');
            li.textContent = `Row #${h.rowNumber} - ${new Date(h.timestamp).toLocaleTimeString()}`;
            li.style.padding = '0.5rem';
            li.style.borderBottom = '1px solid var(--border)';
            list.appendChild(li);
        });
    }
}
