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
  
  if (digits.startsWith("91") && digits.length === 12) {
    return digits.slice(2);
  }
  
  if (digits.length >= 10) {
    return digits.slice(-10);
  }
  
  return digits;
}

function toE164India(formattedPhone: string): string {
  return `+91${formattedPhone}`;
}

async function sendTwilioSMS(phoneE164: string, otp: string): Promise<boolean> {
  const accountSid = Deno.env.get("TWILIO_ACCOUNT_SID");
  const authToken = Deno.env.get("TWILIO_AUTH_TOKEN");
  const fromNumber = Deno.env.get("TWILIO_PHONE_NUMBER");

  if (!accountSid || !authToken || !fromNumber) {
    return false;
  }

  const url = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`;
  const body = new URLSearchParams({
    To: phoneE164,
    From: fromNumber,
    Body: `Your KYRA verification code is: ${otp}. Valid for 5 minutes. Do not share this code.`,
  });

  try {
    const basicAuth = btoa(`${accountSid}:${authToken}`);

    const response = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Basic ${basicAuth}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body,
    });

    if (!response.ok) {
      const text = await response.text().catch(() => "");
      console.error("Twilio send error:", response.status, text);
      return false;
    }

    return true;
  } catch (error) {
    console.error("Twilio send exception:", error);
    return false;
  }
}

async function sendFast2SMS(phone: string, otp: string): Promise<boolean> {
  const apiKey = Deno.env.get("FAST2SMS_API_KEY");

  if (!apiKey) {
    return false;
  }

  const url = "https://www.fast2sms.com/dev/bulkV2";
  const message = `Your KYRA verification code is: ${otp}. Valid for 5 minutes. Do not share this code.`;

  try {
    // Using Quick Transactional route (route: "q") which doesn't require OTP verification
    const response = await fetch(url, {
      method: "POST",
      headers: {
        authorization: apiKey,
        "Content-Type": "application/json",
        Accept: "*/*",
        "Cache-Control": "no-cache",
      },
      body: JSON.stringify({
        route: "q", // Quick transactional
        message,
        language: "english",
        flash: 0,
        numbers: phone,
      }),
    });

    const result = await response.json();

    if (!response.ok || result.return === false) {
      console.error("Fast2SMS error:", result);
      console.log("Trying Fast2SMS v3 API...");
      return await sendFast2SMSV3(phone, otp, apiKey);
    }

    return true;
  } catch (error) {
    console.error("Fast2SMS send exception:", error);
    return false;
  }
}

async function sendFast2SMSV3(phone: string, otp: string, apiKey: string): Promise<boolean> {
  const message = `Your KYRA verification code is ${otp}. Valid for 5 minutes.`;

  try {
    const response = await fetch(
      `https://www.fast2sms.com/dev/bulkV2?authorization=${apiKey}&route=v3&sender_id=TXTIND&message=${encodeURIComponent(message)}&language=english&numbers=${phone}`,
      {
        method: "GET",
      }
    );

    const result = await response.json();

    if (!response.ok || result.return === false) {
      console.error("Fast2SMS v3 error:", result);
      return false;
    }

    return true;
  } catch (error) {
    console.error("Fast2SMS v3 send exception:", error);
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
  const expiresAt = new Date(Date.now() + 5 * 60 * 1000).toISOString();

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
      verified: false,
    });

  if (insertError) {
    console.error("Failed to store OTP:", insertError);
    return new Response(
      JSON.stringify({ error: "Failed to generate OTP. Please try again." }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  // Send SMS (prefer Twilio if configured; fallback to Fast2SMS)
  const phoneE164 = toE164India(formattedPhone);
  const sent = (await sendTwilioSMS(phoneE164, otp)) || (await sendFast2SMS(formattedPhone, otp));

  if (!sent) {
    return new Response(
      JSON.stringify({
        error:
          "Failed to send OTP. Please verify your SMS provider setup (Twilio/others) and try again.",
      }),
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

  const { data: otpRecord, error: fetchError } = await supabase
    .from("otp_verifications")
    .select("*")
    .eq("phone", formattedPhone)
    .or("verified.is.null,verified.eq.false")
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

  if (new Date(otpRecord.expires_at) < new Date()) {
    await supabase.from("otp_verifications").delete().eq("id", otpRecord.id);
    return new Response(
      JSON.stringify({ error: "OTP expired. Please request a new one." }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  if (otpRecord.otp !== otp) {
    return new Response(
      JSON.stringify({ error: "Invalid OTP. Please try again." }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  await supabase.from("otp_verifications").delete().eq("id", otpRecord.id);

  // Auto-create or update profile
  const { data: existingProfile } = await supabase
    .from("profiles")
    .select("id")
    .eq("phone", formattedPhone)
    .maybeSingle();

  let profileId: string;

  if (existingProfile) {
    // Update existing profile
    profileId = existingProfile.id;
    await supabase
      .from("profiles")
      .update({ name: otpRecord.name })
      .eq("id", profileId);
    console.log(`Updated existing profile for ${formattedPhone}`);
  } else {
    // Create new profile
    const { data: newProfile, error: profileError } = await supabase
      .from("profiles")
      .insert({
        name: otpRecord.name,
        phone: formattedPhone,
        user_id: crypto.randomUUID(), // Generate a temporary user_id for now
      })
      .select("id")
      .single();

    if (profileError) {
      console.error("Failed to create profile:", profileError);
    } else {
      profileId = newProfile.id;
      console.log(`Created new profile for ${formattedPhone}`);

      // Sync to Google Sheets for new profiles
      try {
        const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
        const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
        
        await fetch(`${supabaseUrl}/functions/v1/sync-profile-to-sheets`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${supabaseKey}`,
          },
          body: JSON.stringify({
            id: profileId,
            full_name: otpRecord.name,
            phone: formattedPhone,
            created_at: new Date().toISOString(),
          }),
        });
        console.log("Triggered Google Sheets sync");
      } catch (syncError) {
        console.error("Failed to trigger sheets sync:", syncError);
        // Don't fail the verification if sync fails
      }
    }
  }

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
