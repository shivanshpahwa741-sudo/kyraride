import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Calendar, MapPin, Clock, IndianRupee, Package, Loader2, RefreshCw, Plus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth, getSessionToken } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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

const MyBookings = () => {
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

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "confirmed":
        return "bg-green-500/20 text-green-400 border-green-500/30";
      case "completed":
        return "bg-blue-500/20 text-blue-400 border-blue-500/30";
      case "cancelled":
        return "bg-red-500/20 text-red-400 border-red-500/30";
      default:
        return "bg-muted text-muted-foreground";
    }
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
              My Bookings
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
          <div className="mb-8">
            <h1 className="font-display text-3xl font-bold text-foreground mb-2">
              Booking History
            </h1>
            <p className="text-muted-foreground">
              View all your past and upcoming ride subscriptions
            </p>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="h-8 w-8 animate-spin text-accent" />
            </div>
          ) : error ? (
            <Card className="bg-destructive/10 border-destructive/30">
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
            <Card className="bg-card/50 border-border/30">
              <CardContent className="py-16 text-center">
                <Package className="h-16 w-16 mx-auto text-muted-foreground/50 mb-4" />
                <h3 className="text-xl font-semibold text-foreground mb-2">
                  No Bookings Yet
                </h3>
                <p className="text-muted-foreground mb-6">
                  You haven't made any ride subscriptions yet.
                </p>
                <Button asChild className="kyra-btn-primary">
                  <Link to="/book">Book Your First Ride</Link>
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {bookings.map((booking, index) => (
                <motion.div
                  key={booking.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.1 }}
                >
                  <Card className="bg-card/50 border-border/30 hover:border-accent/30 transition-colors">
                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-lg font-semibold">
                          {booking.start_date}
                        </CardTitle>
                        <Badge className={getStatusColor(booking.status)}>
                          {booking.status}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {/* Route */}
                      <div className="space-y-2">
                        <div className="flex items-start gap-3">
                          <MapPin className="h-4 w-4 text-green-500 mt-1 shrink-0" />
                          <div className="text-sm">
                            <p className="text-muted-foreground text-xs">Pickup</p>
                            <p className="text-foreground">{booking.pickup_address}</p>
                          </div>
                        </div>
                        <div className="flex items-start gap-3">
                          <MapPin className="h-4 w-4 text-red-500 mt-1 shrink-0" />
                          <div className="text-sm">
                            <p className="text-muted-foreground text-xs">Drop</p>
                            <p className="text-foreground">{booking.drop_address}</p>
                          </div>
                        </div>
                      </div>

                      {/* Details Grid */}
                      <div className="grid grid-cols-2 gap-4 pt-2 border-t border-border/30">
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm text-foreground">{booking.pickup_time}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm text-foreground">
                            {booking.selected_days?.join(", ") || "-"}
                          </span>
                        </div>
                      </div>

                      {/* Amount */}
                      <div className="flex items-center justify-between pt-2 border-t border-border/30">
                        <div className="flex items-center gap-2">
                          <IndianRupee className="h-4 w-4 text-accent" />
                          <span className="text-lg font-semibold text-foreground">
                            ₹{booking.total_amount}
                          </span>
                          <span className="text-sm text-muted-foreground">
                            (₹{booking.per_ride_fare}/ride)
                          </span>
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {formatDate(booking.created_at)}
                        </span>
                      </div>

                      {/* Renew Button */}
                      <div className="flex items-center justify-between pt-3 border-t border-border/30">
                        <div className="text-xs text-muted-foreground">
                          Payment ID: {booking.payment_id}
                        </div>
                        <Button 
                          asChild 
                          size="sm"
                          className="bg-accent/20 text-accent hover:bg-accent/30 border border-accent/30"
                        >
                          <Link 
                            to={`/subscribe?renew=true&pickup=${encodeURIComponent(booking.pickup_address)}&drop=${encodeURIComponent(booking.drop_address)}&time=${encodeURIComponent(booking.pickup_time)}&days=${encodeURIComponent(booking.selected_days?.join(",") || "")}`}
                          >
                            <RefreshCw className="h-3 w-3 mr-1" />
                            Renew
                          </Link>
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>
      </main>
    </div>
  );
};

export default MyBookings;
