import { motion } from "framer-motion";
import { ShieldCheck, Users, MapPin, Clock } from "lucide-react";

const features = [
  {
    icon: ShieldCheck,
    title: "Unmatched Safety",
    description:
      "Every ride is powered by verified women drivers with enhanced safety protocols.",
  },
  {
    icon: Users,
    title: "Women-Only Service",
    description:
      "A judgment-free, stress-free environment where women feel understood and respected.",
  },
  {
    icon: MapPin,
    title: "Bangalore Coverage",
    description:
      "Extensive network covering all major areas of Bangalore for your convenience.",
  },
  {
    icon: Clock,
    title: "24/7 Availability",
    description:
      "Round-the-clock service ensuring you have a safe ride whenever you need it.",
  },
];

const AboutSection = () => {
  return (
    <section id="about" className="py-20 md:py-32 relative">
      <div className="kyra-container">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="font-display text-3xl md:text-4xl lg:text-5xl font-semibold mb-4 text-foreground">
            Why Choose <span className="text-gradient">Kyra</span>
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Built by women, for women. Your safety and comfort are our top
            priority.
          </p>
        </motion.div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              className="kyra-card group hover:border-accent/30 transition-all duration-300"
            >
              <div className="w-12 h-12 rounded-lg bg-accent/10 flex items-center justify-center mb-4 group-hover:bg-accent/20 transition-colors">
                <feature.icon className="w-6 h-6 text-accent" />
              </div>
              <h3 className="font-display text-xl font-semibold mb-2 text-foreground">
                {feature.title}
              </h3>
              <p className="text-muted-foreground text-sm">
                {feature.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default AboutSection;
