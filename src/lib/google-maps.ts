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

/**
 * Reverse geocode coordinates to get address details
 */
export async function reverseGeocode(
  lat: number,
  lng: number
): Promise<PlaceDetails | null> {
  return new Promise((resolve) => {
    if (!window.google?.maps) {
      console.error("Google Maps not loaded");
      resolve(null);
      return;
    }

    const geocoder = new google.maps.Geocoder();

    geocoder.geocode(
      { location: { lat, lng } },
      (results, status) => {
        if (status === "OK" && results && results[0]) {
          const result = results[0];
          resolve({
            address: result.formatted_address || "",
            placeId: result.place_id || "",
            lat,
            lng,
          });
        } else {
          console.error("Geocoding error:", status);
          resolve(null);
        }
      }
    );
  });
}

/**
 * Get user's current location using browser geolocation
 */
export function getCurrentLocation(): Promise<{ lat: number; lng: number } | null> {
  return new Promise((resolve) => {
    if (!navigator.geolocation) {
      console.error("Geolocation not supported");
      resolve(null);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
      },
      (error) => {
        console.error("Geolocation error:", error.message);
        resolve(null);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  });
}
