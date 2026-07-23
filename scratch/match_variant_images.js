const fs = require('fs');
const path = require('path');

const mockPath = path.join(__dirname, '../apps/web/lib/mock-data.ts');
let mock = fs.readFileSync(mockPath, 'utf8');

const imgDir = path.join(__dirname, '../apps/web/public/images/products');
const files = fs.readdirSync(imgDir);

console.log(`Scanning ${files.length} images for color variant matching...`);

// Map filenames to clean lowercase names
const fileMap = {};
files.forEach(f => {
  fileMap[f.toLowerCase()] = `/images/products/${f}`;
});

// Helper to find best matching image for a product slug & color
function findVariantImage(slug, color) {
  const cSlug = color.toLowerCase().replace(/[^a-z0-9]+/g, '-');
  const candidates = [
    `${slug}-${cSlug}.png`,
    `${slug}-${cSlug}-1.png`,
    `${slug}-${cSlug}-2.png`,
    `${cSlug}_${slug}.png`,
    `${cSlug}-${slug}.png`,
  ];
  for (const cand of candidates) {
    if (fileMap[cand]) return fileMap[cand];
  }
  return null;
}

// Check variants across products
const startIdx = mock.indexOf('const RAW_PRODUCTS = [');
const endIdx = mock.indexOf('\n// ─── Exported Derived Products', startIdx);
let rawBlock = mock.slice(startIdx, endIdx);

let matchesFound = 0;
files.forEach(f => {
  if (f.includes('-2') || f.includes('-1') || f.includes('_')) {
    console.log('Special image file:', f);
  }
});
