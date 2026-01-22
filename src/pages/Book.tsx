import { motion } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, Plus, RefreshCw, Calendar, Sparkles } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useEffect } from "react";

const Book = () => {
  const navigate = useNavigate();
  const { user, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading && !user) {
      navigate("/auth");
    }
  }, [user, isLoading, navigate]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" />
      </div>
    );
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
      <main className="pt-24 pb-12 kyra-container min-h-screen flex flex-col justify-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="max-w-2xl mx-auto w-full"
        >
          {/* Welcome Message */}
          <div className="text-center mb-10">
            <h1 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-3">
              Welcome{user?.name ? `, ${user.name.split(" ")[0]}` : ""}!
            </h1>
            <p className="text-muted-foreground text-lg">
              What would you like to do today?
            </p>
          </div>

          {/* Options Grid */}
          <div className="grid gap-6 md:grid-cols-2">
            {/* New Subscription */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              <Link
                to="/subscribe"
                className="group block h-full"
              >
                <div className="h-full kyra-glass rounded-2xl p-8 border border-border/30 hover:border-accent/50 transition-all duration-300 hover:shadow-glow">
                  <div className="flex flex-col items-center text-center space-y-4">
                    <div className="w-20 h-20 bg-accent/10 rounded-full flex items-center justify-center group-hover:bg-accent/20 transition-colors">
                      <Plus className="h-10 w-10 text-accent" />
                    </div>
                    <div>
                      <h2 className="font-display text-xl font-bold text-foreground mb-2">
                        New Subscription
                      </h2>
                      <p className="text-muted-foreground text-sm">
                        Book a fresh weekly ride subscription with new pickup & drop locations
                      </p>
                    </div>
                    <div className="flex items-center gap-2 text-accent text-sm font-medium pt-2">
                      <Sparkles className="h-4 w-4" />
                      <span>Start Fresh</span>
                    </div>
                  </div>
                </div>
              </Link>
            </motion.div>

            {/* Renew Subscription */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <Link
                to="/subscribe?renew=true"
                className="group block h-full"
              >
                <div className="h-full kyra-glass rounded-2xl p-8 border border-border/30 hover:border-accent/50 transition-all duration-300 hover:shadow-glow">
                  <div className="flex flex-col items-center text-center space-y-4">
                    <div className="w-20 h-20 bg-accent/10 rounded-full flex items-center justify-center group-hover:bg-accent/20 transition-colors">
                      <RefreshCw className="h-10 w-10 text-accent" />
                    </div>
                    <div>
                      <h2 className="font-display text-xl font-bold text-foreground mb-2">
                        Renew Subscription
                      </h2>
                      <p className="text-muted-foreground text-sm">
                        Continue your existing subscription for the next week
                      </p>
                    </div>
                    <div className="flex items-center gap-2 text-accent text-sm font-medium pt-2">
                      <Calendar className="h-4 w-4" />
                      <span>Extend for Next Week</span>
                    </div>
                  </div>
                </div>
              </Link>
            </motion.div>
          </div>

          {/* View Bookings Link */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="mt-8 text-center"
          >
            <Link
              to="/my-bookings"
              className="text-accent hover:underline font-medium inline-flex items-center gap-2"
            >
              <Calendar className="h-4 w-4" />
              View My Booking History
            </Link>
          </motion.div>
        </motion.div>
      </main>
    </div>
  );
};

export default Book;
