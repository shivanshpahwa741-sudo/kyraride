import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const Terms = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="pt-32 pb-20">
        <div className="kyra-container">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="max-w-3xl mx-auto"
          >
            {/* Back Link */}
            <Link 
              to="/" 
              className="inline-flex items-center gap-2 text-accent hover:text-accent/80 transition-colors mb-8"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Home
            </Link>

            {/* Header */}
            <h1 className="font-display text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-4">
              Terms of Service & Privacy Policy
            </h1>
            <p className="text-muted-foreground mb-12">
              Last Updated: January 2026
            </p>

            {/* Section 1 */}
            <section className="mb-12">
              <h2 className="font-display text-2xl font-semibold text-foreground mb-4">
                1. Service Gender Policy
              </h2>
              <div className="prose prose-invert max-w-none">
                <p className="text-muted-foreground leading-relaxed mb-4">
                  Kyra is committed to providing a specialized transit environment. <strong className="text-foreground">We strictly do not provide autorickshaw services to male adults.</strong>
                </p>
                <ul className="text-muted-foreground space-y-2 list-disc list-inside">
                  <li>This applies to all bookings, including those where a male adult is accompanied by a female passenger.</li>
                  <li>Bookings made for male adults will be cancelled immediately without a refund.</li>
                </ul>
              </div>
            </section>

            {/* Section 2 */}
            <section className="mb-12">
              <h2 className="font-display text-2xl font-semibold text-foreground mb-4">
                2. Cancellation & Refund Policy
              </h2>
              <div className="prose prose-invert max-w-none space-y-4">
                <div>
                  <h3 className="text-lg font-medium text-foreground mb-2">Kyra-Initiated Cancellation</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    If we fail to provide a ride or the driver is a no-show, a 100% refund is issued to your original payment method.
                  </p>
                </div>
                <div>
                  <h3 className="text-lg font-medium text-foreground mb-2">User-Initiated Cancellation</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    To receive a refund, you must cancel via our WhatsApp Support by <strong className="text-foreground">11:59 PM IST the night before the ride</strong>.
                  </p>
                </div>
                <div>
                  <h3 className="text-lg font-medium text-foreground mb-2">Non-Refundable</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    Any cancellation made after the midnight cutoff or on the day of the ride is ineligible for a refund.
                  </p>
                </div>
                <div>
                  <h3 className="text-lg font-medium text-foreground mb-2">Subscriptions</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    Multi-ride plans are non-refundable once the first ride period has begun.
                  </p>
                </div>
              </div>
            </section>

            {/* Section 3 */}
            <section className="mb-12">
              <h2 className="font-display text-2xl font-semibold text-foreground mb-4">
                3. Conduct & Safety
              </h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                We reserve the right to reject service or terminate accounts for:
              </p>
              <ul className="text-muted-foreground space-y-2 list-disc list-inside">
                <li>Any pattern of disrespect or harassment toward Kyra partners or staff.</li>
                <li>Providing fraudulent booking details.</li>
                <li>Failure to adhere to safety protocols during a ride.</li>
              </ul>
            </section>

            {/* Section 4 */}
            <section className="mb-12">
              <h2 className="font-display text-2xl font-semibold text-foreground mb-4">
                4. Privacy & Data Handling
              </h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                By using our service, you agree to the collection of limited data (Name, Phone Number, Location) via WhatsApp or our website to:
              </p>
              <ul className="text-muted-foreground space-y-2 list-disc list-inside mb-4">
                <li>Process your booking and payments via Razorpay.</li>
                <li>Provide customer support and safety updates.</li>
              </ul>
              <p className="text-foreground font-medium">
                We do not sell your data to third parties.
              </p>
            </section>

            {/* Contact */}
            <section className="pt-8 border-t border-border/30">
              <h2 className="font-display text-2xl font-semibold text-foreground mb-4">
                Questions?
              </h2>
              <p className="text-muted-foreground leading-relaxed">
                Contact us via{" "}
                <a 
                  href="https://wa.me/message/PWIMWJHRYGQRL1" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-accent hover:text-accent/80 transition-colors"
                >
                  WhatsApp
                </a>
                {", "}email us at{" "}
                <a 
                  href="mailto:Admin@kyraries.in" 
                  className="text-accent hover:text-accent/80 transition-colors"
                >
                  Admin@kyraries.in
                </a>
                {", "}or call{" "}
                <a 
                  href="tel:+919686638787" 
                  className="text-accent hover:text-accent/80 transition-colors"
                >
                  +91 96866 38787
                </a>
              </p>
            </section>
          </motion.div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Terms;
