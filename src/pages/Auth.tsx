import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "react-router-dom";
import { ArrowLeft, User, Phone, Loader2, ArrowRight, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { syncUserToSheets } from "@/lib/google-sheets";
// Validation schemas
const nameSchema = z.string().trim().min(2, "Name must be at least 2 characters").max(50, "Name too long");
const phoneSchema = z.string().regex(/^[6-9]\d{9}$/, "Enter a valid 10-digit Indian mobile number");

type AuthStep = "details" | "otp";

const Auth = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  
  const [step, setStep] = useState<AuthStep>("details");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<{ name?: string; phone?: string }>({});

  const validateDetails = (): boolean => {
    const newErrors: { name?: string; phone?: string } = {};
    
    const nameResult = nameSchema.safeParse(name);
    if (!nameResult.success) {
      newErrors.name = nameResult.error.errors[0].message;
    }
    
    const phoneResult = phoneSchema.safeParse(phone);
    if (!phoneResult.success) {
      newErrors.phone = phoneResult.error.errors[0].message;
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSendOtp = async () => {
    if (!validateDetails()) return;
    
    setIsLoading(true);
    
    try {
      const { data, error } = await supabase.functions.invoke("send-otp", {
        body: { phone, name, action: "send" },
      });

      if (error) {
        throw new Error((data as any)?.error || error.message || "Failed to send OTP");
      }

      if (!data?.success) {
        throw new Error((data as any)?.error || "Failed to send OTP");
      }

      toast.success("OTP sent to your phone!");
      setStep("otp");
    } catch (error: any) {
      console.error("Send OTP error:", error);
      toast.error(error.message || "Failed to send OTP. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (otp.length !== 6) {
      toast.error("Please enter the complete 6-digit OTP");
      return;
    }
    
    setIsLoading(true);
    
    try {
      const { data, error } = await supabase.functions.invoke("send-otp", {
        body: { phone, otp, action: "verify" },
      });

      if (error) {
        throw new Error((data as any)?.error || error.message || "Verification failed");
      }

      if (!data?.success) {
        throw new Error((data as any)?.error || "Invalid OTP");
      }

      // Auto-login/signup successful - login handles both cases
      const finalName = data.name || name;
      const finalPhone = data.phone || phone;
      
      login(finalName, finalPhone);
      
      // Sync user to Google Sheets
      syncUserToSheets(finalPhone, finalName).catch(err => 
        console.error("Failed to sync user to sheets:", err)
      );
      
      toast.success("Welcome to KYRA!");
      navigate("/subscribe");
    } catch (error: any) {
      console.error("Verify OTP error:", error);
      toast.error(error.message || "Invalid OTP. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendOtp = async () => {
    setIsLoading(true);
    
    try {
      const { data, error } = await supabase.functions.invoke("send-otp", {
        body: { phone, name, action: "send" },
      });

      if (error) {
        throw new Error((data as any)?.error || error.message || "Failed to resend OTP");
      }

      if (!data?.success) {
        throw new Error((data as any)?.error || "Failed to resend OTP");
      }

      toast.success("OTP resent successfully!");
      setOtp("");
    } catch (error: any) {
      console.error("Resend OTP error:", error);
      toast.error(error.message || "Failed to resend OTP");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-md border-b border-border/20">
        <div className="kyra-container">
          <div className="flex items-center justify-between h-16">
            <Link
              to="/"
              className="flex items-center gap-2 text-foreground/70 hover:text-foreground transition-colors"
            >
              <ArrowLeft className="h-5 w-5" />
              <span className="font-medium">Back</span>
            </Link>
            <span className="font-display text-lg font-semibold text-foreground">
              KYRA
            </span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <div className="kyra-glass rounded-2xl p-8">
          <AnimatePresence mode="wait">
            {step === "details" ? (
              <motion.div
                key="details"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="space-y-6"
              >
                {/* Header */}
                <div className="text-center space-y-2">
                  <div className="w-16 h-16 mx-auto bg-accent/10 rounded-full flex items-center justify-center mb-4">
                    <User className="h-8 w-8 text-accent" />
                  </div>
                  <h1 className="font-display text-2xl font-bold text-foreground">
                    Sign In to KYRA
                  </h1>
                  <p className="text-muted-foreground">
                    Enter your details to continue
                  </p>
                </div>

                {/* Form */}
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">
                      Full Name
                    </label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                      <Input
                        type="text"
                        placeholder="Enter your full name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="pl-10 bg-input border-border/50 text-foreground placeholder:text-muted-foreground focus:border-accent"
                      />
                    </div>
                    {errors.name && (
                      <p className="text-sm text-destructive">{errors.name}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">
                      Phone Number
                    </label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                      <div className="absolute left-10 top-1/2 -translate-y-1/2 text-muted-foreground text-sm border-r border-border/50 pr-2">
                        +91
                      </div>
                      <Input
                        type="tel"
                        placeholder="10-digit mobile number"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
                        className="pl-20 bg-input border-border/50 text-foreground placeholder:text-muted-foreground focus:border-accent"
                        maxLength={10}
                      />
                    </div>
                    {errors.phone && (
                      <p className="text-sm text-destructive">{errors.phone}</p>
                    )}
                  </div>
                </div>

                {/* Submit */}
                <Button
                  onClick={handleSendOtp}
                  disabled={isLoading}
                  className="w-full kyra-btn-primary py-6 text-lg"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      Sending OTP...
                    </>
                  ) : (
                    <>
                      Continue
                      <ArrowRight className="ml-2 h-5 w-5" />
                    </>
                  )}
                </Button>

                <p className="text-xs text-center text-muted-foreground">
                  We'll send a verification code to your phone
                </p>
              </motion.div>
            ) : (
              <motion.div
                key="otp"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                {/* Header */}
                <div className="text-center space-y-2">
                  <div className="w-16 h-16 mx-auto bg-accent/10 rounded-full flex items-center justify-center mb-4">
                    <ShieldCheck className="h-8 w-8 text-accent" />
                  </div>
                  <h1 className="font-display text-2xl font-bold text-foreground">
                    Verify Your Number
                  </h1>
                  <p className="text-muted-foreground">
                    Enter the 6-digit code sent to
                    <br />
                    <span className="text-foreground font-medium">+91 {phone}</span>
                  </p>
                </div>

                {/* OTP Input */}
                <div className="flex justify-center">
                  <InputOTP
                    value={otp}
                    onChange={setOtp}
                    maxLength={6}
                  >
                    <InputOTPGroup>
                      <InputOTPSlot index={0} />
                      <InputOTPSlot index={1} />
                      <InputOTPSlot index={2} />
                      <InputOTPSlot index={3} />
                      <InputOTPSlot index={4} />
                      <InputOTPSlot index={5} />
                    </InputOTPGroup>
                  </InputOTP>
                </div>

                {/* Actions */}
                <div className="space-y-3">
                  <Button
                    onClick={handleVerifyOtp}
                    disabled={isLoading || otp.length !== 6}
                    className="w-full kyra-btn-primary py-6 text-lg"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                        Verifying...
                      </>
                    ) : (
                      "Verify & Continue"
                    )}
                  </Button>

                  <div className="flex items-center justify-between">
                    <Button
                      variant="ghost"
                      onClick={() => {
                        setStep("details");
                        setOtp("");
                      }}
                      className="text-muted-foreground hover:text-foreground"
                    >
                      <ArrowLeft className="mr-2 h-4 w-4" />
                      Change Number
                    </Button>

                    <Button
                      variant="ghost"
                      onClick={handleResendOtp}
                      disabled={isLoading}
                      className="text-accent hover:text-accent/80"
                    >
                      Resend OTP
                    </Button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
};

export default Auth;
