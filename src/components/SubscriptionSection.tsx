import { motion } from "framer-motion";
import { Clock, TrendingUp, Shield } from "lucide-react";

const SubscriptionSection = () => {
  return (
    <section className="kyra-section bg-background">
      <div className="kyra-container">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="text-center max-w-3xl mx-auto mb-20"
        >
          <h2 className="font-display text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-6">
            The Subscription Advantage
          </h2>
          <p className="text-muted-foreground text-lg md:text-xl leading-relaxed">
            Experience mobility that works around your life. One subscription, unlimited peace of mind.
          </p>
        </motion.div>

        {/* Advantages Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-12">
          {[
            {
              icon: Clock,
              title: "Zero Uncertainty",
              description: "Perfect for school runs and office commutes. Your ride is guaranteed, every single day.",
            },
            {
              icon: TrendingUp,
              title: "Fixed-Rate Certainty",
              description: "Pay just ₹22.5/km always. Rain or shine, peak hours or holidays.",
            },
            {
              icon: Shield,
              title: "Consistent Reliability",
              description: "Your dedicated driver knows your schedule. No more waiting, no more worries.",
            },
          ].map((item, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: index * 0.15 }}
              className="text-center"
            >
              <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-accent/10 flex items-center justify-center">
                <item.icon className="w-8 h-8 text-accent" />
              </div>
              <h3 className="font-display text-xl md:text-2xl font-bold text-foreground mb-4">
                {item.title}
              </h3>
              <p className="text-muted-foreground leading-relaxed">
                {item.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default SubscriptionSection;
