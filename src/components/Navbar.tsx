import { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X } from "lucide-react";
import kyraLogo from "@/assets/kyra-logo-dark.png";

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleFaqClick = (e: React.MouseEvent) => {
    e.preventDefault();
    if (location.pathname === "/") {
      // Already on homepage, scroll to FAQ
      const faqSection = document.getElementById("faq");
      if (faqSection) {
        faqSection.scrollIntoView({ behavior: "smooth" });
      }
    } else {
      // Navigate to homepage with FAQ hash
      navigate("/#faq");
    }
    setIsOpen(false);
  };

  const handleNavClick = (href: string) => {
    if (location.pathname === href) {
      // Already on this page, reload it
      window.location.reload();
    }
    setIsOpen(false);
  };

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled ? "bg-background/95 backdrop-blur-md border-b border-border/20" : "bg-transparent"
      }`}
    >
      <div className="kyra-container">
        <div className="flex items-center justify-between h-20 md:h-24">
          {/* Logo */}
          <Link to="/" className="flex items-center">
            <img src={kyraLogo} alt="Kyra" className="h-12 md:h-16" />
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-10">
            <a
              href="/#faq"
              onClick={handleFaqClick}
              className="text-foreground/70 hover:text-foreground transition-colors duration-200 font-medium cursor-pointer"
            >
              FAQ
            </a>
            <Link
              to="/reviews"
              onClick={() => handleNavClick("/reviews")}
              className="text-foreground/70 hover:text-foreground transition-colors duration-200 font-medium"
            >
              Reviews
            </Link>
            <Link
              to="/contact"
              onClick={() => handleNavClick("/contact")}
              className="text-foreground/70 hover:text-foreground transition-colors duration-200 font-medium"
            >
              Contact
            </Link>
            <Link
              to="/subscribe"
              onClick={() => handleNavClick("/subscribe")}
              className="px-6 py-2.5 bg-[hsl(32,35%,87%)] text-[hsl(351,55%,12%)] font-semibold rounded-lg transition-all duration-300 hover:scale-105 hover:shadow-[0_0_20px_rgba(232,216,196,0.4)]"
            >
              Reserve Now
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-2 text-foreground"
            onClick={() => setIsOpen(!isOpen)}
            aria-label="Toggle menu"
          >
            {isOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden bg-background border-b border-border/20"
          >
            <div className="kyra-container py-6 flex flex-col gap-4">
              <a
                href="/#faq"
                onClick={handleFaqClick}
                className="text-foreground/70 hover:text-foreground transition-colors py-2 font-medium cursor-pointer"
              >
                FAQ
              </a>
              <Link
                to="/reviews"
                onClick={() => handleNavClick("/reviews")}
                className="text-foreground/70 hover:text-foreground transition-colors py-2 font-medium"
              >
                Reviews
              </Link>
              <Link
                to="/contact"
                onClick={() => handleNavClick("/contact")}
                className="text-foreground/70 hover:text-foreground transition-colors py-2 font-medium"
              >
                Contact
              </Link>
              <Link
                to="/subscribe"
                onClick={() => handleNavClick("/subscribe")}
                className="mt-4 text-center px-6 py-3 bg-[hsl(32,35%,87%)] text-[hsl(351,55%,12%)] font-semibold rounded-lg hover:shadow-[0_0_20px_rgba(232,216,196,0.4)]"
              >
                Reserve Now
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};

export default Navbar;
