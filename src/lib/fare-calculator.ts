import type { FareConfig, FareDetails, WeekDay } from "@/types/booking";

// Normal pricing
const NORMAL_CONFIG: FareConfig = {
  baseFare: 50,
  perKmRate: 22.5,
  minimumFare: 50,
};

// Surge pricing (10pm - 7am)
const SURGE_CONFIG: FareConfig = {
  baseFare: 75,
  perKmRate: 33.75,
  minimumFare: 75,
};

const SURGE_MULTIPLIER = 1.5;

/**
 * Check if the given time falls within surge hours (10pm - 7am IST)
 */
export function isSurgeTime(timeString: string): boolean {
  const [hours] = timeString.split(":").map(Number);
  // Surge: 22:00 - 06:59 (10pm to 6:59am)
  return hours >= 22 || hours < 7;
}

/**
 * Calculate the per-ride fare based on distance and time
 */
export function calculatePerRideFare(
  distanceKm: number,
  timeString: string
): { fare: number; isSurge: boolean; config: FareConfig } {
  const isSurge = isSurgeTime(timeString);
  const config = isSurge ? SURGE_CONFIG : NORMAL_CONFIG;

  const distanceBasedFare = distanceKm * config.perKmRate;
  const fare = Math.max(distanceBasedFare, config.minimumFare);

  return {
    fare: Math.round(fare),
    isSurge,
    config,
  };
}

/**
 * Calculate complete fare details
 */
export function calculateFare(
  distanceKm: number,
  timeString: string,
  selectedDays: WeekDay[]
): FareDetails {
  const { fare, isSurge, config } = calculatePerRideFare(distanceKm, timeString);
  const numberOfDays = selectedDays.length;

  return {
    distanceKm,
    isSurgePricing: isSurge,
    perRideFare: fare,
    numberOfDays,
    totalWeeklyFare: fare * numberOfDays,
    breakdown: {
      baseFare: config.baseFare,
      distanceFare: distanceKm * config.perKmRate,
      surgeMultiplier: isSurge ? SURGE_MULTIPLIER : 1,
    },
  };
}

/**
 * Format currency in INR
 */
export function formatCurrency(amount: number): string {
  return `₹${amount.toLocaleString("en-IN")}`;
}
