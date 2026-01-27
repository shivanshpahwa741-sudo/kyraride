import { motion } from "framer-motion";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { MessageCircle, HelpCircle, Clock, Shield, Heart, Mail } from "lucide-react";

const Contact = () => {
  const whatsappLink = "https://wa.me/919353937349?text=Hi%20Kyra%2C%20I%20need%20help%20with...";
  const emailAddress = "Admin@kyraries.in";

  const helpTopics = [
    { title: "Ride Support", description: "Real-time help with your current booking." },
    { title: "Payments", description: "Questions about subscriptions or Razorpay transactions." },
    { title: "Safety", description: "Feedback or concerns regarding your journey." },
    { title: "Partnerships", description: "Media inquiries or business collaborations." },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      
      <main className="flex-1 pt-24 pb-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="container mx-auto px-4 max-w-3xl"
        >
          <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-2">
            Get in Touch
          </h1>
          <p className="text-lg text-muted-foreground mb-10">
            We're here to keep you moving.
          </p>

          {/* WhatsApp Section */}
          <section className="mb-10 p-6 bg-primary/10 rounded-2xl border border-primary/20">
            <div className="flex items-center gap-3 mb-4">
              <MessageCircle className="w-6 h-6 text-primary" />
              <h2 className="text-xl font-semibold text-foreground">
                WhatsApp (Preferred & Fastest)
              </h2>
            </div>
            <p className="text-muted-foreground mb-4">
              For the quickest response regarding rides, bookings, or support, message us directly:
            </p>
            <a
              href={whatsappLink}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-6 py-3 rounded-full font-medium hover:bg-primary/90 transition-colors"
            >
              <MessageCircle className="w-5 h-5" />
              Chat with Kyra Support
            </a>
          </section>

          {/* Email Section */}
          <section className="mb-10 p-6 bg-muted/30 rounded-2xl border border-border">
            <div className="flex items-center gap-3 mb-4">
              <Mail className="w-6 h-6 text-primary" />
              <h2 className="text-xl font-semibold text-foreground">
                Email
              </h2>
            </div>
            <p className="text-muted-foreground mb-4">
              For formal inquiries, partnerships, or detailed support requests:
            </p>
            <a
              href={`mailto:${emailAddress}`}
              className="inline-flex items-center gap-2 text-primary hover:text-primary/80 font-medium transition-colors"
            >
              <Mail className="w-5 h-5" />
              {emailAddress}
            </a>
          </section>

          {/* What We Can Help With */}
          <section className="mb-10">
            <div className="flex items-center gap-3 mb-4">
              <HelpCircle className="w-6 h-6 text-primary" />
              <h2 className="text-xl font-semibold text-foreground">
                What We Can Help With
              </h2>
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              {helpTopics.map((topic) => (
                <div
                  key={topic.title}
                  className="p-4 bg-muted/50 rounded-xl border border-border"
                >
                  <h3 className="font-medium text-foreground mb-1">{topic.title}</h3>
                  <p className="text-sm text-muted-foreground">{topic.description}</p>
                </div>
              ))}
            </div>
          </section>

          {/* Response Time */}
          <section className="mb-10">
            <div className="flex items-center gap-3 mb-3">
              <Clock className="w-6 h-6 text-primary" />
              <h2 className="text-xl font-semibold text-foreground">
                Response Time
              </h2>
            </div>
            <p className="text-muted-foreground">
              We typically respond within 24 hours. During peak commute times, we appreciate your patience as we get back to everyone!
            </p>
          </section>

          {/* Privacy */}
          <section className="mb-10">
            <div className="flex items-center gap-3 mb-3">
              <Shield className="w-6 h-6 text-primary" />
              <h2 className="text-xl font-semibold text-foreground">
                Your Privacy
              </h2>
            </div>
            <p className="text-muted-foreground">
              We only collect the essentials (name and phone number) to help solve your query. Your data is never sold and is handled according to our{" "}
              <a href="/terms#privacy" className="text-primary hover:underline">
                Privacy Policy
              </a>.
            </p>
          </section>

          {/* Safety & Respect */}
          <section className="p-6 bg-muted/30 rounded-2xl border border-border">
            <div className="flex items-center gap-3 mb-3">
              <Heart className="w-6 h-6 text-primary" />
              <h2 className="text-xl font-semibold text-foreground">
                Safety & Respect
              </h2>
            </div>
            <p className="text-muted-foreground">
              Kyra is a community built on mutual respect. We maintain a zero-tolerance policy for abusive language; let's keep our conversations kind and constructive.
            </p>
          </section>
        </motion.div>
      </main>

      <Footer />
    </div>
  );
};

export default Contact;