import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Calendar, MapPin, Clock, Loader2, RefreshCw, Package } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth, getSessionToken } from "@/hooks/useAuth";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface Booking {
  id: string;
  customer_name: string;
  pickup_address: string;
  drop_address: string;
  distance_km: number;
  selected_days: string[];
  pickup_time: string;
  start_date: string;
  per_ride_fare: number;
  total_amount: number;
  payment_id: string;
  status: string;
  created_at: string;
}

const Renew = () => {
  const navigate = useNavigate();
  const { user, isLoading: authLoading } = useAuth();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    const fetchBookings = async () => {
      if (!user?.phone) return;

      try {
        const sessionToken = getSessionToken();
        const { data, error } = await supabase.functions.invoke("get-bookings", {
          body: { 
            phone: user.phone,
            sessionToken 
          },
        });

        if (error) {
          throw new Error(error.message);
        }

        if (data?.bookings) {
          setBookings(data.bookings);
        }
      } catch (err: any) {
        console.error("Failed to fetch bookings:", err);
        setError(err.message || "Failed to load bookings");
      } finally {
        setIsLoading(false);
      }
    };

    if (user) {
      fetchBookings();
    }
  }, [user]);

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-accent" />
      </div>
    );
  }

  const handleRenew = (booking: Booking) => {
    const params = new URLSearchParams({
      renew: "true",
      pickup: booking.pickup_address,
      drop: booking.drop_address,
      time: booking.pickup_time,
      days: booking.selected_days?.join(",") || "",
    });
    navigate(`/subscribe?${params.toString()}`);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-md border-b border-border/20">
        <div className="kyra-container">
          <div className="flex items-center justify-between h-16">
            <Link
              to="/book"
              className="flex items-center gap-2 text-foreground/70 hover:text-foreground transition-colors"
            >
              <ArrowLeft className="h-5 w-5" />
              <span className="font-medium">Back</span>
            </Link>
            <span className="font-display text-lg font-semibold text-foreground">
              KYRA
            </span>
            <div className="w-20" />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="pt-24 pb-12 kyra-container">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="mb-8 text-center">
            <div className="w-16 h-16 mx-auto bg-accent/10 rounded-full flex items-center justify-center mb-4">
              <RefreshCw className="h-8 w-8 text-accent" />
            </div>
            <h1 className="font-display text-3xl font-bold text-foreground mb-2">
              Renew Subscription
            </h1>
            <p className="text-muted-foreground">
              Select a previous booking to renew for next week
            </p>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="h-8 w-8 animate-spin text-accent" />
            </div>
          ) : error ? (
            <Card className="bg-destructive/10 border-destructive/30 max-w-md mx-auto">
              <CardContent className="py-8 text-center">
                <p className="text-destructive">{error}</p>
                <Button
                  variant="outline"
                  className="mt-4"
                  onClick={() => window.location.reload()}
                >
                  Try Again
                </Button>
              </CardContent>
            </Card>
          ) : bookings.length === 0 ? (
            <Card className="bg-card/50 border-border/30 max-w-md mx-auto">
              <CardContent className="py-16 text-center">
                <Package className="h-16 w-16 mx-auto text-muted-foreground/50 mb-4" />
                <h3 className="text-xl font-semibold text-foreground mb-2">
                  No Previous Bookings
                </h3>
                <p className="text-muted-foreground mb-6">
                  You don't have any previous bookings to renew.
                </p>
                <Button asChild className="kyra-btn-primary">
                  <Link to="/subscribe">Create New Subscription</Link>
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="max-w-2xl mx-auto space-y-4">
              {bookings.map((booking, index) => (
                <motion.div
                  key={booking.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.1 }}
                >
                  <Card className="bg-card/50 border-border/30 hover:border-accent/30 transition-colors overflow-hidden">
                    <CardContent className="p-0">
                      <div className="p-5">
                        {/* Route */}
                        <div className="space-y-3 mb-4">
                          <div className="flex items-start gap-3">
                            <div className="w-6 h-6 rounded-full bg-accent/20 flex items-center justify-center shrink-0 mt-0.5">
                              <MapPin className="h-3 w-3 text-accent" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="text-xs text-muted-foreground">Pickup</p>
                              <p className="text-foreground text-sm truncate">{booking.pickup_address}</p>
                            </div>
                          </div>
                          <div className="flex items-start gap-3">
                            <div className="w-6 h-6 rounded-full bg-accent/20 flex items-center justify-center shrink-0 mt-0.5">
                              <MapPin className="h-3 w-3 text-accent" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="text-xs text-muted-foreground">Drop</p>
                              <p className="text-foreground text-sm truncate">{booking.drop_address}</p>
                            </div>
                          </div>
                        </div>

                        {/* Schedule Info */}
                        <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
                          <div className="flex items-center gap-1.5">
                            <Clock className="h-3.5 w-3.5" />
                            <span>{booking.pickup_time}</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <Calendar className="h-3.5 w-3.5" />
                            <span>{booking.selected_days?.join(", ") || "-"}</span>
                          </div>
                        </div>

                        {/* Previous booking info */}
                        <div className="text-xs text-muted-foreground mb-4">
                          Last booked: {booking.start_date} • ₹{booking.per_ride_fare}/ride
                        </div>
                      </div>

                      {/* Renew Button */}
                      <div className="px-5 py-4 bg-accent/5 border-t border-border/30">
                        <Button
                          onClick={() => handleRenew(booking)}
                          className="w-full kyra-btn-primary"
                        >
                          <RefreshCw className="h-4 w-4 mr-2" />
                          Renew This Subscription
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}

              {/* New Subscription Option */}
              <div className="pt-4 text-center">
                <p className="text-muted-foreground text-sm mb-3">
                  Want to book a different route?
                </p>
                <Button asChild variant="outline" className="border-accent/30 text-accent hover:bg-accent/10">
                  <Link to="/subscribe">Create New Subscription</Link>
                </Button>
              </div>
            </div>
          )}
        </motion.div>
      </main>
    </div>
  );
};

export default Renew;
