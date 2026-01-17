import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

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

// Format phone - extract 10 digit Indian number
function formatPhone(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  
  // If it has country code, remove it
  if (digits.startsWith("91") && digits.length === 12) {
    return digits.slice(2);
  }
  
  // Return last 10 digits
  if (digits.length >= 10) {
    return digits.slice(-10);
  }
  
  return digits;
}

async function sendFast2SMS(phone: string, otp: string): Promise<boolean> {
  const apiKey = Deno.env.get("FAST2SMS_API_KEY");

  if (!apiKey) {
    console.error("Fast2SMS API key not configured");
    return false;
  }

  const url = "https://www.fast2sms.com/dev/bulkV2";

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "authorization": apiKey,
        "Content-Type": "application/json",
        "Accept": "*/*",
        "Cache-Control": "no-cache",
      },
      body: JSON.stringify({
        route: "otp",
        variables_values: otp,
        numbers: phone,
      }),
    });

    const result = await response.json();

    if (!response.ok || result.return === false) {
      console.error("Fast2SMS error:", result);
      return false;
    }

    console.log("SMS sent successfully via Fast2SMS:", result);
    return true;
  } catch (error) {
    console.error("Failed to send SMS:", error);
    return false;
  }
}

function getSupabaseClient() {
  return createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
  );
}

async function handleSendOtp(phone: string, name: string): Promise<Response> {
  if (!phone || !name) {
    return new Response(
      JSON.stringify({ error: "Phone and name are required" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  const formattedPhone = formatPhone(phone);
  if (formattedPhone.length !== 10) {
    return new Response(
      JSON.stringify({ error: "Invalid phone number. Please enter a 10-digit Indian mobile number." }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  const otp = generateOTP();
  const expiresAt = new Date(Date.now() + 5 * 60 * 1000).toISOString(); // 5 minutes

  const supabase = getSupabaseClient();

  // Delete any existing OTPs for this phone
  await supabase
    .from("otp_verifications")
    .delete()
    .eq("phone", formattedPhone);

  // Insert new OTP
  const { error: insertError } = await supabase
    .from("otp_verifications")
    .insert({
      phone: formattedPhone,
      otp,
      name,
      expires_at: expiresAt,
    });

  if (insertError) {
    console.error("Failed to store OTP:", insertError);
    return new Response(
      JSON.stringify({ error: "Failed to generate OTP. Please try again." }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  // Send SMS via Fast2SMS
  const sent = await sendFast2SMS(formattedPhone, otp);

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

async function handleVerifyOtp(phone: string, otp: string): Promise<Response> {
  if (!phone || !otp) {
    return new Response(
      JSON.stringify({ error: "Phone and OTP are required" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  const formattedPhone = formatPhone(phone);
  const supabase = getSupabaseClient();

  // Find the OTP record
  const { data: otpRecord, error: fetchError } = await supabase
    .from("otp_verifications")
    .select("*")
    .eq("phone", formattedPhone)
    .eq("verified", false)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (fetchError) {
    console.error("Failed to fetch OTP:", fetchError);
    return new Response(
      JSON.stringify({ error: "Verification failed. Please try again." }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  if (!otpRecord) {
    return new Response(
      JSON.stringify({ error: "OTP not found or expired. Please request a new one." }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  // Check expiration
  if (new Date(otpRecord.expires_at) < new Date()) {
    await supabase.from("otp_verifications").delete().eq("id", otpRecord.id);
    return new Response(
      JSON.stringify({ error: "OTP expired. Please request a new one." }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  // Verify OTP
  if (otpRecord.otp !== otp) {
    return new Response(
      JSON.stringify({ error: "Invalid OTP. Please try again." }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  // Mark as verified and delete
  await supabase.from("otp_verifications").delete().eq("id", otpRecord.id);

  console.log(`OTP verified for ${formattedPhone}`);

  return new Response(
    JSON.stringify({ 
      success: true, 
      message: "OTP verified successfully",
      name: otpRecord.name,
      phone: formattedPhone
    }),
    { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
}

serve(async (req: Request): Promise<Response> => {
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
      return await handleVerifyOtp(phone, otp);
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
