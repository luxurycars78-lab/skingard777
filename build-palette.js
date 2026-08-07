/**
 * build-palette.js
 *
 * Renders the PALETA BOJA filter chips + swatch cards on folija-u-boji.html
 * straight from films.json, replacing whatever sits between the
 * `palette-chips:` / `palette-cards:` markers in the HTML.
 *
 * The cards are baked into the HTML rather than fetched at runtime because
 * initColorPaletteFilter() in js/main.js queries [data-palette-item] once on
 * DOMContentLoaded — anything injected after that point is invisible to the
 * filter (and to crawlers).
 *
 * Usage:
 *   node build-palette.js
 */
const fs = require('fs');
const path = require('path');

const DATA_FILE = path.join(__dirname, 'films.json');
const HTML_FILE = path.join(__dirname, 'folija-u-boji.html');

/** films.json category -> Serbian label used both as chip text and filter value. */
const CATEGORY_LABELS = {
  'Glossy': 'Standardne boje',
  'Glossy Metal': 'Metalik sjaj',
  'Matt Metal': 'Mat metalik',
  'Matte Metal': 'Mat metalik',
  'Matte': 'Mat',
  'Satin': 'Satin',
  'Chrome': 'Hrom',
  'Special Design': 'Posebni/efekt dizajn',
  'Special Effect': 'Posebni/efekt dizajn'
};

const escapeHtml = (str) => String(str)
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;');

function renderCard(item, label) {
  const name = escapeHtml(item.name);
  const cat = escapeHtml(label);
  const visual = item.localImage
    ? [
        `  <div class="video-frame">`,
        `    <img class="video-el" src="${escapeHtml(item.localImage)}" alt="${name}" loading="lazy" decoding="async">`,
        `  </div>`
      ]
    : [`  <div class="img-placeholder">SWATCH<span>${name}</span></div>`];

  return [
    `<div class="video-card" data-palette-item="${cat}">`,
    ...visual,
    `  <p class="video-caption">${name} · ${cat}</p>`,
    `</div>`
  ];
}

function replaceBlock(html, marker, body) {
  const start = `<!-- ${marker}:start -->`;
  const end = `<!-- ${marker}:end -->`;
  const startIdx = html.indexOf(start);
  const endIdx = html.indexOf(end);
  if (startIdx === -1 || endIdx === -1) {
    throw new Error(`Marker ${marker} not found in ${path.basename(HTML_FILE)}`);
  }
  return html.slice(0, startIdx + start.length) + body + html.slice(endIdx);
}

function run() {
  const all = JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8'));

  // Only render swatches that have a downloaded photo — no dashed placeholders.
  const items = all.filter((i) => i.localImage);
  const dropped = all.length - items.length;

  const unknown = items.filter((i) => !CATEGORY_LABELS[i.category]);
  if (unknown.length) {
    throw new Error(`Unmapped categories: ${[...new Set(unknown.map((i) => i.category))].join(', ')}`);
  }

  const counts = new Map();
  Object.values(CATEGORY_LABELS).forEach((label) => counts.set(label, 0));
  items.forEach((i) => {
    const label = CATEGORY_LABELS[i.category];
    counts.set(label, counts.get(label) + 1);
  });

  const pad = '        ';
  const chipLines = [];
  let first = true;
  counts.forEach((count, label) => {
    if (count === 0) return;
    chipLines.push(
      `<button type="button" class="chip${first ? ' is-active' : ''}" data-palette-filter="${escapeHtml(label)}">${escapeHtml(label)} (${count})</button>`
    );
    first = false;
  });

  const cardLines = [];
  const brokenPaths = [];
  items.forEach((item) => {
    if (item.localImage && !fs.existsSync(path.join(__dirname, item.localImage))) {
      brokenPaths.push(`${item.sku} -> ${item.localImage}`);
    }
    renderCard(item, CATEGORY_LABELS[item.category]).forEach((line) => cardLines.push(line));
  });
  if (brokenPaths.length) {
    console.warn(`Warning: ${brokenPaths.length} image(s) not on disk, run \`node download-films.js\`:`);
    brokenPaths.forEach((p) => console.warn(`  ${p}`));
  }

  const indent = (lines) => '\n' + lines.map((l) => pad + l).join('\n') + '\n' + pad;

  let html = fs.readFileSync(HTML_FILE, 'utf-8');
  html = replaceBlock(html, 'palette-chips', indent(chipLines));
  html = replaceBlock(html, 'palette-cards', indent(cardLines));
  fs.writeFileSync(HTML_FILE, html);

  const missing = items.filter((i) => !i.localImage).length;
  console.log(
    `Palette rendered: ${items.length} swatches ` +
    `(${missing} without photo -> placeholder, ${dropped} unnamed entr${dropped === 1 ? 'y' : 'ies'} skipped).`
  );
  counts.forEach((count, label) => console.log(`  ${label}: ${count}`));
}

run();
