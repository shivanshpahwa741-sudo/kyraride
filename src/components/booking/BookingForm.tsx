import { useState, useEffect, useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { User, Phone, Clock, Loader2 } from "lucide-react";
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

import { bookingSchema, type BookingSchemaType } from "@/schemas/booking-schema";
import { calculateFare } from "@/lib/fare-calculator";
import { calculateDistance } from "@/lib/google-maps";
import type { PlaceDetails, WeekDay, FareDetails } from "@/types/booking";

export function BookingForm() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCalculatingDistance, setIsCalculatingDistance] = useState(false);
  const [distanceKm, setDistanceKm] = useState<number | null>(null);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const form = useForm<BookingSchemaType>({
    resolver: zodResolver(bookingSchema),
    defaultValues: {
      name: "",
      phone: "",
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

  const {
    watch,
    setValue,
    handleSubmit,
    formState: { errors },
  } = form;

  // Watch form values for fare calculation
  const pickupLat = watch("pickupLat");
  const pickupLng = watch("pickupLng");
  const dropLat = watch("dropLat");
  const dropLng = watch("dropLng");
  const pickupTime = watch("pickupTime");
  const selectedDays = watch("selectedDays");

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

  // Form submission - Opens WhatsApp with booking details
  const onSubmit = async (data: BookingSchemaType) => {
    if (!fareDetails || !distanceKm) {
      toast.error("Please complete all fields to calculate fare");
      return;
    }

    setIsSubmitting(true);

    try {
      // Format the booking message for WhatsApp
      const dayLabels = data.selectedDays.map(d => d.charAt(0).toUpperCase() + d.slice(1)).join(", ");
      const message = `🚗 *KYRA Ride Subscription Request*

*Customer Details:*
• Name: ${data.name}
• Phone: ${data.phone}

*Ride Details:*
• Pickup: ${data.pickupAddress}
• Drop: ${data.dropAddress}
• Distance: ${distanceKm.toFixed(1)} km
• Pickup Time: ${data.pickupTime}

*Schedule:*
• Days: ${dayLabels}

*Fare Estimate:*
• Per Ride: ₹${fareDetails.perRideFare}
• Weekly Total: ₹${fareDetails.totalWeeklyFare}
${fareDetails.isSurgePricing ? "• (Peak hours pricing applied)" : ""}`;

      // Encode the message for WhatsApp URL
      const encodedMessage = encodeURIComponent(message);
      const whatsappUrl = `https://wa.me/message/PWIMWJHRYGQRL1?text=${encodedMessage}`;

      // Open WhatsApp
      window.open(whatsappUrl, "_blank", "noopener,noreferrer");

      setIsSubmitted(true);
      toast.success("Opening WhatsApp to complete your booking!");
    } catch (error) {
      console.error("Booking error:", error);
      toast.error("Failed to process booking. Please try again.");
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
        {/* Personal Information */}
        <div className="space-y-4">
          <h3 className="font-display text-lg font-semibold text-foreground">
            Personal Information
          </h3>

          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Full Name</FormLabel>
                <FormControl>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                    <Input
                      {...field}
                      placeholder="Enter your full name"
                      className="pl-10 bg-input border-border/50 text-foreground placeholder:text-muted-foreground focus:border-accent"
                    />
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="phone"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Phone Number</FormLabel>
                <FormControl>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                    <Input
                      {...field}
                      type="tel"
                      placeholder="10-digit mobile number"
                      className="pl-10 bg-input border-border/50 text-foreground placeholder:text-muted-foreground focus:border-accent"
                    />
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
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
                <FormLabel>Pickup Location</FormLabel>
                <FormControl>
                  <PlacesAutocomplete
                    placeholder="Enter pickup address"
                    value={field.value}
                    onPlaceSelect={handlePickupSelect}
                    onInputChange={(value) => setValue("pickupAddress", value)}
                  />
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
                <FormMessage />
              </FormItem>
            )}
          />
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
          disabled={isSubmitting || !fareDetails}
          className="w-full kyra-btn-primary text-lg py-6"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              Submitting...
            </>
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
