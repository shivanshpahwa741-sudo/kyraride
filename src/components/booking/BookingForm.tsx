import { useState, useEffect, useMemo, useCallback } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Clock, Loader2, MapPinned, Calendar, AlertCircle } from "lucide-react";
import { toast } from "sonner";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

import { PlacesAutocomplete } from "./PlacesAutocomplete";
import { DaySelector } from "./DaySelector";
import { FareBreakdown } from "./FareBreakdown";
import { RouteMap } from "./RouteMap";

import { bookingSchema, type BookingSchemaType } from "@/schemas/booking-schema";
import { calculateFare } from "@/lib/fare-calculator";
import { calculateDistance, getCurrentLocation, reverseGeocode } from "@/lib/google-maps";
import type { PlaceDetails, WeekDay, FareDetails } from "@/types/booking";
import { useAuth } from "@/hooks/useAuth";
import { getFormattedStartDate, isNextWeekBooking, getTimeUntilCutoff } from "@/lib/booking-dates";

const WHATSAPP_LINK = "https://wa.me/message/PWIMWJHRYGQRL1";
const MIN_DAYS_REQUIRED = 2;

export function BookingForm() {
  const { user } = useAuth();
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCalculatingDistance, setIsCalculatingDistance] = useState(false);
  const [distanceKm, setDistanceKm] = useState<number | null>(null);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isDetectingLocation, setIsDetectingLocation] = useState(false);
  const [locationDetected, setLocationDetected] = useState(false);

  const form = useForm<BookingSchemaType>({
    resolver: zodResolver(bookingSchema),
    defaultValues: {
      name: user?.name || "",
      phone: user?.phone || "",
      pickupAddress: "",
      pickupPlaceId: "",
      pickupLat: 0,
      pickupLng: 0,
      dropAddress: "",
      dropPlaceId: "",
      dropLat: 0,
      dropLng: 0,
      pickupTime: "",
      selectedDays: [],
    },
  });

  // Update form when user changes
  useEffect(() => {
    if (user) {
      form.setValue("name", user.name);
      form.setValue("phone", user.phone);
    }
  }, [user, form]);

  const {
    watch,
    setValue,
    handleSubmit,
  } = form;

  // Watch form values for fare calculation
  const pickupLat = watch("pickupLat");
  const pickupLng = watch("pickupLng");
  const dropLat = watch("dropLat");
  const dropLng = watch("dropLng");
  const pickupTime = watch("pickupTime");
  const selectedDays = watch("selectedDays");
  const pickupAddress = watch("pickupAddress");
  const dropAddress = watch("dropAddress");

  // Check if both locations are set for showing the map
  const showRouteMap = pickupLat && pickupLng && dropLat && dropLng && pickupAddress && dropAddress;

  // Booking date calculations
  const subscriptionStartDate = useMemo(() => getFormattedStartDate(), []);
  const isNextWeek = useMemo(() => isNextWeekBooking(), []);
  const timeUntilCutoff = useMemo(() => getTimeUntilCutoff(), []);

  // Minimum days validation
  const hasMinimumDays = selectedDays.length >= MIN_DAYS_REQUIRED;
  const showMinDaysError = selectedDays.length > 0 && selectedDays.length < MIN_DAYS_REQUIRED;

  // Auto-detect user's location for pickup
  const detectCurrentLocation = useCallback(async () => {
    setIsDetectingLocation(true);

    try {
      const coords = await getCurrentLocation();

      if (!coords) {
        toast.error("Could not detect your location. Please enter it manually.");
        setIsDetectingLocation(false);
        return;
      }

      // Wait for Google Maps to load if not already
      let attempts = 0;
      while (!window.google?.maps && attempts < 50) {
        await new Promise(resolve => setTimeout(resolve, 100));
        attempts++;
      }

      if (!window.google?.maps) {
        toast.error("Maps not loaded yet. Please enter location manually.");
        setIsDetectingLocation(false);
        return;
      }

      const placeDetails = await reverseGeocode(coords.lat, coords.lng);

      if (placeDetails) {
        setValue("pickupAddress", placeDetails.address);
        setValue("pickupPlaceId", placeDetails.placeId);
        setValue("pickupLat", placeDetails.lat);
        setValue("pickupLng", placeDetails.lng);
        setLocationDetected(true);
        toast.success("Pickup location detected!");
      } else {
        toast.error("Could not get address. Please enter it manually.");
      }
    } catch (error) {
      console.error("Location detection error:", error);
      toast.error("Location detection failed. Please enter manually.");
    } finally {
      setIsDetectingLocation(false);
    }
  }, [setValue]);

  // Request location on component mount
  useEffect(() => {
    // Small delay to ensure Google Maps script has loaded
    const timer = setTimeout(() => {
      detectCurrentLocation();
    }, 1000);

    return () => clearTimeout(timer);
  }, [detectCurrentLocation]);

  // Calculate distance when both locations are set
  useEffect(() => {
    const calculateDistanceAsync = async () => {
      if (pickupLat && pickupLng && dropLat && dropLng) {
        setIsCalculatingDistance(true);
        const result = await calculateDistance(
          { lat: pickupLat, lng: pickupLng },
          { lat: dropLat, lng: dropLng }
        );
        setDistanceKm(result?.distanceKm ?? null);
        setIsCalculatingDistance(false);
      }
    };

    calculateDistanceAsync();
  }, [pickupLat, pickupLng, dropLat, dropLng]);

  // Calculate fare details
  const fareDetails: FareDetails | null = useMemo(() => {
    if (distanceKm && pickupTime && selectedDays?.length > 0) {
      return calculateFare(distanceKm, pickupTime, selectedDays as WeekDay[]);
    }
    return null;
  }, [distanceKm, pickupTime, selectedDays]);

  // Handle pickup location selection
  const handlePickupSelect = (place: PlaceDetails) => {
    setValue("pickupAddress", place.address);
    setValue("pickupPlaceId", place.placeId);
    setValue("pickupLat", place.lat);
    setValue("pickupLng", place.lng);
  };

  // Handle drop location selection
  const handleDropSelect = (place: PlaceDetails) => {
    setValue("dropAddress", place.address);
    setValue("dropPlaceId", place.placeId);
    setValue("dropLat", place.lat);
    setValue("dropLng", place.lng);
  };

  // Build WhatsApp message with booking details
  const buildWhatsAppMessage = (data: BookingSchemaType): string => {
    const dayNames = data.selectedDays.map(d => d.charAt(0).toUpperCase() + d.slice(1)).join(", ");
    const message = `🚗 *KYRA Ride Subscription Request*

📋 *Customer Details:*
Name: ${data.name}
Phone: ${data.phone}

📍 *Route:*
Pickup: ${data.pickupAddress}
Drop: ${data.dropAddress}
Distance: ${distanceKm?.toFixed(1)} km

⏰ *Schedule:*
Start Date: ${subscriptionStartDate}
Pickup Time: ${data.pickupTime}
Days: ${dayNames}

💰 *Fare Estimate:*
Per Ride: ₹${fareDetails?.perRideFare}
Weekly Total: ₹${fareDetails?.totalWeeklyFare}
${fareDetails?.isSurgePricing ? "(Surge pricing applied)" : ""}`;

    return encodeURIComponent(message);
  };

  // Form submission - opens WhatsApp with booking details
  const onSubmit = (data: BookingSchemaType) => {
    if (!fareDetails || !distanceKm) {
      toast.error("Please complete all fields to calculate fare");
      return;
    }

    setIsSubmitting(true);

    try {
      const message = buildWhatsAppMessage(data);
      const whatsappUrl = `${WHATSAPP_LINK}&text=${message}`;

      // Open WhatsApp in new tab
      window.open(whatsappUrl, "_blank", "noopener,noreferrer");

      setIsSubmitted(true);
      toast.success("Redirecting to WhatsApp...");
    } catch (error) {
      console.error("Booking error:", error);
      toast.error("Failed to open WhatsApp. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Success state
  if (isSubmitted) {
    return (
      <div className="text-center py-12 space-y-4">
        <div className="w-16 h-16 mx-auto bg-accent/20 rounded-full flex items-center justify-center">
          <svg
            className="w-8 h-8 text-accent"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M5 13l4 4L19 7"
            />
          </svg>
        </div>
        <h3 className="font-display text-2xl font-bold text-foreground">
          Booking Submitted!
        </h3>
        <p className="text-muted-foreground max-w-md mx-auto">
          Thank you for subscribing to KYRA. Our team will contact you shortly to confirm your ride schedule.
        </p>
        <Button
          onClick={() => {
            setIsSubmitted(false);
            form.reset();
            setDistanceKm(null);
          }}
          variant="outline"
          className="mt-4"
        >
          Book Another Ride
        </Button>
      </div>
    );
  }

  return (
    <Form {...form}>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
        {/* User Info Display (Read-only - from auth) */}
        <div className="p-4 rounded-lg bg-card/50 border border-border/30">
          <h3 className="font-display text-sm font-medium text-muted-foreground mb-2">
            Booking for
          </h3>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-foreground font-semibold">{user?.name}</p>
              <p className="text-sm text-muted-foreground">+91 {user?.phone}</p>
            </div>
            <div className="text-xs text-accent">✓ Verified</div>
          </div>
        </div>

        {/* Location Selection */}
        <div className="space-y-4">
          <h3 className="font-display text-lg font-semibold text-foreground">
            Ride Details
          </h3>

          <FormField
            control={form.control}
            name="pickupAddress"
            render={({ field }) => (
              <FormItem>
                <div className="flex items-center justify-between">
                  <FormLabel>Pickup Location</FormLabel>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={detectCurrentLocation}
                    disabled={isDetectingLocation}
                    className="text-xs text-accent hover:text-accent/80 h-auto py-1 px-2"
                  >
                    {isDetectingLocation ? (
                      <>
                        <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                        Detecting...
                      </>
                    ) : (
                      <>
                        <MapPinned className="mr-1 h-3 w-3" />
                        Use Current Location
                      </>
                    )}
                  </Button>
                </div>
                <FormControl>
                  {isDetectingLocation && !pickupAddress ? (
                    <div className="flex items-center gap-3 h-10 px-3 rounded-md border border-border/50 bg-input">
                      <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">Detecting your location...</span>
                    </div>
                  ) : (
                    <PlacesAutocomplete
                      placeholder="Enter pickup address"
                      value={field.value}
                      onPlaceSelect={handlePickupSelect}
                      onInputChange={(value) => setValue("pickupAddress", value)}
                    />
                  )}
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="dropAddress"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Drop Location</FormLabel>
                <FormControl>
                  <PlacesAutocomplete
                    placeholder="Enter drop address"
                    value={field.value}
                    onPlaceSelect={handleDropSelect}
                    onInputChange={(value) => setValue("dropAddress", value)}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Route Map Preview */}
          {showRouteMap && (
            <div className="pt-2">
              <h4 className="text-sm font-medium text-foreground mb-3">Route Preview</h4>
              <RouteMap
                pickupLat={pickupLat}
                pickupLng={pickupLng}
                dropLat={dropLat}
                dropLng={dropLng}
                pickupAddress={pickupAddress}
                dropAddress={dropAddress}
              />
            </div>
          )}

          <FormField
            control={form.control}
            name="pickupTime"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Pickup Time (IST)</FormLabel>
                <FormControl>
                  <div className="relative">
                    <Clock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                    <Input
                      {...field}
                      type="time"
                      className="pl-10 bg-input border-border/50 text-foreground focus:border-accent"
                    />
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Day Selection */}
        <div className="space-y-4">
          <h3 className="font-display text-lg font-semibold text-foreground">
            Schedule
          </h3>

          <FormField
            control={form.control}
            name="selectedDays"
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <DaySelector
                    selectedDays={field.value as WeekDay[]}
                    onDaysChange={(days) => setValue("selectedDays", days)}
                  />
                </FormControl>
                {showMinDaysError && (
                  <p className="text-sm text-destructive flex items-center gap-1.5 mt-2">
                    <AlertCircle className="h-4 w-4" />
                    Please select at least 2 days to continue.
                  </p>
                )}
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Subscription Start Date Info */}
        <div className="p-4 rounded-lg bg-accent/5 border border-accent/20">
          <div className="flex items-start gap-3">
            <Calendar className="h-5 w-5 text-accent mt-0.5 shrink-0" />
            <div className="space-y-1">
              <p className="text-sm font-medium text-foreground">
                Subscription Start Date
              </p>
              <p className="text-lg font-semibold text-accent">
                {subscriptionStartDate}
              </p>
              {isNextWeek && (
                <p className="text-xs text-muted-foreground">
                  Booking window for this week has closed (Saturday 1:00 PM cutoff)
                </p>
              )}
              {timeUntilCutoff && !isNextWeek && (
                <p className="text-xs text-muted-foreground">
                  Book by Saturday 1:00 PM for this start date
                </p>
              )}
              <p className="text-xs text-muted-foreground mt-2 pt-2 border-t border-border/30">
                ℹ️ Minimum 2 days per week required for subscription
              </p>
            </div>
          </div>
        </div>

        {/* Fare Breakdown */}
        <div className="space-y-4">
          <h3 className="font-display text-lg font-semibold text-foreground">
            Fare Estimate
          </h3>
          <FareBreakdown
            fareDetails={fareDetails}
            isCalculating={isCalculatingDistance}
          />
        </div>

        {/* Submit Button */}
        <Button
          type="submit"
          disabled={isSubmitting || !fareDetails || !hasMinimumDays}
          className={`w-full kyra-btn-primary text-lg py-6 transition-all duration-300 ${
            !hasMinimumDays ? "opacity-50 cursor-not-allowed" : ""
          }`}
        >
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              Submitting...
            </>
          ) : !hasMinimumDays ? (
            "Select at least 2 days"
          ) : (
            "Confirm Subscription"
          )}
        </Button>

        <p className="text-xs text-center text-muted-foreground">
          By subscribing, you agree to our terms and conditions. Our team will contact you to confirm your booking.
        </p>
      </form>
    </Form>
  );
}
