const fs = require('fs');

const faresContent = fs.readFileSync('./src/data/fares.js', 'utf8');
// Simple extraction of fixedFares from the ES Module file
const arrayMatch = faresContent.match(/export const fixedFares = (\[[\s\S]+?\]);/);
if (!arrayMatch) {
  console.log("Failed to parse fares file content.");
  process.exit(1);
}

const fixedFares = eval(arrayMatch[1]);

function isAirport(address = "") {
  const text = address.toLowerCase();

  return (
    text.includes("tirana international airport") ||
    text.includes("nënë tereza") ||
    text.includes("nene tereza") ||
    text.includes("tia") ||
    text.includes("rinas")
  );
}

function findFixedFare(pickupAddress = "", dropoffAddress = "") {
  const pickupIsAirport = isAirport(pickupAddress);
  const dropoffIsAirport = isAirport(dropoffAddress);

  console.log("pickupAddress:", JSON.stringify(pickupAddress));
  console.log("dropoffAddress:", JSON.stringify(dropoffAddress));
  console.log("pickupIsAirport:", pickupIsAirport);
  console.log("dropoffIsAirport:", dropoffIsAirport);

  if (!pickupIsAirport && !dropoffIsAirport) return null;

  const cityAddress = pickupIsAirport ? dropoffAddress : pickupAddress;
  const cityText = cityAddress.toLowerCase();
  console.log("cityText to search in keywords:", JSON.stringify(cityText));

  return fixedFares.find((fare) =>
    fare.keywords.some((keyword) => {
      const match = cityText.includes(keyword.toLowerCase());
      if (match) {
        console.log(`Matched keyword "${keyword}" in cityText!`);
      }
      return match;
    })
  );
}

const pickup = "Rruga 5 Maji, Tiranë, Albania";
const dropoff = "Sarandë, Albania";
const fare = findFixedFare(pickup, dropoff);
console.log("Matched Fixed Fare:", fare);
