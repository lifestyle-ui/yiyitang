import { readFileSync } from 'fs';
import { getDocument } from '../node_modules/pdfjs-dist/legacy/build/pdf.mjs';

const data = new Uint8Array(readFileSync('./public/hanshi-template.pdf'));
const pdf = await getDocument({ data, useWorkerFetch: false, isEvalSupported: false, useSystemFonts: true }).promise;

const result = {};

for (let p = 1; p <= pdf.numPages; p++) {
  const page = await pdf.getPage(p);
  const text = await page.getTextContent();
  const items = text.items;

  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    if (!item.str?.trim()) continue;

    // Find □ characters
    if (item.str === '□' || item.str.includes('□')) {
      const x = Math.round(item.transform[4]);
      const y = Math.round(item.transform[5]);

      // Look ahead to find the code number (within next few items, same y level ±5)
      let code = null;
      for (let j = i + 1; j < Math.min(i + 8, items.length); j++) {
        const next = items[j];
        if (!next.str?.trim()) continue;
        const ny = Math.round(next.transform[5]);
        if (Math.abs(ny - y) > 8) break;

        // Try to parse as a code number
        const s = next.str.trim();
        const codeMatch = s.match(/^(\d{3,4}(-\d)?)/) || s.match(/^(\d+)/);
        if (codeMatch) {
          code = codeMatch[1];
          break;
        }
      }

      if (code) {
        result[code] = { page: p - 1, x, y };
        process.stdout.write(`[p${p}] code=${code} at (${x},${y})\n`);
      } else {
        process.stdout.write(`[p${p}] □ at (${x},${y}) - no code\n`);
      }
    }
  }
}

process.stdout.write('\n\nFINAL MAP:\n');
process.stdout.write(JSON.stringify(result, null, 2));
