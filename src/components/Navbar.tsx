import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X } from "lucide-react";
import kyraLogo from "@/assets/kyra-logo-dark.png";

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const navLinks = [
    { href: "#faq", label: "FAQ", isAnchor: true },
    { href: "/contact", label: "Contact", isAnchor: false },
  ];

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
            {navLinks.map((link) =>
              link.isAnchor ? (
                <a
                  key={link.href}
                  href={link.href}
                  className="text-foreground/70 hover:text-foreground transition-colors duration-200 font-medium"
                >
                  {link.label}
                </a>
              ) : (
                <Link
                  key={link.href}
                  to={link.href}
                  className="text-foreground/70 hover:text-foreground transition-colors duration-200 font-medium"
                >
                  {link.label}
                </Link>
              )
            )}
            <Link
              to="/subscribe"
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
              {navLinks.map((link) =>
                link.isAnchor ? (
                  <a
                    key={link.href}
                    href={link.href}
                    className="text-foreground/70 hover:text-foreground transition-colors py-2 font-medium"
                    onClick={() => setIsOpen(false)}
                  >
                    {link.label}
                  </a>
                ) : (
                  <Link
                    key={link.href}
                    to={link.href}
                    className="text-foreground/70 hover:text-foreground transition-colors py-2 font-medium"
                    onClick={() => setIsOpen(false)}
                  >
                    {link.label}
                  </Link>
                )
              )}
              <Link
                to="/subscribe"
                onClick={() => setIsOpen(false)}
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
