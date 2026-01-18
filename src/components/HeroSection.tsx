import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import heroAuto from "@/assets/hero-auto.jpg";
import kyraLogo from "@/assets/kyra-logo-dark.png";

const HeroSection = () => {
  return (
    <section id="home" className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Background Image */}
      <div className="absolute inset-0">
        <img
          src={heroAuto}
          alt="Premium EV Autorickshaw"
          className="w-full h-full object-cover"
        />
        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-background/60 via-background/40 to-background" />
      </div>

      {/* Content */}
      <div className="relative z-10 kyra-container text-center">
        {/* Logo */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="mb-8"
        >
          <img src={kyraLogo} alt="Kyra" className="h-20 md:h-28 mx-auto" />
        </motion.div>

        {/* Tagline */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="text-accent/80 tracking-[0.3em] uppercase text-sm mb-8"
        >
          — The Gold Standard of Safety for Women —
        </motion.p>

        {/* Main Headline */}
        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.4 }}
          className="font-display text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-foreground mb-12 leading-tight"
        >
          Redefining Your Journey
        </motion.h1>

        {/* CTA Button */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, delay: 0.8 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-4"
        >
          <Link
            to="/auth"
            className="inline-flex w-[240px] box-border items-center justify-center px-8 py-5 border-2 border-transparent bg-[hsl(32,35%,87%)] text-[hsl(351,55%,12%)] font-semibold text-lg rounded-lg transition-all duration-300 ease-out hover:scale-105 hover:shadow-[0_0_30px_rgba(232,216,196,0.5)] text-center"
          >
            Reserve Your Ride
          </Link>
          <a
            href="https://wa.me/message/PWIMWJHRYGQRL1"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex w-[240px] box-border items-center justify-center px-8 py-5 bg-transparent border-2 border-accent text-accent font-semibold text-lg rounded-lg transition-all duration-300 ease-out hover:bg-accent/10 text-center"
          >
            Enquire Now
          </a>
        </motion.div>

        {/* Scroll Indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 1.2 }}
          className="absolute bottom-12 left-1/2 -translate-x-1/2"
        >
          <motion.div
            animate={{ y: [0, 10, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="w-6 h-10 border-2 border-accent/40 rounded-full flex items-start justify-center p-2"
          >
            <div className="w-1.5 h-3 bg-accent/60 rounded-full" />
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
};

export default HeroSection;
