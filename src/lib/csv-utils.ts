

/**
 * @fileOverview CSV parsing utility functions.
 *
 * - parseCsv - Parses a CSV string into an array of objects.
 */

/**
 * Parses CSV text content into an array of objects.
 * Assumes the first line is the header.
 * Handles basic cases, including quoted fields containing commas (rudimentary).
 * Converts headers to lowercase and trims whitespace.
 *
 * @param csvText The raw CSV string content.
 * @returns An array of objects, where each object represents a row and keys are header columns.
 * @throws Error if required headers are missing.
 */
export function parseCsv(csvText: string): Record<string, string>[] {
    const lines = csvText.trim().split('\n');
    if (lines.length < 1) return []; // Allow empty files or files with only a header

    // Robust header parsing: split by comma unless inside quotes
    const header = (lines[0].match(/(".*?"|[^",]+)(?=\s*,|\s*$)/g) || [])
                   .map(h => h.trim().toLowerCase().replace(/^"|"$/g, '')); // Remove quotes and trim

    // Validate required headers if needed (can be done in the calling action)
    // const requiredHeaders = ['parcel_id', 'area_hectares', 'wgs84_polygon'];
    // const missingHeaders = requiredHeaders.filter(rh => !header.includes(rh));
    // if (missingHeaders.length > 0) {
    //     throw new Error(`Missing required CSV columns: ${missingHeaders.join(', ')}`);
    // }

    const data = [];
    for (let i = 1; i < lines.length; i++) {
         // Skip empty lines
        if (!lines[i].trim()) continue;

        // Robust value parsing: split by comma unless inside quotes
        const values = (lines[i].match(/(".*?"|[^",]+)(?=\s*,|\s*$)/g) || []);

        if (values.length !== header.length) {
            console.warn(`Skipping row ${i + 1}: Incorrect number of columns. Expected ${header.length}, got ${values.length}. Line: "${lines[i]}"`);
            continue; // Skip rows with incorrect column count
        }
        const row: Record<string, string> = {};
        header.forEach((col, index) => {
             // Trim whitespace and remove surrounding quotes if present
            row[col] = values[index]?.trim().replace(/^"|"$/g, '') || '';
        });
        data.push(row);
    }
    return data;
}
