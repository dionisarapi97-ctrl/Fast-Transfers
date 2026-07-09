import { Loader } from "@googlemaps/js-api-loader";

let googleMapsPromise = null;

export function loadGoogleMaps() {
  if (!googleMapsPromise) {
    const loader = new Loader({
      apiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY,
      version: "weekly",
      libraries: ["places"],
    });

    googleMapsPromise = loader.load();
  }

  return googleMapsPromise;
}