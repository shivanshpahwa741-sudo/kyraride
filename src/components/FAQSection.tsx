import { motion } from "framer-motion";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const FAQSection = () => {
  const faqs = [
    {
      question: "How does the subscription work?",
      answer: "Our weekly subscription gives you unlimited rides within your chosen zones. Sign up via WhatsApp, select your pickup and drop locations, and enjoy consistent daily commutes without the hassle of booking each ride individually.",
    },
    {
      question: "What areas do you cover in Bangalore?",
      answer: "We currently operate across all major residential and commercial areas in Bangalore including Koramangala, HSR Layout, Indiranagar, Whitefield, Electronic City, Marathahalli, and Jayanagar. New zones are added regularly.",
    },
    {
      question: "Are all drivers women?",
      answer: "Yes, absolutely. Every driver in our fleet is a verified, trained woman. We conduct thorough background checks and provide extensive safety training to ensure your complete comfort and security.",
    },
    {
      question: "What about cancellations?",
      answer: "You can cancel your subscription at any time with no penalties. For weekly adjustments, inform us before Saturday 12 PM for changes to take effect the following week.",
    },
    {
      question: "Why electric vehicles?",
      answer: "Our fleet of 800+ EVs ensures a silent, clean, and sustainable ride. No emissions, no noise pollution—just smooth, eco-friendly mobility for a greener Bangalore.",
    },
    {
      question: "Terms of Service",
      answer: "By using Kyra's services, you agree to our terms. Our service is exclusively for women passengers. Subscriptions are billed weekly and can be cancelled anytime. Users must treat drivers with respect; any misconduct may result in immediate account termination. Kyra reserves the right to modify pricing and service areas with prior notice. All disputes are subject to the jurisdiction of courts in Bengaluru, Karnataka.",
    },
    {
      question: "Privacy Policy",
      answer: "Kyra is committed to protecting your privacy. We collect personal information (name, phone, email, locations) solely to provide our service. We never sell your data. Information is shared only with drivers to facilitate rides and with service providers as necessary. We implement industry-standard security measures to protect your data. For questions, contact us via WhatsApp or the phone number provided.",
    },
  ];

  return (
    <section id="faq" className="kyra-section bg-card/30">
      <div className="kyra-container">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="text-center mb-16"
        >
          <h2 className="font-display text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-6">
            Frequently Asked Questions
          </h2>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="max-w-3xl mx-auto"
        >
          <Accordion type="single" collapsible className="space-y-4">
            {faqs.map((faq, index) => (
              <AccordionItem
                key={index}
                value={`item-${index}`}
                className="bg-card border border-border/30 rounded-xl px-6 overflow-hidden"
              >
                <AccordionTrigger className="text-left font-display text-lg font-semibold text-foreground hover:text-accent transition-colors py-6 hover:no-underline">
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground leading-relaxed pb-6">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </motion.div>
      </div>
    </section>
  );
};

export default FAQSection;
