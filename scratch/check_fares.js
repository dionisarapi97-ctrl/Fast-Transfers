const fs = require('fs');

const faresContent = fs.readFileSync('./src/data/fares.js', 'utf8');
const arrayMatch = faresContent.match(/export const fixedFares = (\[[\s\S]+?\]);/);
if (!arrayMatch) {
  console.log("Failed to parse fares file content.");
  process.exit(1);
}

const fixedFares = eval(arrayMatch[1]);
const uniqueFrom = [...new Set(fixedFares.map(f => f.from))];
console.log("Unique from values in fixedFares:", uniqueFrom);

// Find any fare where "from" is NOT "TIA"
const nonTiaFares = fixedFares.filter(f => f.from !== "TIA");
console.log("Non-TIA fares count:", nonTiaFares.length);
if (nonTiaFares.length > 0) {
  console.log("Non-TIA fares sample:", nonTiaFares.slice(0, 3));
}
