import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle, Clock, MapPin, Calendar } from "lucide-react";
import type { FareDetails } from "@/types/booking";
import { formatCurrency } from "@/lib/fare-calculator";

interface FareBreakdownProps {
  fareDetails: FareDetails | null;
  isCalculating: boolean;
}

export function FareBreakdown({ fareDetails, isCalculating }: FareBreakdownProps) {
  if (isCalculating) {
    return (
      <div className="rounded-xl border border-border/30 bg-card/50 p-6">
        <div className="flex items-center justify-center gap-3 text-muted-foreground">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-accent border-t-transparent" />
          <span>Calculating fare...</span>
        </div>
      </div>
    );
  }

  if (!fareDetails) {
    return (
      <div className="rounded-xl border border-border/30 bg-card/50 p-6">
        <p className="text-center text-muted-foreground text-sm">
          Complete the form above to see your fare estimate
        </p>
      </div>
    );
  }

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={fareDetails.totalWeeklyFare}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        className="rounded-xl border border-border/30 bg-card/50 p-6 space-y-4"
      >
        {/* Surge Pricing Alert */}
        {fareDetails.isSurgePricing && (
          <div className="flex items-center gap-2 p-3 rounded-lg bg-amber-500/10 border border-amber-500/30">
            <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0" />
            <p className="text-sm text-amber-200">
              Night surge pricing (10pm - 7am): 1.5x rates apply
            </p>
          </div>
        )}

        {/* Fare Details */}
        <div className="space-y-3">
          <div className="flex items-center justify-between text-sm">
            <span className="flex items-center gap-2 text-muted-foreground">
              <MapPin className="h-4 w-4" />
              Distance
            </span>
            <span className="text-foreground font-medium">
              {fareDetails.distanceKm.toFixed(1)} km
            </span>
          </div>

          <div className="flex items-center justify-between text-sm">
            <span className="flex items-center gap-2 text-muted-foreground">
              <Clock className="h-4 w-4" />
              Per ride fare
            </span>
            <span className="text-foreground font-medium">
              {formatCurrency(fareDetails.perRideFare)}
            </span>
          </div>

          <div className="flex items-center justify-between text-sm">
            <span className="flex items-center gap-2 text-muted-foreground">
              <Calendar className="h-4 w-4" />
              Days selected
            </span>
            <span className="text-foreground font-medium">
              {fareDetails.numberOfDays} {fareDetails.numberOfDays === 1 ? "day" : "days"}/week
            </span>
          </div>

          <div className="border-t border-border/30 pt-3 mt-3">
            <div className="flex items-center justify-between">
              <span className="text-foreground font-semibold">Weekly Total</span>
              <span className="text-2xl font-bold text-accent">
                {formatCurrency(fareDetails.totalWeeklyFare)}
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {formatCurrency(fareDetails.perRideFare)} x {fareDetails.numberOfDays} days
            </p>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
