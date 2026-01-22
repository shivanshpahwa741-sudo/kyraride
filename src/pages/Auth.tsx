import { useState, useEffect, useCallback } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, User, Phone, Loader2, ArrowRight, ShieldCheck, UserPlus, LogIn, Lock, KeyRound } from "lucide-react";
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

type AuthMode = "signup" | "login";
type AuthStep = "details" | "otp" | "pin_login" | "set_pin";

const RESEND_COOLDOWN = 30; // 30 seconds cooldown

const Auth = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  
  const [mode, setMode] = useState<AuthMode>("login");
  const [step, setStep] = useState<AuthStep>("details");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [pin, setPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [hasPin, setHasPin] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [errors, setErrors] = useState<{ name?: string; phone?: string }>({});
  const [resendCooldown, setResendCooldown] = useState(0);
  const [sessionToken, setSessionToken] = useState<string | null>(null);

  // Cooldown timer effect
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (resendCooldown > 0) {
      timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [resendCooldown]);

  const validateDetails = (): boolean => {
    const newErrors: { name?: string; phone?: string } = {};
    
    if (mode === "signup") {
      const nameResult = nameSchema.safeParse(name);
      if (!nameResult.success) {
        newErrors.name = nameResult.error.errors[0].message;
      }
    }
    
    const phoneResult = phoneSchema.safeParse(phone);
    if (!phoneResult.success) {
      newErrors.phone = phoneResult.error.errors[0].message;
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const checkUserAndPin = async () => {
    if (!validateDetails()) return;
    
    setIsLoading(true);
    
    try {
      // Check if user exists and has PIN
      const { data, error } = await supabase.functions.invoke("auth-session", {
        body: { action: "check_pin", phone },
      });
      
      if (error) throw new Error("Failed to check account");
      
      if (mode === "login") {
        if (!data?.exists) {
          toast.error("No account found with this number. Please sign up first.");
          setIsLoading(false);
          return;
        }
        
        if (data?.hasPin) {
          // User has PIN - show PIN login
          setHasPin(true);
          setStep("pin_login");
          setIsLoading(false);
          return;
        }
      }
      
      // Proceed with OTP flow
      await handleSendOtp();
    } catch (error: any) {
      console.error("Check user error:", error);
      toast.error(error.message || "Failed to check account");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendOtp = async () => {
    if (!validateDetails()) return;
    
    setIsSendingOtp(true);
    
    try {
      // For login without PIN, check if user exists first
      if (mode === "login" && !hasPin) {
        const { data: checkData, error: checkError } = await supabase.functions.invoke("send-otp", {
          body: { phone, action: "check" },
        });
        
        if (checkError) {
          console.error("Check user error:", checkError);
          throw new Error("Failed to check account. Please try again.");
        }
        
        if (!checkData?.exists) {
          toast.error("No account found with this number. Please sign up first.");
          setIsSendingOtp(false);
          return;
        }
      }

      const { data, error } = await supabase.functions.invoke("send-otp", {
        body: { phone, name: mode === "signup" ? name : undefined, action: "send" },
      });

      if (error) {
        const errorMsg = data?.error || "Failed to send OTP. Please try again.";
        throw new Error(errorMsg);
      }

      if (!data?.success) {
        throw new Error(data?.error || "Failed to send OTP");
      }

      toast.success("OTP sent to your phone!");
      setStep("otp");
      setResendCooldown(RESEND_COOLDOWN);
    } catch (error: any) {
      console.error("Send OTP error:", error);
      toast.error(error.message || "Failed to send OTP. Please try again.");
    } finally {
      setIsSendingOtp(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (otp.length !== 6) {
      toast.error("Please enter the complete 6-digit OTP");
      return;
    }
    
    setIsVerifying(true);
    
    try {
      const { data, error } = await supabase.functions.invoke("send-otp", {
        body: { phone, otp, name: mode === "signup" ? name : undefined, action: "verify", isSignup: mode === "signup" },
      });

      if (error) {
        const errorMsg = data?.error || "Verification failed. Please try again.";
        throw new Error(errorMsg);
      }

      if (!data?.success) {
        throw new Error(data?.error || "Invalid OTP");
      }

      // Get the verified user data
      const finalName = data.name || name;
      const finalPhone = data.phone || phone;
      
      // Login using the new session system
      await login(finalName, finalPhone);
      
      // Store session token for PIN setup
      const token = localStorage.getItem("kyra_session_token");
      setSessionToken(token);
      
      // Sync user to Google Sheets
      syncUserToSheets(finalPhone, finalName).catch(err => 
        console.error("Failed to sync user to sheets:", err)
      );
      
      // Check if user has PIN - if not, prompt to set one
      const { data: pinCheck } = await supabase.functions.invoke("auth-session", {
        body: { action: "check_pin", phone: finalPhone },
      });
      
      if (!pinCheck?.hasPin) {
        toast.success(mode === "signup" ? "Account created!" : "Welcome back!");
        setStep("set_pin");
      } else {
        toast.success(mode === "signup" ? "Account created successfully!" : "Welcome back!");
        navigate("/subscribe");
      }
    } catch (error: any) {
      console.error("Verify OTP error:", error);
      toast.error(error.message || "Invalid OTP. Please try again.");
    } finally {
      setIsVerifying(false);
    }
  };

  const handlePinLogin = async () => {
    if (pin.length !== 4) {
      toast.error("Please enter your 4-digit PIN");
      return;
    }
    
    setIsVerifying(true);
    
    try {
      const { data, error } = await supabase.functions.invoke("auth-session", {
        body: { action: "verify_pin", phone, pin },
      });
      
      if (error) throw new Error(data?.error || "Login failed");
      
      if (!data?.success) {
        throw new Error(data?.error || "Invalid PIN");
      }
      
      // Store session token
      if (data.sessionToken) {
        localStorage.setItem("kyra_session_token", data.sessionToken);
      }
      
      // Login
      await login(data.user.name, data.user.phone);
      
      toast.success("Welcome back!");
      navigate("/subscribe");
    } catch (error: any) {
      console.error("PIN login error:", error);
      toast.error(error.message || "Incorrect PIN. Please try again.");
    } finally {
      setIsVerifying(false);
    }
  };

  const handleSetPin = async () => {
    if (pin.length !== 4) {
      toast.error("Please enter a 4-digit PIN");
      return;
    }
    
    if (pin !== confirmPin) {
      toast.error("PINs don't match. Please try again.");
      return;
    }
    
    setIsLoading(true);
    
    try {
      const token = sessionToken || localStorage.getItem("kyra_session_token");
      
      const { data, error } = await supabase.functions.invoke("auth-session", {
        body: { action: "set_pin", sessionToken: token, pin },
      });
      
      if (error) throw new Error("Failed to set PIN");
      
      if (!data?.success) {
        throw new Error(data?.error || "Failed to set PIN");
      }
      
      toast.success("PIN set successfully! You can now use it for quick login.");
      navigate("/subscribe");
    } catch (error: any) {
      console.error("Set PIN error:", error);
      toast.error(error.message || "Failed to set PIN");
    } finally {
      setIsLoading(false);
    }
  };

  const skipPinSetup = () => {
    toast.info("You can set up a PIN later from your profile.");
    navigate("/subscribe");
  };

  const handleResendOtp = useCallback(async () => {
    if (resendCooldown > 0 || isLoading) return;
    
    setIsLoading(true);
    
    try {
      const { data, error } = await supabase.functions.invoke("send-otp", {
        body: { phone, name: mode === "signup" ? name : undefined, action: "send" },
      });

      if (error) {
        const errorMsg = data?.error || "Failed to resend OTP. Please try again.";
        throw new Error(errorMsg);
      }

      if (!data?.success) {
        throw new Error(data?.error || "Failed to resend OTP");
      }

      toast.success("OTP resent successfully!");
      setOtp("");
      setResendCooldown(RESEND_COOLDOWN);
    } catch (error: any) {
      console.error("Resend OTP error:", error);
      toast.error(error.message || "Failed to resend OTP");
    } finally {
      setIsLoading(false);
    }
  }, [phone, name, mode, resendCooldown, isLoading]);

  const switchMode = () => {
    setMode(mode === "login" ? "signup" : "login");
    setStep("details");
    setOtp("");
    setPin("");
    setConfirmPin("");
    setHasPin(false);
    setErrors({});
  };

  const goBackToDetails = () => {
    setStep("details");
    setOtp("");
    setPin("");
    setConfirmPin("");
    setResendCooldown(0);
    setHasPin(false);
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
                    {mode === "signup" ? (
                      <UserPlus className="h-8 w-8 text-accent" />
                    ) : (
                      <LogIn className="h-8 w-8 text-accent" />
                    )}
                  </div>
                  <h1 className="font-display text-2xl font-bold text-foreground">
                    {mode === "signup" ? "Create Account" : "Welcome Back"}
                  </h1>
                  <p className="text-muted-foreground">
                    {mode === "signup" 
                      ? "Enter your details to get started" 
                      : "Enter your phone number to continue"}
                  </p>
                </div>

                {/* Form */}
                <div className="space-y-4">
                  {mode === "signup" && (
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
                  )}

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
                  onClick={checkUserAndPin}
                  disabled={isSendingOtp || isLoading}
                  className="w-full kyra-btn-primary py-6 text-lg"
                >
                  {isSendingOtp || isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      Please wait...
                    </>
                  ) : (
                    <>
                      Continue
                      <ArrowRight className="ml-2 h-5 w-5" />
                    </>
                  )}
                </Button>

                <p className="text-xs text-center text-muted-foreground">
                  {mode === "login" 
                    ? "Use your PIN or OTP to log in" 
                    : "We'll send a verification code to your phone"}
                </p>

                {/* Switch Mode */}
                <div className="pt-4 border-t border-border/30">
                  <p className="text-center text-sm text-muted-foreground">
                    {mode === "signup" ? (
                      <>
                        Already have an account?{" "}
                        <button
                          onClick={switchMode}
                          className="text-accent hover:underline font-medium"
                        >
                          Log in
                        </button>
                      </>
                    ) : (
                      <>
                        New to KYRA?{" "}
                        <button
                          onClick={switchMode}
                          className="text-accent hover:underline font-medium"
                        >
                          Sign up
                        </button>
                      </>
                    )}
                  </p>
                </div>
              </motion.div>
            ) : step === "pin_login" ? (
              <motion.div
                key="pin_login"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                {/* Header */}
                <div className="text-center space-y-2">
                  <div className="w-16 h-16 mx-auto bg-accent/10 rounded-full flex items-center justify-center mb-4">
                    <Lock className="h-8 w-8 text-accent" />
                  </div>
                  <h1 className="font-display text-2xl font-bold text-foreground">
                    Enter Your PIN
                  </h1>
                  <p className="text-muted-foreground">
                    Enter your 4-digit PIN to log in
                    <br />
                    <span className="text-foreground font-medium">+91 {phone}</span>
                  </p>
                </div>

                {/* PIN Input */}
                <div className="flex justify-center">
                  <InputOTP
                    value={pin}
                    onChange={setPin}
                    maxLength={4}
                  >
                    <InputOTPGroup>
                      <InputOTPSlot index={0} />
                      <InputOTPSlot index={1} />
                      <InputOTPSlot index={2} />
                      <InputOTPSlot index={3} />
                    </InputOTPGroup>
                  </InputOTP>
                </div>

                {/* Actions */}
                <div className="space-y-3">
                  <Button
                    onClick={handlePinLogin}
                    disabled={isVerifying || pin.length !== 4}
                    className="w-full kyra-btn-primary py-6 text-lg"
                  >
                    {isVerifying ? (
                      <>
                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                        Verifying...
                      </>
                    ) : (
                      "Log In"
                    )}
                  </Button>

                  <div className="flex items-center justify-between">
                    <Button
                      variant="ghost"
                      onClick={goBackToDetails}
                      className="text-muted-foreground hover:text-foreground"
                    >
                      <ArrowLeft className="mr-2 h-4 w-4" />
                      Change Number
                    </Button>

                    <Button
                      variant="ghost"
                      onClick={() => {
                        setPin("");
                        handleSendOtp();
                      }}
                      disabled={isSendingOtp}
                      className="text-accent hover:text-accent/80"
                    >
                      {isSendingOtp ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        "Use OTP instead"
                      )}
                    </Button>
                  </div>
                </div>
              </motion.div>
            ) : step === "otp" ? (
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
                    disabled={isVerifying || otp.length !== 6}
                    className="w-full kyra-btn-primary py-6 text-lg"
                  >
                    {isVerifying ? (
                      <>
                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                        Verifying...
                      </>
                    ) : (
                      mode === "signup" ? "Create Account" : "Log In"
                    )}
                  </Button>

                  <div className="flex items-center justify-between">
                    <Button
                      variant="ghost"
                      onClick={goBackToDetails}
                      disabled={isSendingOtp || isVerifying}
                      className="text-muted-foreground hover:text-foreground"
                    >
                      <ArrowLeft className="mr-2 h-4 w-4" />
                      Change Number
                    </Button>

                    <Button
                      variant="ghost"
                      onClick={handleResendOtp}
                      disabled={isLoading || resendCooldown > 0}
                      className="text-accent hover:text-accent/80 disabled:text-muted-foreground"
                    >
                      {isLoading ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : resendCooldown > 0 ? (
                        `Resend in ${resendCooldown}s`
                      ) : (
                        "Resend OTP"
                      )}
                    </Button>
                  </div>
                </div>
              </motion.div>
            ) : step === "set_pin" ? (
              <motion.div
                key="set_pin"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                {/* Header */}
                <div className="text-center space-y-2">
                  <div className="w-16 h-16 mx-auto bg-accent/10 rounded-full flex items-center justify-center mb-4">
                    <KeyRound className="h-8 w-8 text-accent" />
                  </div>
                  <h1 className="font-display text-2xl font-bold text-foreground">
                    Set Your PIN
                  </h1>
                  <p className="text-muted-foreground">
                    Create a 4-digit PIN for quick login next time
                  </p>
                </div>

                {/* PIN Input */}
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground text-center block">
                      Enter PIN
                    </label>
                    <div className="flex justify-center">
                      <InputOTP
                        value={pin}
                        onChange={setPin}
                        maxLength={4}
                      >
                        <InputOTPGroup>
                          <InputOTPSlot index={0} />
                          <InputOTPSlot index={1} />
                          <InputOTPSlot index={2} />
                          <InputOTPSlot index={3} />
                        </InputOTPGroup>
                      </InputOTP>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground text-center block">
                      Confirm PIN
                    </label>
                    <div className="flex justify-center">
                      <InputOTP
                        value={confirmPin}
                        onChange={setConfirmPin}
                        maxLength={4}
                      >
                        <InputOTPGroup>
                          <InputOTPSlot index={0} />
                          <InputOTPSlot index={1} />
                          <InputOTPSlot index={2} />
                          <InputOTPSlot index={3} />
                        </InputOTPGroup>
                      </InputOTP>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="space-y-3">
                  <Button
                    onClick={handleSetPin}
                    disabled={isLoading || pin.length !== 4 || confirmPin.length !== 4}
                    className="w-full kyra-btn-primary py-6 text-lg"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                        Setting PIN...
                      </>
                    ) : (
                      "Set PIN & Continue"
                    )}
                  </Button>

                  <Button
                    variant="ghost"
                    onClick={skipPinSetup}
                    className="w-full text-muted-foreground hover:text-foreground"
                  >
                    Skip for now
                  </Button>
                </div>
              </motion.div>
            ) : null}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
};

export default Auth;
