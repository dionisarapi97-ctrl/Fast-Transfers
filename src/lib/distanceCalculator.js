import { loadGoogleMaps } from "./googleMapsLoader";

export async function calculateDistance(origin, destination) {
  if (!origin || !destination) return null;

  await loadGoogleMaps();

  const service = new google.maps.DirectionsService();

  const result = await service.route({
    origin,
    destination,
    travelMode: google.maps.TravelMode.DRIVING,
  });

  const leg = result.routes[0].legs[0];

  return {
    distanceKm: leg.distance.value / 1000,
    distanceText: leg.distance.text,
    durationText: leg.duration.text,
  };
}