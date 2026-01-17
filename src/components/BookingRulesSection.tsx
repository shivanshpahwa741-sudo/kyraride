import { motion } from "framer-motion";
import { Calendar, Clock } from "lucide-react";

const BookingRulesSection = () => {
  return (
    <section className="py-16 md:py-24 bg-background">
      <div className="kyra-container">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="max-w-2xl mx-auto text-center"
        >
          <div className="inline-flex items-center gap-3 mb-6 text-accent/80">
            <Calendar className="w-5 h-5" />
            <span className="uppercase tracking-[0.2em] text-sm font-medium">Booking Schedule</span>
          </div>
          
          <div className="p-8 md:p-12 rounded-2xl bg-card border border-border/30">
            <div className="flex items-center justify-center gap-3 mb-6">
              <Clock className="w-6 h-6 text-accent" />
              <p className="font-display text-xl md:text-2xl font-bold text-foreground">
                Weekly Bookings
              </p>
            </div>
            <p className="text-muted-foreground text-lg leading-relaxed mb-4">
              Subscriptions close every <span className="text-foreground font-semibold">Saturday at 12:00 PM</span> for the following Monday start.
            </p>
            <p className="text-muted-foreground">
              Minimum commitment: <span className="text-foreground font-semibold">2 days per week</span>
            </p>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default BookingRulesSection;
