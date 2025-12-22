export default class DataHandler {
    constructor(store) {
        this.store = store;
    }

    parseFile(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();

            reader.onload = (e) => {
                const data = new Uint8Array(e.target.result);
                try {
                    const workbook = XLSX.read(data, { type: 'array' });
                    const firstSheetName = workbook.SheetNames[0];
                    const worksheet = workbook.Sheets[firstSheetName];
                    // Get raw array of arrays
                    const rows = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
                    resolve(rows);
                } catch (err) {
                    reject(err);
                }
            };

            reader.onerror = reject;

            reader.readAsArrayBuffer(file);
        });
    }

    processRows(rawRows, useHeader, filename = 'Unknown') {
        // Filter empty rows
        let cleanRows = rawRows.filter(r => r && r.length > 0);

        let headers = [];
        let dataRows = [];

        if (useHeader && cleanRows.length > 0) {
            headers = cleanRows[0];
            dataRows = cleanRows.slice(1);
        } else {
            // Generate Generic Headers (A, B, C...)
            const colCount = cleanRows.reduce((max, r) => Math.max(max, r.length), 0);
            for (let i = 0; i < colCount; i++) {
                headers.push(`Column ${i + 1}`);
            }
            dataRows = cleanRows;
        }

        // Map to structured objects for the table
        // We will store just the array of values to save space, and headers separately
        // But for UI convenience, let's make an object wrapper for the "processed" view

        const rows = dataRows.map((rowArr, index) => {
            return {
                id: index + 1, // 1-based Row ID
                values: rowArr
            };
        });

        return {
            rows, // [{id: 1, values: ["John", "Doe"]}]
            meta: {
                headers,
                filename,
                useHeader,
                count: rows.length,
                lastModified: Date.now()
            }
        };
    }
}
