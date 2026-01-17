import Navbar from "@/components/Navbar";
import HeroSection from "@/components/HeroSection";
import SubscriptionSection from "@/components/SubscriptionSection";
import ServiceCardsSection from "@/components/ServiceCardsSection";
import BookingRulesSection from "@/components/BookingRulesSection";
import FAQSection from "@/components/FAQSection";
import CTASection from "@/components/CTASection";
import Footer from "@/components/Footer";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main>
        <HeroSection />
        <SubscriptionSection />
        <ServiceCardsSection />
        <BookingRulesSection />
        <FAQSection />
        <CTASection />
      </main>
      <Footer />
    </div>
  );
};

export default Index;
