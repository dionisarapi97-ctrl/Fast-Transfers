import { fixedFares } from "../data/fares";

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

  if (!pickupIsAirport && !dropoffIsAirport) return null;

  const cityAddress = pickupIsAirport ? dropoffAddress : pickupAddress;
  const cityText = cityAddress.toLowerCase();

  return fixedFares.find((fare) =>
    fare.keywords.some((keyword) => cityText.includes(keyword.toLowerCase()))
  );
}

export function calculatePrice(distanceKm, pickupAddress = "", dropoffAddress = "", passengers = 1) {
  if (passengers >= 5 && passengers <= 8) {
    const vanPrice = distanceKm * 1.8;
    return Math.max(30, Math.round(vanPrice));
  }

  const fixedFare = findFixedFare(pickupAddress, dropoffAddress);

  if (fixedFare) {
    return fixedFare.price;
  }

  const basePrice = 0;
  const pricePerKm = 1.0;

  // Use 1 euro per km with a minimum price of 20 € for standard cars
  return Math.max(20, Math.round(basePrice + distanceKm * pricePerKm));
}