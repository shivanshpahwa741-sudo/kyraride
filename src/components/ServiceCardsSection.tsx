import { motion } from "framer-motion";
import { ShieldCheck, Banknote, Leaf } from "lucide-react";

const ServiceCardsSection = () => {
  const services = [
    {
      icon: ShieldCheck,
      title: "Safe & Reliable",
      description: "Women drivers for women passengers. Verified, trained, and committed to your comfort.",
    },
    {
      icon: Leaf,
      title: "100% Women-Driven Fleet",
      description: "Safety isn't just about the vehicle; it's about who is behind the wheel. While our fleet includes eco-friendly electric and traditional autorickshaws, every single KYRA ride is piloted by a professional female driver for your absolute peace of mind.",
    },
    {
      icon: Banknote,
      title: "Transparent & Fair Pricing",
      description: "No hidden costs. We follow standard market rates. While we use dynamic pricing post 10 pm to ensure a driver is always available for you, we stay committed to being fair and competitive with the local market.",
    },
  ];

  return (
    <section className="kyra-section bg-card/30">
      <div className="kyra-container">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="text-center mb-20"
        >
          <h2 className="font-display text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-6">
            Experience Delight
          </h2>
        </motion.div>

        {/* Service Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
          {services.map((service, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: index * 0.15 }}
              className="group p-8 md:p-10 rounded-2xl bg-card border border-border/30 hover:border-accent/30 transition-all duration-500"
            >
              <div className="mb-8">
                <service.icon className="w-10 h-10 text-accent" />
              </div>
              <h3 className="font-display text-xl md:text-2xl font-bold text-foreground mb-4 group-hover:text-accent transition-colors duration-300">
                {service.title}
              </h3>
              <p className="text-muted-foreground leading-relaxed">
                {service.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ServiceCardsSection;
