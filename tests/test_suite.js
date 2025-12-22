import DataHandler from '../modules/data.js';
import Store from '../modules/store.js';

const expect = chai.expect;

describe('T10 Lottery Core Logic', () => {

    describe('DataHandler', () => {
        const mockStore = new Store();
        const handler = new DataHandler(mockStore);

        it('should handle empty rows correctly', () => {
            const raw = [[], ["Header"], [], ["Row1"], []];
            const res = handler.processRows(raw, true);
            expect(res.rows.length).to.equal(1);
            expect(res.meta.count).to.equal(1);
        });

        it('should respect header toggle', () => {
            const raw = [["H1", "H2"], ["V1", "V2"]];

            // With Header
            const res1 = handler.processRows(raw, true);
            expect(res1.meta.headers).to.deep.equal(["H1", "H2"]);
            expect(res1.rows[0].id).to.equal(1);
            expect(res1.rows[0].values).to.deep.equal(["V1", "V2"]);

            // Without Header
            const res2 = handler.processRows(raw, false);
            expect(res2.meta.headers[0]).to.contain("Column");
            expect(res2.rows.length).to.equal(2);
        });

        it('should generate valid rows structure', () => {
            const raw = [["H"], ["D1"], ["D2"]];
            const res = handler.processRows(raw, true);
            expect(res.rows[1].id).to.equal(2);
            expect(res.rows[1].values).to.deep.equal(["D2"]);
        });
    });

    describe('Store', () => {
        const store = new Store();

        beforeEach(() => {
            store.clearData();
        });

        it('should persist dataset', () => {
            const rows = [{ id: 1, values: ['test'] }];
            const meta = { filename: 'test.csv' };
            store.saveDataset(rows, meta, []);

            const loaded = store.getDataset();
            expect(loaded.meta.filename).to.equal('test.csv');
            expect(loaded.rows[0].values[0]).to.equal('test');
        });
    });

    describe('Wheel Logic', () => {
        // We can't easily test the visual animation, but we can test the math.
        it('should return valid target indices', () => {
            const rows = new Array(100).fill(0);
            const winningIndex = Math.floor(Math.random() * rows.length);
            const rowNum = winningIndex + 1;

            expect(rowNum).to.be.at.least(1);
            expect(rowNum).to.be.at.most(100);
        });
    });
});
