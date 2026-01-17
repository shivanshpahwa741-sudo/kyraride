import { motion } from "framer-motion";

const CTASection = () => {
  return (
    <section className="py-24 md:py-32 bg-background">
      <div className="kyra-container">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="text-center max-w-2xl mx-auto"
        >
          <h2 className="font-display text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-6">
            Ready to Experience Premium Mobility?
          </h2>
          <p className="text-muted-foreground text-lg mb-12">
            Join thousands of women in Bangalore who have made the switch to safe, reliable, and consistent commutes.
          </p>
          
          <a
            href="https://wa.me/message/PWIMWJHRYGQRL1"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block px-12 py-5 bg-accent text-accent-foreground font-semibold text-lg rounded-lg transition-all duration-300 ease-out hover:scale-105 hover:shadow-glow"
          >
            Reserve Your Ride
          </a>
        </motion.div>
      </div>
    </section>
  );
};

export default CTASection;
