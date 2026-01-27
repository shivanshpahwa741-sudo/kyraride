import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface CreateOrderRequest {
  amount: number; // Amount in INR
  currency?: string;
  receipt?: string;
  notes?: Record<string, string>;
}

interface VerifyPaymentRequest {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}

// Function to create HMAC SHA256 signature
async function createHmacSha256(key: string, message: string): Promise<string> {
  const encoder = new TextEncoder();
  const keyData = encoder.encode(key);
  const messageData = encoder.encode(message);
  
  const cryptoKey = await crypto.subtle.importKey(
    "raw",
    keyData,
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  
  const signature = await crypto.subtle.sign("HMAC", cryptoKey, messageData);
  return Array.from(new Uint8Array(signature))
    .map(b => b.toString(16).padStart(2, "0"))
    .join("");
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const RAZORPAY_KEY_ID = Deno.env.get("RAZORPAY_KEY_ID");
    const RAZORPAY_KEY_SECRET = Deno.env.get("RAZORPAY_KEY_SECRET");

    if (!RAZORPAY_KEY_ID || !RAZORPAY_KEY_SECRET) {
      console.error("Missing Razorpay credentials");
      return new Response(
        JSON.stringify({ error: "Payment configuration error" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const url = new URL(req.url);
    const action = url.pathname.split("/").pop();

    if (req.method === "POST" && action === "create-order") {
      const body: CreateOrderRequest & { phone?: string } = await req.json();
      
      if (!body.amount || body.amount <= 0) {
        return new Response(
          JSON.stringify({ error: "Invalid amount" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Validate amount range (₹10 to ₹50,000)
      if (body.amount < 10 || body.amount > 50000) {
        return new Response(
          JSON.stringify({ error: "Amount must be between ₹10 and ₹50,000" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Require phone number for authentication
      if (!body.phone) {
        return new Response(
          JSON.stringify({ error: "Phone number required for payment" }),
          { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Format and validate phone
      const phoneDigits = body.phone.replace(/\D/g, "");
      const formattedPhone = phoneDigits.slice(-10);

      if (formattedPhone.length !== 10 || !/^[6-9]\d{9}$/.test(formattedPhone)) {
        return new Response(
          JSON.stringify({ error: "Invalid phone number" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Create Supabase client and verify user exists
      const supabase = createClient(
        Deno.env.get("SUPABASE_URL") ?? "",
        Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
      );

      // Verify user has completed phone verification
      const { data: profile } = await supabase
        .from("profiles")
        .select("id, name")
        .eq("phone", formattedPhone)
        .maybeSingle();

      if (!profile) {
        return new Response(
          JSON.stringify({ error: "Please complete phone verification before making payment" }),
          { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Validate and sanitize notes
      if (body.notes) {
        const noteKeys = Object.keys(body.notes);
        if (noteKeys.length > 10) {
          return new Response(
            JSON.stringify({ error: "Too many note fields" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
        for (const key of noteKeys) {
          if (key.length > 50 || (typeof body.notes[key] === 'string' && body.notes[key].length > 200)) {
            return new Response(
              JSON.stringify({ error: "Note field too long" }),
              { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
          }
        }
      }

      console.log(`Creating order for verified user: ${profile.name} (${formattedPhone})`);


      // Convert to paise (Razorpay expects amount in smallest currency unit)
      const amountInPaise = Math.round(body.amount * 100);

      console.log(`Creating Razorpay order for amount: ₹${body.amount} (${amountInPaise} paise)`);

      // Create order using Razorpay API
      const auth = btoa(`${RAZORPAY_KEY_ID}:${RAZORPAY_KEY_SECRET}`);
      
      const orderResponse = await fetch("https://api.razorpay.com/v1/orders", {
        method: "POST",
        headers: {
          "Authorization": `Basic ${auth}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          amount: amountInPaise,
          currency: body.currency || "INR",
          receipt: body.receipt || `receipt_${Date.now()}`,
          notes: body.notes || {},
        }),
      });

      if (!orderResponse.ok) {
        const errorData = await orderResponse.text();
        console.error("Razorpay order creation failed:", errorData);
        return new Response(
          JSON.stringify({ error: "Failed to create order" }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const orderData = await orderResponse.json();
      console.log("Order created successfully:", orderData.id);

      return new Response(
        JSON.stringify({
          orderId: orderData.id,
          amount: orderData.amount,
          currency: orderData.currency,
          keyId: RAZORPAY_KEY_ID,
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (req.method === "POST" && action === "verify-payment") {
      const body: VerifyPaymentRequest = await req.json();
      
      if (!body.razorpay_order_id || !body.razorpay_payment_id || !body.razorpay_signature) {
        return new Response(
          JSON.stringify({ error: "Missing payment verification data" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      console.log(`Verifying payment: ${body.razorpay_payment_id} for order: ${body.razorpay_order_id}`);

      // Generate expected signature
      const message = `${body.razorpay_order_id}|${body.razorpay_payment_id}`;
      const expectedSignature = await createHmacSha256(RAZORPAY_KEY_SECRET, message);

      // Compare signatures
      if (expectedSignature !== body.razorpay_signature) {
        console.error("Payment signature verification failed");
        return new Response(
          JSON.stringify({ error: "Payment verification failed", verified: false }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      console.log("Payment verified successfully");

      return new Response(
        JSON.stringify({ 
          verified: true, 
          paymentId: body.razorpay_payment_id,
          orderId: body.razorpay_order_id 
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ error: "Invalid endpoint" }),
      { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error: unknown) {
    console.error("Error in razorpay-payment function:", error);
    const errorMessage = error instanceof Error ? error.message : "Internal server error";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
