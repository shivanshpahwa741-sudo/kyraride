export interface PlaceDetails {
  address: string;
  placeId: string;
  lat: number;
  lng: number;
}

export interface DistanceResult {
  distanceKm: number;
  durationMinutes: number;
}

export type WeekDay = "monday" | "tuesday" | "wednesday" | "thursday" | "friday" | "saturday" | "sunday";

export interface FareConfig {
  baseFare: number;
  perKmRate: number;
  minimumFare: number;
}

export interface FareDetails {
  distanceKm: number;
  isSurgePricing: boolean;
  perRideFare: number;
  numberOfDays: number;
  totalWeeklyFare: number;
  breakdown: {
    baseFare: number;
    distanceFare: number;
    surgeMultiplier: number;
  };
}

export interface BookingData {
  name: string;
  phone: string;
  pickupAddress: string;
  pickupPlaceId: string;
  pickupLat: number;
  pickupLng: number;
  dropAddress: string;
  dropPlaceId: string;
  dropLat: number;
  dropLng: number;
  pickupTime: string;
  selectedDays: WeekDay[];
}
