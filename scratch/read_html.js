const fs = require('fs');
const path = require('path');

const filePath = "C:\\Users\\HP\\.gemini\\antigravity-ide\\brain\\5ac5c376-c49e-4dc7-a38a-733f05b0d219\\.system_generated\\steps\\1159\\content.md";
const content = fs.readFileSync(filePath, 'utf8');

const index = content.indexOf('alt="Ksamil"');
if (index === -1) {
  console.log("Could not find 'alt=\"Ksamil\"' in the page content.");
  const idx2 = content.indexOf('Ksamil');
  if (idx2 === -1) {
    console.log("Could not find 'Ksamil' anywhere in the content.");
  } else {
    console.log("Found 'Ksamil' at index:", idx2);
    console.log(content.substring(idx2 - 200, idx2 + 200));
  }
} else {
  console.log("Found 'alt=\"Ksamil\"' at index:", index);
  console.log(content.substring(index - 300, index + 300));
}
