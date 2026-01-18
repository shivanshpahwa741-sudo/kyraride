import { motion } from "framer-motion";
import { Link } from "react-router-dom";
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
      question: "Cancellation & Refunds",
      answer: "For any cancellations or refund enquiries, please reach out to us on WhatsApp. Our team will assist you promptly.",
      hasLink: true,
      linkText: "Contact on WhatsApp",
      linkUrl: "https://wa.me/message/PWIMWJHRYGQRL1",
      isExternal: true,
    },
    {
      question: "Ride Policies",
      answer: "Gender Policy: We do not provide auto-rickshaw services to male adults, even if accompanied by females. Right to Refuse: We reserve the right to cancel rides for disrespectful behavior or policy violations.",
      hasLink: true,
      linkText: "Read Full Terms",
      linkUrl: "/terms",
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
                  <p>{faq.answer}</p>
                  {faq.hasLink && (
                    faq.isExternal ? (
                      <a 
                        href={faq.linkUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-block mt-3 text-accent hover:text-accent/80 transition-colors font-medium"
                      >
                        {faq.linkText} →
                      </a>
                    ) : (
                      <Link 
                        to={faq.linkUrl} 
                        className="inline-block mt-3 text-accent hover:text-accent/80 transition-colors font-medium"
                      >
                        {faq.linkText} →
                      </Link>
                    )
                  )}
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
