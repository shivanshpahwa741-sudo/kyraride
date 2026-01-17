import { useEffect } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { BookingForm } from "@/components/booking/BookingForm";

const Subscribe = () => {
  // Load Google Maps script
  useEffect(() => {
    if (window.google?.maps) return;

    const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
    if (!apiKey || apiKey === "YOUR_GOOGLE_MAPS_API_KEY_HERE") {
      console.warn("Google Maps API key not configured");
      return;
    }

    const script = document.createElement("script");
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`;
    script.async = true;
    script.defer = true;
    document.head.appendChild(script);

    return () => {
      // Cleanup if needed
    };
  }, []);

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
            <span className="font-display text-lg font-semibold text-foreground">
              KYRA
            </span>
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
