const fs = require('fs');

const filePath = "C:\\Users\\HP\\.gemini\\antigravity-ide\\brain\\5ac5c376-c49e-4dc7-a38a-733f05b0d219\\.system_generated\\steps\\1320\\content.md";
const content = fs.readFileSync(filePath, 'utf8');

const hasAlbanian = content.indexOf('Destinacionet më Popullore');
const hasEnglish = content.indexOf('Popular Destinations');

console.log("Albanian check:", hasAlbanian !== -1 ? "FOUND" : "NOT FOUND");
console.log("English check:", hasEnglish !== -1 ? "FOUND" : "NOT FOUND");

if (hasEnglish !== -1) {
  console.log(content.substring(hasEnglish - 100, hasEnglish + 200));
} else if (hasAlbanian !== -1) {
  console.log(content.substring(hasAlbanian - 100, hasAlbanian + 200));
}
