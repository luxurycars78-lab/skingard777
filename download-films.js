/**
 * download-films.js
 *
 * Downloads all META PPF colored-film photos listed in films.json into
 * images/films/ next to this script. Run with Node 18+ (uses built-in fetch).
 *
 * Usage:
 *   node download-films.js
 */
const fs = require('fs');
const path = require('path');

const DATA_FILE = path.join(__dirname, 'films.json');
const OUT_DIR = path.join(__dirname, 'images', 'films');
const CONCURRENCY = 6;

async function downloadOne(item) {
  if (!item.sourceUrl) {
    console.log(`[skip] ${item.sku} (${item.name}) - no photo on source site`);
    return;
  }
  const dest = path.join(__dirname, item.localImage);
  if (fs.existsSync(dest)) {
    console.log(`[exists] ${item.localImage}`);
    return;
  }
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const res = await fetch(item.sourceUrl);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const buf = Buffer.from(await res.arrayBuffer());
      fs.writeFileSync(dest, buf);
      console.log(`[ok] ${item.localImage} (${(buf.length / 1024).toFixed(0)} KB)`);
      return;
    } catch (err) {
      console.warn(`[retry ${attempt}] ${item.sku}: ${err.message}`);
      if (attempt === 3) console.error(`[FAIL] ${item.sku} ${item.sourceUrl}`);
      await new Promise((r) => setTimeout(r, 500 * attempt));
    }
  }
}

async function run() {
  if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true });
  const items = JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8'));

  let idx = 0;
  async function worker() {
    while (idx < items.length) {
      const item = items[idx++];
      await downloadOne(item);
    }
  }

  const workers = Array.from({ length: CONCURRENCY }, worker);
  await Promise.all(workers);
  console.log(`\nDone. ${items.length} items processed. Images saved to ${OUT_DIR}`);
}

run();
