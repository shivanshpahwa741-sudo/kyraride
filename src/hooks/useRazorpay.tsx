import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface RazorpayOptions {
  key: string;
  amount: number;
  currency: string;
  name: string;
  description: string;
  order_id: string;
  prefill: {
    name: string;
    contact: string;
  };
  theme: {
    color: string;
  };
  handler: (response: RazorpayResponse) => void;
  modal?: {
    ondismiss?: () => void;
  };
}

interface RazorpayResponse {
  razorpay_payment_id: string;
  razorpay_order_id: string;
  razorpay_signature: string;
}

interface RazorpayInstance {
  open: () => void;
  close: () => void;
}

declare global {
  interface Window {
    Razorpay: new (options: RazorpayOptions) => RazorpayInstance;
  }
}

interface UseRazorpayProps {
  onSuccess: (paymentId: string, orderId: string) => void;
  onError?: (error: string) => void;
}

export function useRazorpay({ onSuccess, onError }: UseRazorpayProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [isScriptLoaded, setIsScriptLoaded] = useState(false);

  // Load Razorpay script
  useEffect(() => {
    if (window.Razorpay) {
      setIsScriptLoaded(true);
      return;
    }

    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    script.onload = () => setIsScriptLoaded(true);
    script.onerror = () => {
      console.error("Failed to load Razorpay script");
      onError?.("Failed to load payment gateway");
    };
    document.body.appendChild(script);

    return () => {
      // Script cleanup is not needed as it should persist
    };
  }, [onError]);

  const createOrder = useCallback(async (amount: number, phone: string, notes?: Record<string, string>) => {
    try {
      setIsLoading(true);
      
      const { data, error } = await supabase.functions.invoke("razorpay-payment/create-order", {
        body: { amount, phone, notes },
      });

      if (error) {
        throw new Error(error.message || "Failed to create order");
      }

      return data;
    } catch (error: any) {
      console.error("Order creation error:", error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const verifyPayment = useCallback(async (
    razorpay_order_id: string,
    razorpay_payment_id: string,
    razorpay_signature: string
  ) => {
    try {
      const { data, error } = await supabase.functions.invoke("razorpay-payment/verify-payment", {
        body: {
          razorpay_order_id,
          razorpay_payment_id,
          razorpay_signature,
        },
      });

      if (error) {
        throw new Error(error.message || "Payment verification failed");
      }

      return data;
    } catch (error: any) {
      console.error("Payment verification error:", error);
      throw error;
    }
  }, []);

  const initiatePayment = useCallback(async (
    amount: number,
    customerName: string,
    customerPhone: string,
    description: string,
    notes?: Record<string, string>
  ) => {
    if (!isScriptLoaded) {
      toast.error("Payment gateway is loading. Please try again.");
      return;
    }

    try {
      setIsLoading(true);

      // Create order with phone for authentication
      const orderData = await createOrder(amount, customerPhone, notes);
      
      if (!orderData?.orderId || !orderData?.keyId) {
        throw new Error("Invalid order response");
      }

      // Open Razorpay checkout
      const options: RazorpayOptions = {
        key: orderData.keyId,
        amount: orderData.amount,
        currency: orderData.currency || "INR",
        name: "KYRA Rides",
        description,
        order_id: orderData.orderId,
        prefill: {
          name: customerName,
          contact: `+91${customerPhone}`,
        },
        theme: {
          color: "#D4AF37", // Champagne/gold color matching KYRA brand
        },
        handler: async (response: RazorpayResponse) => {
          try {
            // Verify payment
            const verification = await verifyPayment(
              response.razorpay_order_id,
              response.razorpay_payment_id,
              response.razorpay_signature
            );

            if (verification?.verified) {
              onSuccess(response.razorpay_payment_id, response.razorpay_order_id);
            } else {
              onError?.("Payment verification failed");
              toast.error("Payment verification failed. Please contact support.");
            }
          } catch (error) {
            console.error("Verification error:", error);
            onError?.("Payment verification failed");
            toast.error("Payment verification failed. Please contact support.");
          } finally {
            setIsLoading(false);
          }
        },
        modal: {
          ondismiss: () => {
            setIsLoading(false);
            toast.info("Payment cancelled");
          },
        },
      };

      const razorpay = new window.Razorpay(options);
      razorpay.open();
    } catch (error: any) {
      console.error("Payment initiation error:", error);
      setIsLoading(false);
      onError?.(error.message || "Failed to initiate payment");
      toast.error("Failed to initiate payment. Please try again.");
    }
  }, [isScriptLoaded, createOrder, verifyPayment, onSuccess, onError]);

  return {
    initiatePayment,
    isLoading,
    isScriptLoaded,
  };
}
