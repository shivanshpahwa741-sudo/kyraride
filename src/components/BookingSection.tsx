import { useState, useCallback, useEffect } from "react";
import { motion } from "framer-motion";
import { MapPin, Clock, IndianRupee, AlertCircle, Car } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";

// Minimum hours in advance for booking
const MIN_HOURS_ADVANCE = 3;

// Base fare formula: (₹25 base + ₹12 per km) * 1.05
const BASE_FARE = 25;
const PER_KM_RATE = 12;
const TAX_MULTIPLIER = 1.05;

interface BookingData {
  pickupAddress: string;
  dropAddress: string;
  pickupTime: string;
  distance: number;
  fare: number;
  pickupLink: string;
  dropLink: string;
}

const BookingSection = () => {
  const { toast } = useToast();
  const [pickupAddress, setPickupAddress] = useState("");
  const [dropAddress, setDropAddress] = useState("");
  const [pickupTime, setPickupTime] = useState("");
  const [estimatedDistance, setEstimatedDistance] = useState<number | null>(null);
  const [estimatedFare, setEstimatedFare] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [bookingData, setBookingData] = useState<BookingData | null>(null);
  const [user, setUser] = useState<{ name: string; phone: string } | null>(null);
  const [showAuthDialog, setShowAuthDialog] = useState(false);
  const [authName, setAuthName] = useState("");
  const [authPhone, setAuthPhone] = useState("");
  const [authLoading, setAuthLoading] = useState(false);

  // Get minimum datetime (3 hours from now)
  const getMinDateTime = useCallback(() => {
    const now = new Date();
    now.setHours(now.getHours() + MIN_HOURS_ADVANCE);
    return now.toISOString().slice(0, 16);
  }, []);

  // Calculate fare based on distance
  const calculateFare = useCallback((distanceKm: number) => {
    return Math.round((BASE_FARE + PER_KM_RATE * distanceKm) * TAX_MULTIPLIER);
  }, []);

  // Simulate distance calculation (in a real app, use Google Distance Matrix API)
  const calculateDistance = useCallback(() => {
    if (pickupAddress && dropAddress) {
      // Simulated distance between 2-25 km for demo
      const randomDistance = Math.round((Math.random() * 23 + 2) * 10) / 10;
      setEstimatedDistance(randomDistance);
      setEstimatedFare(calculateFare(randomDistance));
    }
  }, [pickupAddress, dropAddress, calculateFare]);

  useEffect(() => {
    if (pickupAddress.length > 3 && dropAddress.length > 3) {
      calculateDistance();
    }
  }, [pickupAddress, dropAddress, calculateDistance]);

  // Validate pickup time
  const isValidPickupTime = useCallback(() => {
    if (!pickupTime) return false;
    const selectedTime = new Date(pickupTime);
    const minTime = new Date();
    minTime.setHours(minTime.getHours() + MIN_HOURS_ADVANCE);
    return selectedTime >= minTime;
  }, [pickupTime]);

  // Generate Google Maps URL
  const generateMapsUrl = (address: string) => {
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`;
  };

  // Handle booking submission
  const handleContinueBooking = async () => {
    if (!pickupAddress || !dropAddress || !pickupTime) {
      toast({
        title: "Missing Information",
        description: "Please fill in all fields to continue.",
        variant: "destructive",
      });
      return;
    }

    if (!isValidPickupTime()) {
      toast({
        title: "Invalid Pickup Time",
        description: `Please select a time at least ${MIN_HOURS_ADVANCE} hours from now.`,
        variant: "destructive",
      });
      return;
    }

    if (!user) {
      setShowAuthDialog(true);
      return;
    }

    setBookingData({
      pickupAddress,
      dropAddress,
      pickupTime,
      distance: estimatedDistance || 0,
      fare: estimatedFare || 0,
      pickupLink: generateMapsUrl(pickupAddress),
      dropLink: generateMapsUrl(dropAddress),
    });
    setShowConfirmation(true);
  };

  // Handle auth submission
  const handleAuth = async () => {
    if (!authName.trim() || !authPhone.trim()) {
      toast({
        title: "Missing Information",
        description: "Please enter your name and phone number.",
        variant: "destructive",
      });
      return;
    }

    // Basic phone validation
    const phoneRegex = /^[6-9]\d{9}$/;
    if (!phoneRegex.test(authPhone.replace(/\s/g, ""))) {
      toast({
        title: "Invalid Phone Number",
        description: "Please enter a valid 10-digit Indian phone number.",
        variant: "destructive",
      });
      return;
    }

    setAuthLoading(true);
    try {
      setUser({ name: authName, phone: authPhone });
      setShowAuthDialog(false);
      
      // Now proceed with booking
      setBookingData({
        pickupAddress,
        dropAddress,
        pickupTime,
        distance: estimatedDistance || 0,
        fare: estimatedFare || 0,
        pickupLink: generateMapsUrl(pickupAddress),
        dropLink: generateMapsUrl(dropAddress),
      });
      setShowConfirmation(true);
    } catch (error) {
      toast({
        title: "Error",
        description: "Something went wrong. Please try again.",
        variant: "destructive",
      });
    } finally {
      setAuthLoading(false);
    }
  };

  // Confirm and save booking
  const handleConfirmBooking = async () => {
    if (!bookingData || !user) return;

    setIsLoading(true);
    try {
      const { error } = await supabase.from("bookings").insert({
        user_name: user.name,
        phone: user.phone,
        pickup_address: bookingData.pickupAddress,
        pickup_link: bookingData.pickupLink,
        drop_address: bookingData.dropAddress,
        drop_link: bookingData.dropLink,
        distance_km: bookingData.distance,
        fare: bookingData.fare,
        pickup_time: bookingData.pickupTime,
      });

      if (error) throw error;

      toast({
        title: "Booking Confirmed! 🎉",
        description: "Your ride has been booked. We'll send you a confirmation shortly.",
      });

      // Reset form
      setPickupAddress("");
      setDropAddress("");
      setPickupTime("");
      setEstimatedDistance(null);
      setEstimatedFare(null);
      setShowConfirmation(false);
      setBookingData(null);
    } catch (error) {
      console.error("Booking error:", error);
      toast({
        title: "Booking Failed",
        description: "Unable to confirm your booking. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <section id="booking" className="py-20 md:py-32 relative">
      <div className="kyra-container">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <h2 className="font-display text-3xl md:text-4xl lg:text-5xl font-semibold mb-4 text-foreground">
            Book Your <span className="text-gradient">Safe Ride</span>
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Enter your pickup and drop locations, select your preferred time,
            and we'll take care of the rest.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-6xl mx-auto">
          {/* Booking Form */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="kyra-card"
          >
            <h3 className="font-display text-2xl font-semibold mb-6 text-foreground">
              Ride Details
            </h3>

            <div className="space-y-5">
              {/* Pickup Location */}
              <div>
                <label className="block text-sm font-medium text-foreground/80 mb-2">
                  Pickup Location
                </label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-accent" />
                  <Input
                    type="text"
                    placeholder="Enter pickup address..."
                    value={pickupAddress}
                    onChange={(e) => setPickupAddress(e.target.value)}
                    className="pl-10 kyra-input"
                  />
                </div>
              </div>

              {/* Drop Location */}
              <div>
                <label className="block text-sm font-medium text-foreground/80 mb-2">
                  Drop Location
                </label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-secondary" />
                  <Input
                    type="text"
                    placeholder="Enter drop address..."
                    value={dropAddress}
                    onChange={(e) => setDropAddress(e.target.value)}
                    className="pl-10 kyra-input"
                  />
                </div>
              </div>

              {/* Pickup Time */}
              <div>
                <label className="block text-sm font-medium text-foreground/80 mb-2">
                  Pickup Time
                </label>
                <div className="relative">
                  <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <Input
                    type="datetime-local"
                    value={pickupTime}
                    onChange={(e) => setPickupTime(e.target.value)}
                    min={getMinDateTime()}
                    className="pl-10 kyra-input"
                  />
                </div>
                <div className="flex items-center gap-2 mt-2 text-amber-400 text-xs">
                  <AlertCircle className="w-4 h-4" />
                  <span>3-hour advance booking required</span>
                </div>
              </div>

              <Button
                variant="hero"
                size="lg"
                className="w-full mt-6"
                onClick={handleContinueBooking}
                disabled={!pickupAddress || !dropAddress || !pickupTime}
              >
                Continue Booking
              </Button>
            </div>
          </motion.div>

          {/* Trip Details Card */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="relative"
          >
            <div className="kyra-card bg-gradient-card h-full">
              <h3 className="font-display text-2xl font-semibold mb-6 text-foreground">
                Trip Summary
              </h3>

              <div className="space-y-6">
                {/* Route Visual */}
                <div className="flex items-start gap-4">
                  <div className="flex flex-col items-center">
                    <div className="w-3 h-3 rounded-full bg-accent" />
                    <div className="w-0.5 h-16 bg-border" />
                    <div className="w-3 h-3 rounded-full bg-secondary" />
                  </div>
                  <div className="flex-1 space-y-4">
                    <div>
                      <p className="text-xs text-muted-foreground uppercase tracking-wide">
                        Pickup
                      </p>
                      <p className="text-foreground font-medium truncate">
                        {pickupAddress || "Enter pickup location"}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground uppercase tracking-wide">
                        Drop
                      </p>
                      <p className="text-foreground font-medium truncate">
                        {dropAddress || "Enter drop location"}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Distance & Fare */}
                <div className="grid grid-cols-2 gap-4 pt-4 border-t border-border/50">
                  <div className="text-center p-4 rounded-lg bg-card/40">
                    <Car className="w-6 h-6 text-accent mx-auto mb-2" />
                    <p className="text-xs text-muted-foreground uppercase tracking-wide">
                      Distance
                    </p>
                    <p className="text-2xl font-display font-semibold text-foreground">
                      {estimatedDistance ? `${estimatedDistance} km` : "—"}
                    </p>
                  </div>
                  <div className="text-center p-4 rounded-lg bg-card/40">
                    <IndianRupee className="w-6 h-6 text-accent mx-auto mb-2" />
                    <p className="text-xs text-muted-foreground uppercase tracking-wide">
                      Estimated Fare
                    </p>
                    <p className="text-2xl font-display font-semibold text-foreground">
                      {estimatedFare ? `₹${estimatedFare}` : "—"}
                    </p>
                  </div>
                </div>

                {/* Pickup Time Display */}
                {pickupTime && (
                  <div className="p-4 rounded-lg bg-accent/10 border border-accent/20">
                    <p className="text-xs text-accent uppercase tracking-wide mb-1">
                      Scheduled For
                    </p>
                    <p className="text-foreground font-semibold">
                      {new Date(pickupTime).toLocaleString("en-IN", {
                        weekday: "long",
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                )}

                {/* Fare Breakdown */}
                {estimatedFare && (
                  <div className="text-xs text-muted-foreground space-y-1 pt-4 border-t border-border/50">
                    <p>Base Fare: ₹{BASE_FARE}</p>
                    <p>
                      Distance Charge: ₹{PER_KM_RATE}/km × {estimatedDistance} km
                    </p>
                    <p>Tax: 5%</p>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Auth Dialog */}
      <Dialog open={showAuthDialog} onOpenChange={setShowAuthDialog}>
        <DialogContent className="kyra-card border-border bg-card">
          <DialogHeader>
            <DialogTitle className="font-display text-xl text-foreground">
              Enter Your Details
            </DialogTitle>
            <DialogDescription className="text-muted-foreground">
              Please provide your name and phone number to continue with the booking.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <label className="block text-sm font-medium text-foreground/80 mb-2">
                Full Name
              </label>
              <Input
                type="text"
                placeholder="Enter your name..."
                value={authName}
                onChange={(e) => setAuthName(e.target.value)}
                className="kyra-input"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground/80 mb-2">
                Phone Number
              </label>
              <Input
                type="tel"
                placeholder="10-digit mobile number..."
                value={authPhone}
                onChange={(e) => setAuthPhone(e.target.value)}
                className="kyra-input"
                maxLength={10}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAuthDialog(false)}>
              Cancel
            </Button>
            <Button variant="hero" onClick={handleAuth} disabled={authLoading}>
              {authLoading ? "Verifying..." : "Continue"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirmation Dialog */}
      <Dialog open={showConfirmation} onOpenChange={setShowConfirmation}>
        <DialogContent className="kyra-card border-border bg-card max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-display text-xl text-foreground">
              Confirm Your Booking
            </DialogTitle>
            <DialogDescription className="text-muted-foreground">
              Please review your booking details before confirming.
            </DialogDescription>
          </DialogHeader>
          {bookingData && (
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Pickup</p>
                  <p className="text-foreground font-medium">{bookingData.pickupAddress}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Drop</p>
                  <p className="text-foreground font-medium">{bookingData.dropAddress}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Distance</p>
                  <p className="text-foreground font-medium">{bookingData.distance} km</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Fare</p>
                  <p className="text-foreground font-semibold text-lg">₹{bookingData.fare}</p>
                </div>
              </div>
              <div className="p-4 rounded-lg bg-accent/10 border border-accent/20">
                <p className="text-xs text-accent uppercase tracking-wide mb-1">
                  Pickup Time
                </p>
                <p className="text-foreground font-semibold">
                  {new Date(bookingData.pickupTime).toLocaleString("en-IN", {
                    weekday: "long",
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowConfirmation(false)}>
              Cancel
            </Button>
            <Button variant="cta" onClick={handleConfirmBooking} disabled={isLoading}>
              {isLoading ? "Confirming..." : "Confirm Booking"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  );
};

export default BookingSection;
