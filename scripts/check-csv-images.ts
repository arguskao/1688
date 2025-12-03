import { readFileSync } from 'fs';

// Read the CSV file
const content = readFileSync('wc.csv', 'utf-8');
const lines = content.split('\n');

// Parse a specific line to check the image field
// Let's check line 2 (first product: A01)
const line = lines[1];

// Count commas to find field 29
let inQuotes = false;
let currentField = '';
const fields = [];

for (let i = 0; i < line.length; i++) {
  const char = line[i];
  
  if (char === '"') {
    inQuotes = !inQuotes;
  } else if (char === ',' && !inQuotes) {
    fields.push(currentField);
    currentField = '';
  } else {
    currentField += char;
  }
}
fields.push(currentField);

console.log('總欄位數:', fields.length);
console.log('\n第 29 欄（圖片）內容:');
console.log(fields[28]); // 0-indexed, so 28 is the 29th field

console.log('\n\n檢查前幾個產品的圖片欄位:');
for (let i = 1; i <= 5 && i < lines.length; i++) {
  const line = lines[i];
  const fields = [];
  let inQuotes = false;
  let currentField = '';
  
  for (let j = 0; j < line.length; j++) {
    const char = line[j];
    
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      fields.push(currentField);
      currentField = '';
    } else {
      currentField += char;
    }
  }
  fields.push(currentField);
  
  console.log(`\n產品 ${i} (SKU: ${fields[2]}):`, fields[28] ? fields[28].substring(0, 100) : '(空)');
}
