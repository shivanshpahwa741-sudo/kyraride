import type { PlaceDetails, DistanceResult } from "@/types/booking";

/**
 * Calculate distance between two points using Google Distance Matrix API
 */
export async function calculateDistance(
  origin: { lat: number; lng: number },
  destination: { lat: number; lng: number }
): Promise<DistanceResult | null> {
  return new Promise((resolve) => {
    if (!window.google?.maps) {
      console.error("Google Maps not loaded");
      resolve(null);
      return;
    }

    const service = new google.maps.DistanceMatrixService();

    service.getDistanceMatrix(
      {
        origins: [new google.maps.LatLng(origin.lat, origin.lng)],
        destinations: [new google.maps.LatLng(destination.lat, destination.lng)],
        travelMode: google.maps.TravelMode.DRIVING,
        unitSystem: google.maps.UnitSystem.METRIC,
      },
      (response, status) => {
        if (status === "OK" && response?.rows[0]?.elements[0]?.status === "OK") {
          const element = response.rows[0].elements[0];
          resolve({
            distanceKm: element.distance.value / 1000,
            durationMinutes: Math.ceil(element.duration.value / 60),
          });
        } else {
          console.error("Distance Matrix error:", status);
          resolve(null);
        }
      }
    );
  });
}

/**
 * Extract place details from Google Places Autocomplete result
 */
export function extractPlaceDetails(
  place: google.maps.places.PlaceResult
): PlaceDetails | null {
  if (!place.geometry?.location || !place.place_id) {
    return null;
  }

  return {
    address: place.formatted_address || place.name || "",
    placeId: place.place_id,
    lat: place.geometry.location.lat(),
    lng: place.geometry.location.lng(),
  };
}
