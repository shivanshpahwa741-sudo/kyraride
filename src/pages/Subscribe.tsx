import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import Navbar from "@/components/Navbar";
import { BookingForm } from "@/components/booking/BookingForm";
import { Loader2 } from "lucide-react";

const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || "";

const Subscribe = () => {
  const [mapsLoaded, setMapsLoaded] = useState(false);
  const [mapsError, setMapsError] = useState(false);

  useEffect(() => {
    // Check if Google Maps is already loaded
    if (window.google?.maps) {
      setMapsLoaded(true);
      return;
    }

    // Load Google Maps script
    const script = document.createElement("script");
    script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_API_KEY}&libraries=places`;
    script.async = true;
    script.defer = true;

    script.onload = () => {
      setMapsLoaded(true);
    };

    script.onerror = () => {
      setMapsError(true);
    };

    document.head.appendChild(script);

    return () => {
      // Cleanup if needed
    };
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="pt-24 pb-16">
        <div className="kyra-container">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="max-w-2xl mx-auto"
          >
            {/* Header */}
            <div className="text-center mb-10">
              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.1 }}
                className="font-display text-3xl md:text-4xl font-bold text-foreground mb-4"
              >
                Subscribe to Your Daily Ride
              </motion.h1>
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="text-muted-foreground text-lg"
              >
                Book your weekly commute with fixed pricing and guaranteed pickups
              </motion.p>
            </div>

            {/* Form Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="kyra-glass rounded-2xl p-6 md:p-8"
            >
              {mapsError ? (
                <div className="text-center py-12 space-y-4">
                  <div className="w-16 h-16 mx-auto bg-destructive/20 rounded-full flex items-center justify-center">
                    <svg
                      className="w-8 h-8 text-destructive"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                      />
                    </svg>
                  </div>
                  <h3 className="font-display text-xl font-bold text-foreground">
                    Maps Failed to Load
                  </h3>
                  <p className="text-muted-foreground max-w-md mx-auto">
                    We couldn't load the location services. Please check your internet connection and try again.
                  </p>
                  <button
                    onClick={() => window.location.reload()}
                    className="kyra-btn-primary mt-4"
                  >
                    Retry
                  </button>
                </div>
              ) : !mapsLoaded ? (
                <div className="flex flex-col items-center justify-center py-12 gap-4">
                  <Loader2 className="h-8 w-8 animate-spin text-accent" />
                  <p className="text-muted-foreground">Loading location services...</p>
                </div>
              ) : (
                <BookingForm />
              )}
            </motion.div>

            {/* Additional Info */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.5 }}
              className="mt-8 text-center"
            >
              <p className="text-sm text-muted-foreground">
                Need help? Contact us on{" "}
                <a
                  href="https://wa.me/message/PWIMWJHRYGQRL1"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-accent hover:underline"
                >
                  WhatsApp
                </a>
              </p>
            </motion.div>
          </motion.div>
        </div>
      </main>
    </div>
  );
};

export default Subscribe;
