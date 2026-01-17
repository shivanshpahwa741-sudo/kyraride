import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Store OTPs temporarily (in production, use Redis or similar)
const otpStore = new Map<string, { otp: string; expires: number; name: string }>();

interface SendOtpRequest {
  phone: string;
  name: string;
  action: "send";
}

interface VerifyOtpRequest {
  phone: string;
  otp: string;
  action: "verify";
}

type OtpRequest = SendOtpRequest | VerifyOtpRequest;

// Generate a 6-digit OTP
function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// Format phone to E.164 format for India
function formatPhone(phone: string): string {
  // Remove all non-digit characters
  const digits = phone.replace(/\D/g, "");
  
  // If it's already 12 digits with country code
  if (digits.startsWith("91") && digits.length === 12) {
    return `+${digits}`;
  }
  
  // If it's 10 digits (Indian number without country code)
  if (digits.length === 10) {
    return `+91${digits}`;
  }
  
  // If it starts with + and is valid
  if (phone.startsWith("+") && digits.length >= 10) {
    return phone;
  }
  
  return `+91${digits}`;
}

async function sendTwilioSMS(to: string, body: string): Promise<boolean> {
  const accountSid = Deno.env.get("TWILIO_ACCOUNT_SID");
  const authToken = Deno.env.get("TWILIO_AUTH_TOKEN");
  const fromNumber = Deno.env.get("TWILIO_PHONE_NUMBER");

  if (!accountSid || !authToken || !fromNumber) {
    console.error("Twilio credentials not configured");
    return false;
  }

  const url = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`;

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: `Basic ${btoa(`${accountSid}:${authToken}`)}`,
      },
      body: new URLSearchParams({
        To: to,
        From: fromNumber,
        Body: body,
      }),
    });

    const result = await response.json();

    if (!response.ok) {
      console.error("Twilio error:", result);
      return false;
    }

    console.log("SMS sent successfully:", result.sid);
    return true;
  } catch (error) {
    console.error("Failed to send SMS:", error);
    return false;
  }
}

async function handleSendOtp(phone: string, name: string): Promise<Response> {
  if (!phone || !name) {
    return new Response(
      JSON.stringify({ error: "Phone and name are required" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  // Validate phone (Indian 10-digit number)
  const cleanPhone = phone.replace(/\D/g, "");
  if (cleanPhone.length < 10) {
    return new Response(
      JSON.stringify({ error: "Invalid phone number" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  const formattedPhone = formatPhone(phone);
  const otp = generateOTP();
  const expires = Date.now() + 5 * 60 * 1000; // 5 minutes

  // Store OTP
  otpStore.set(formattedPhone, { otp, expires, name });

  // Send SMS
  const message = `Your KYRA verification code is: ${otp}. Valid for 5 minutes.`;
  const sent = await sendTwilioSMS(formattedPhone, message);

  if (!sent) {
    return new Response(
      JSON.stringify({ error: "Failed to send OTP. Please try again." }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  console.log(`OTP sent to ${formattedPhone}`);

  return new Response(
    JSON.stringify({ success: true, message: "OTP sent successfully" }),
    { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
}

function handleVerifyOtp(phone: string, otp: string): Response {
  if (!phone || !otp) {
    return new Response(
      JSON.stringify({ error: "Phone and OTP are required" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  const formattedPhone = formatPhone(phone);
  const stored = otpStore.get(formattedPhone);

  if (!stored) {
    return new Response(
      JSON.stringify({ error: "OTP not found or expired. Please request a new one." }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  if (Date.now() > stored.expires) {
    otpStore.delete(formattedPhone);
    return new Response(
      JSON.stringify({ error: "OTP expired. Please request a new one." }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  if (stored.otp !== otp) {
    return new Response(
      JSON.stringify({ error: "Invalid OTP. Please try again." }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  // OTP verified, clear it
  const name = stored.name;
  otpStore.delete(formattedPhone);

  console.log(`OTP verified for ${formattedPhone}`);

  return new Response(
    JSON.stringify({ 
      success: true, 
      message: "OTP verified successfully",
      name,
      phone: formattedPhone
    }),
    { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
}

serve(async (req: Request): Promise<Response> => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body: OtpRequest = await req.json();
    const { action } = body;

    if (action === "send") {
      const { phone, name } = body as SendOtpRequest;
      return await handleSendOtp(phone, name);
    } else if (action === "verify") {
      const { phone, otp } = body as VerifyOtpRequest;
      return handleVerifyOtp(phone, otp);
    } else {
      return new Response(
        JSON.stringify({ error: "Invalid action. Use action: 'send' or 'verify'" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
  } catch (error) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
