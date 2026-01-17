import { Link } from "react-router-dom";
import kyraLogo from "@/assets/kyra-logo-dark.png";

const MinimalHeader = () => {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-sm border-b border-border/20">
      <div className="flex items-center justify-center h-20">
        <Link to="/">
          <img 
            src={kyraLogo} 
            alt="Kyra" 
            className="h-14 md:h-16"
          />
        </Link>
      </div>
    </header>
  );
};

export default MinimalHeader;
