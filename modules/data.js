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
                    // Start with UTF-8 (65001). 
                    // If we wanted to be fancier, we could detect BOM, but XLSX usually handles BOM.
                    const workbook = XLSX.read(data, { type: 'array', codepage: 65001 });

                    if (!workbook.SheetNames.length) {
                        throw new Error("El archivo no contiene hojas visibles.");
                    }

                    const firstSheetName = workbook.SheetNames[0];
                    const worksheet = workbook.Sheets[firstSheetName];

                    // Get raw array of arrays
                    const rows = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: "" });
                    resolve(rows);
                } catch (err) {
                    console.error("XLSX Parse Error:", err);
                    reject(new Error("No se pudo leer el archivo. Asegúrate de que sea un CSV o Excel válido."));
                }
            };

            reader.onerror = () => reject(new Error("Error de lectura del archivo."));

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
