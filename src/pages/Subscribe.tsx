import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { ArrowLeft, LogOut } from "lucide-react";
import { BookingForm } from "@/components/booking/BookingForm";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";

// Google Maps API Key (publishable client-side key)
const GOOGLE_MAPS_API_KEY = "AIzaSyCosDGgQqodf2DpG-a8QTwNXSBrotP-NAA";

const Subscribe = () => {
  const navigate = useNavigate();
  const { user, isLoading, logout } = useAuth();

  // Redirect to auth if not logged in
  useEffect(() => {
    if (!isLoading && !user) {
      navigate("/auth");
    }
  }, [user, isLoading, navigate]);

  // Load Google Maps script
  useEffect(() => {
    if (window.google?.maps) return;

    const script = document.createElement("script");
    script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_API_KEY}&libraries=places`;
    script.async = true;
    script.defer = true;
    document.head.appendChild(script);

    return () => {
      // Cleanup if needed
    };
  }, []);

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  // Show loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse text-foreground">Loading...</div>
      </div>
    );
  }

  // Don't render if not authenticated (will redirect)
  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-md border-b border-border/20">
        <div className="kyra-container">
          <div className="flex items-center justify-between h-16">
            <Link
              to="/"
              className="flex items-center gap-2 text-foreground/70 hover:text-foreground transition-colors"
            >
              <ArrowLeft className="h-5 w-5" />
              <span className="font-medium">Back to Home</span>
            </Link>
            <div className="flex items-center gap-4">
              <span className="text-sm text-muted-foreground">
                Hi, <span className="text-foreground font-medium">{user.name}</span>
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleLogout}
                className="text-muted-foreground hover:text-foreground"
              >
                <LogOut className="h-4 w-4 mr-1" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="pt-24 pb-16">
        <div className="kyra-container">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="max-w-2xl mx-auto"
          >
            {/* Page Header */}
            <div className="text-center mb-10">
              <h1 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-4">
                Subscribe to Your Daily Ride
              </h1>
              <p className="text-muted-foreground text-lg">
                Book your weekly commute with fixed pricing and guaranteed pickups
              </p>
            </div>

            {/* Booking Form Card */}
            <div className="kyra-glass rounded-2xl p-6 md:p-8">
              <BookingForm />
            </div>

            {/* Info */}
            <div className="mt-8 text-center">
              <p className="text-sm text-muted-foreground">
                Need help?{" "}
                <a
                  href="https://wa.me/message/PWIMWJHRYGQRL1"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-accent hover:underline"
                >
                  Contact us on WhatsApp
                </a>
              </p>
            </div>
          </motion.div>
        </div>
      </main>
    </div>
  );
};

export default Subscribe;
