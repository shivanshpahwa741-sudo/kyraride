import { Button } from "@/components/ui/button";
import { CheckCircle, MapPin, Calendar, Clock, CreditCard, Route, Sparkles } from "lucide-react";
import type { FareDetails, WeekDay } from "@/types/booking";
import type { BookingSchemaType } from "@/schemas/booking-schema";

interface BookingConfirmationProps {
  bookingData: BookingSchemaType;
  fareDetails: FareDetails;
  distanceKm: number;
  paymentId: string;
  subscriptionStartDate: string;
  onBookAnother: () => void;
}

export function BookingConfirmation({
  bookingData,
  fareDetails,
  distanceKm,
  paymentId,
  subscriptionStartDate,
  onBookAnother,
}: BookingConfirmationProps) {
  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(":");
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? "PM" : "AM";
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  const formatDays = (days: WeekDay[]) => {
    return days.map((d) => d.charAt(0).toUpperCase() + d.slice(1)).join(", ");
  };

  // Calculate dates for each selected day
  const getScheduledDates = () => {
    const dayMap: Record<WeekDay, number> = {
      sunday: 0,
      monday: 1,
      tuesday: 2,
      wednesday: 3,
      thursday: 4,
      friday: 5,
      saturday: 6,
    };

    // Parse subscription start date to get the Monday
    const startDateMatch = subscriptionStartDate.match(/(\d+)\s+(\w+)\s+(\d+)/);
    if (!startDateMatch) return [];

    const monthNames = ["January", "February", "March", "April", "May", "June", 
                       "July", "August", "September", "October", "November", "December"];
    const day = parseInt(startDateMatch[1]);
    const month = monthNames.indexOf(startDateMatch[2]);
    const year = parseInt(startDateMatch[3]);

    const startDate = new Date(year, month, day);

    return bookingData.selectedDays.map((weekDay) => {
      const targetDayNum = dayMap[weekDay];
      const mondayNum = 1;
      const daysToAdd = (targetDayNum - mondayNum + 7) % 7;
      const date = new Date(startDate);
      date.setDate(startDate.getDate() + daysToAdd);
      
      return {
        day: weekDay,
        date: date.toLocaleDateString("en-IN", {
          weekday: "short",
          day: "numeric",
          month: "short",
        }),
      };
    });
  };

  const scheduledDates = getScheduledDates();

  return (
    <div className="space-y-6 py-4">
      {/* Success Header */}
      <div className="text-center space-y-4">
        <div className="w-20 h-20 mx-auto bg-gradient-to-br from-accent/30 to-accent/10 rounded-full flex items-center justify-center animate-in zoom-in-50 duration-500">
          <CheckCircle className="w-10 h-10 text-accent" />
        </div>
        <div className="space-y-2">
          <h2 className="font-display text-2xl md:text-3xl font-bold text-foreground">
            Thank You! 🎉
          </h2>
          <p className="text-muted-foreground text-sm md:text-base max-w-md mx-auto">
            Your KYRA ride subscription is confirmed. We're excited to have you on board!
          </p>
        </div>
      </div>

      {/* Confirmation Card */}
      <div className="bg-card/60 backdrop-blur-sm border border-border/50 rounded-xl p-5 space-y-5">
        {/* Payment Success Badge */}
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-accent" />
            <span className="text-sm font-semibold text-accent">Payment Successful</span>
          </div>
          <span className="text-xs font-mono text-muted-foreground bg-muted/50 px-2 py-1 rounded">
            {paymentId}
          </span>
        </div>

        {/* Divider */}
        <div className="border-t border-border/30" />

        {/* Route Details */}
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
            <Route className="h-4 w-4 text-accent" />
            Your Route
          </h3>
          <div className="space-y-2 pl-6">
            <div className="flex items-start gap-2">
              <div className="w-2 h-2 rounded-full bg-green-500 mt-1.5 shrink-0" />
              <div>
                <p className="text-xs text-muted-foreground">Pickup</p>
                <p className="text-sm text-foreground">{bookingData.pickupAddress}</p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <div className="w-2 h-2 rounded-full bg-red-500 mt-1.5 shrink-0" />
              <div>
                <p className="text-xs text-muted-foreground">Drop</p>
                <p className="text-sm text-foreground">{bookingData.dropAddress}</p>
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Distance: <span className="text-foreground font-medium">{distanceKm.toFixed(1)} km</span> (one way)
            </p>
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-border/30" />

        {/* Schedule Details */}
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
            <Calendar className="h-4 w-4 text-accent" />
            Subscription Schedule
          </h3>
          <div className="space-y-2 pl-6">
            <div className="flex items-center gap-2 text-sm">
              <Clock className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="text-muted-foreground">Pickup Time:</span>
              <span className="text-foreground font-medium">{formatTime(bookingData.pickupTime)}</span>
            </div>
            <div className="text-sm">
              <p className="text-muted-foreground mb-2">
                Starting from <span className="text-foreground font-medium">{subscriptionStartDate}</span>
              </p>
              <div className="flex flex-wrap gap-2">
                {scheduledDates.map(({ day, date }) => (
                  <div
                    key={day}
                    className="bg-accent/10 border border-accent/20 rounded-lg px-3 py-1.5 text-xs"
                  >
                    <span className="text-foreground font-medium capitalize">{day}</span>
                    <span className="text-muted-foreground ml-1">• {date}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-border/30" />

        {/* Payment Details */}
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
            <CreditCard className="h-4 w-4 text-accent" />
            Payment Summary
          </h3>
          <div className="space-y-2 pl-6">
            <div className="grid grid-cols-2 gap-2 text-sm">
              <span className="text-muted-foreground">Base Fare</span>
              <span className="text-foreground text-right">₹{fareDetails.breakdown.baseFare}</span>
              
              <span className="text-muted-foreground">Distance Fare ({distanceKm.toFixed(1)} km)</span>
              <span className="text-foreground text-right">₹{fareDetails.breakdown.distanceFare}</span>
              
              <span className="text-muted-foreground">Per Ride</span>
              <span className="text-foreground text-right font-medium">₹{fareDetails.perRideFare}</span>
              
              <span className="text-muted-foreground">Number of Days</span>
              <span className="text-foreground text-right">{fareDetails.numberOfDays} days/week</span>
            </div>
            
            <div className="border-t border-border/30 pt-2 mt-2">
              <div className="flex items-center justify-between">
                <span className="text-foreground font-semibold">Total Paid</span>
                <span className="text-xl font-bold text-accent">₹{fareDetails.totalWeeklyFare}</span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Weekly subscription • {fareDetails.numberOfDays} rides
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Contact Info */}
      <div className="bg-accent/5 border border-accent/20 rounded-lg p-4 text-center">
        <p className="text-sm text-muted-foreground">
          Our driver will reach your pickup location at{" "}
          <span className="text-foreground font-medium">{formatTime(bookingData.pickupTime)}</span> on scheduled days.
        </p>
        <p className="text-xs text-muted-foreground mt-2">
          For any queries, please contact us on WhatsApp.
        </p>
      </div>

      {/* Book Another Button */}
      <div className="flex justify-center pt-2">
        <Button
          onClick={onBookAnother}
          variant="outline"
          className="border-accent/30 hover:bg-accent/10 text-foreground"
        >
          Book Another Subscription
        </Button>
      </div>
    </div>
  );
}
