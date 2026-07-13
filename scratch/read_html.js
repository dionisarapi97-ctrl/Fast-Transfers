const fs = require('fs');

const filePath = "C:\\Users\\HP\\.gemini\\antigravity-ide\\brain\\5ac5c376-c49e-4dc7-a38a-733f05b0d219\\.system_generated\\steps\\1256\\content.md";
const content = fs.readFileSync(filePath, 'utf8');

const index = content.indexOf('AW-1831559779');
if (index === -1) {
  console.log("Could not find Google Tag AW-1831559779 in the live HTML.");
} else {
  console.log("SUCCESS: Found Google Tag AW-1831559779 in the live HTML!");
  console.log(content.substring(index - 100, index + 200));
}
