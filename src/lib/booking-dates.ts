/**
 * Booking date utilities for KYRA subscription service
 * 
 * Rules:
 * - Bookings close Saturday at 1:00 PM IST for the upcoming Monday
 * - After cutoff, subscription starts the following Monday (8+ days away)
 */

import { startOfWeek, addDays, format, isAfter, setHours, setMinutes, nextMonday } from "date-fns";

// Cutoff: Saturday at 13:00 (1:00 PM)
const CUTOFF_DAY = 6; // Saturday (0 = Sunday, 6 = Saturday)
const CUTOFF_HOUR = 13; // 1:00 PM

/**
 * Calculate the subscription start date based on current time
 * @returns The next available Monday for subscription start
 */
export function getSubscriptionStartDate(): Date {
  const now = new Date();
  const currentDay = now.getDay();
  const currentHour = now.getHours();
  const currentMinute = now.getMinutes();
  
  // Get the upcoming Monday (if today is Monday, get next Monday)
  let upcomingMonday = nextMonday(now);
  
  // Check if we're past the Saturday 1:00 PM cutoff
  const isPastCutoff = checkIfPastCutoff(currentDay, currentHour, currentMinute);
  
  if (isPastCutoff) {
    // If past cutoff, subscription starts the Monday after next
    upcomingMonday = addDays(upcomingMonday, 7);
  }
  
  return upcomingMonday;
}

/**
 * Check if current time is past the Saturday 1:00 PM cutoff
 */
function checkIfPastCutoff(day: number, hour: number, minute: number): boolean {
  // Sunday (0) - always past cutoff
  if (day === 0) return true;
  
  // Saturday (6) - check if past 1:00 PM
  if (day === CUTOFF_DAY) {
    return hour > CUTOFF_HOUR || (hour === CUTOFF_HOUR && minute > 0);
  }
  
  // Monday-Friday - not past cutoff
  return false;
}

/**
 * Get formatted subscription start date
 */
export function getFormattedStartDate(): string {
  const startDate = getSubscriptionStartDate();
  return format(startDate, "EEEE, MMMM do, yyyy");
}

/**
 * Check if booking is for immediate week or next week
 */
export function isNextWeekBooking(): boolean {
  const now = new Date();
  const currentDay = now.getDay();
  const currentHour = now.getHours();
  const currentMinute = now.getMinutes();
  
  return checkIfPastCutoff(currentDay, currentHour, currentMinute);
}

/**
 * Get time remaining until cutoff (for display purposes)
 */
export function getTimeUntilCutoff(): { days: number; hours: number; minutes: number } | null {
  const now = new Date();
  const currentDay = now.getDay();
  
  // If past cutoff, return null
  if (isNextWeekBooking()) return null;
  
  // Calculate time until Saturday 1:00 PM
  const daysUntilSaturday = (CUTOFF_DAY - currentDay + 7) % 7 || 7;
  const cutoffDate = addDays(now, daysUntilSaturday);
  cutoffDate.setHours(CUTOFF_HOUR, 0, 0, 0);
  
  // If it's Saturday but before cutoff
  if (currentDay === CUTOFF_DAY) {
    cutoffDate.setDate(now.getDate());
  }
  
  const diffMs = cutoffDate.getTime() - now.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  const diffHours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
  
  return { days: diffDays, hours: diffHours, minutes: diffMinutes };
}
