import { Heart } from "lucide-react";
import kyraLogo from "@/assets/kyra-logo.png";

const Footer = () => {
  return (
    <footer id="contact" className="py-12 border-t border-border/30">
      <div className="kyra-container">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <img src={kyraLogo} alt="Kyra" className="h-8" />
            <span className="text-muted-foreground text-sm">
              By Women, For Women
            </span>
          </div>

          {/* Links */}
          <div className="flex items-center gap-6 text-sm text-muted-foreground">
            <a href="#home" className="hover:text-foreground transition-colors">
              Home
            </a>
            <a href="#about" className="hover:text-foreground transition-colors">
              About
            </a>
            <a href="#booking" className="hover:text-foreground transition-colors">
              Book Ride
            </a>
          </div>

          {/* Copyright */}
          <div className="flex items-center gap-1 text-sm text-muted-foreground">
            <span>Made with</span>
            <Heart className="w-4 h-4 text-accent fill-accent" />
            <span>in Bangalore</span>
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-border/20 text-center text-xs text-muted-foreground">
          © {new Date().getFullYear()} Kyra. All rights reserved.
        </div>
      </div>
    </footer>
  );
};

export default Footer;
