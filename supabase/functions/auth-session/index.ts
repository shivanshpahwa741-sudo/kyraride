import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.89.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

// Generate a secure random token
function generateSessionToken(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, (b) => b.toString(16).padStart(2, "0")).join("");
}

// Simple hash for PIN (using Web Crypto API)
async function hashPin(pin: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(pin + "kyra_salt_2024");
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

// Constant-time string comparison to prevent timing attacks
function constantTimeCompare(a: string, b: string): boolean {
  if (a.length !== b.length) {
    return false;
  }
  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return result === 0;
}

serve(async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const { action, phone, sessionToken, pin } = await req.json();

    // Validate phone format
    const phoneDigits = phone?.replace(/\D/g, "") || "";
    const formattedPhone = phoneDigits.slice(-10);

    if (action === "create") {
      // Create a new session for verified user
      if (!formattedPhone || formattedPhone.length !== 10) {
        return new Response(
          JSON.stringify({ error: "Invalid phone number" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Verify user exists in profiles
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("id, name, phone, pin_hash")
        .eq("phone", formattedPhone)
        .maybeSingle();

      if (profileError || !profile) {
        return new Response(
          JSON.stringify({ error: "User not found. Please sign up first." }),
          { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Generate session token
      const token = generateSessionToken();
      const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days

      // Delete any existing sessions for this user
      await supabase
        .from("user_sessions")
        .delete()
        .eq("user_id", profile.id);

      // Create new session
      const { error: sessionError } = await supabase
        .from("user_sessions")
        .insert({
          user_id: profile.id,
          phone: formattedPhone,
          session_token: token,
          expires_at: expiresAt.toISOString(),
        });

      if (sessionError) {
        console.error("Session creation error:", sessionError);
        return new Response(
          JSON.stringify({ error: "Failed to create session" }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      console.log(`Session created for ${profile.name} (${formattedPhone})`);

      return new Response(
        JSON.stringify({
          success: true,
          sessionToken: token,
          user: {
            id: profile.id,
            name: profile.name,
            phone: formattedPhone,
          },
          hasPin: !!profile.pin_hash,
          expiresAt: expiresAt.toISOString(),
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (action === "validate") {
      // Validate an existing session token
      if (!sessionToken) {
        return new Response(
          JSON.stringify({ valid: false, error: "No session token provided" }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const { data: session, error: sessionError } = await supabase
        .from("user_sessions")
        .select("id, user_id, phone, expires_at")
        .eq("session_token", sessionToken)
        .maybeSingle();

      if (sessionError || !session) {
        return new Response(
          JSON.stringify({ valid: false, error: "Session not found" }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Check if session is expired
      if (new Date(session.expires_at) < new Date()) {
        // Delete expired session
        await supabase
          .from("user_sessions")
          .delete()
          .eq("id", session.id);

        return new Response(
          JSON.stringify({ valid: false, error: "Session expired" }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Get user profile
      const { data: profile } = await supabase
        .from("profiles")
        .select("id, name, phone, pin_hash")
        .eq("id", session.user_id)
        .maybeSingle();

      if (!profile) {
        return new Response(
          JSON.stringify({ valid: false, error: "User not found" }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      return new Response(
        JSON.stringify({
          valid: true,
          user: {
            id: profile.id,
            name: profile.name,
            phone: profile.phone,
          },
          hasPin: !!profile.pin_hash,
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (action === "logout") {
      // Invalidate session
      if (sessionToken) {
        await supabase
          .from("user_sessions")
          .delete()
          .eq("session_token", sessionToken);
      }

      return new Response(
        JSON.stringify({ success: true }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (action === "set_pin") {
      // Set PIN for user (requires valid session)
      if (!sessionToken || !pin) {
        return new Response(
          JSON.stringify({ error: "Session token and PIN are required" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Validate PIN format
      if (!/^\d{4}$/.test(pin)) {
        return new Response(
          JSON.stringify({ error: "PIN must be exactly 4 digits" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Validate session
      const { data: session } = await supabase
        .from("user_sessions")
        .select("user_id")
        .eq("session_token", sessionToken)
        .maybeSingle();

      if (!session) {
        return new Response(
          JSON.stringify({ error: "Invalid session" }),
          { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Hash and store PIN
      const pinHash = await hashPin(pin);
      const { error: updateError } = await supabase
        .from("profiles")
        .update({ pin_hash: pinHash })
        .eq("id", session.user_id);

      if (updateError) {
        console.error("Failed to set PIN:", updateError);
        return new Response(
          JSON.stringify({ error: "Failed to set PIN" }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      console.log(`PIN set for user ${session.user_id}`);

      return new Response(
        JSON.stringify({ success: true, message: "PIN set successfully" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (action === "verify_pin") {
      // Verify PIN and create session
      if (!formattedPhone || formattedPhone.length !== 10 || !pin) {
        return new Response(
          JSON.stringify({ error: "Phone and PIN are required" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Validate PIN format
      if (!/^\d{4}$/.test(pin)) {
        return new Response(
          JSON.stringify({ error: "PIN must be exactly 4 digits" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Get user profile
      const { data: profile } = await supabase
        .from("profiles")
        .select("id, name, phone, pin_hash")
        .eq("phone", formattedPhone)
        .maybeSingle();

      if (!profile) {
        return new Response(
          JSON.stringify({ error: "Account not found" }),
          { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      if (!profile.pin_hash) {
        return new Response(
          JSON.stringify({ error: "PIN not set. Please login with OTP first." }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Verify PIN using constant-time comparison to prevent timing attacks
      const pinHash = await hashPin(pin);
      if (!constantTimeCompare(pinHash, profile.pin_hash || '')) {
        // Add small random delay to mask any remaining timing patterns
        await new Promise(resolve => setTimeout(resolve, 100 + Math.random() * 50));
        
        return new Response(
          JSON.stringify({ error: "Incorrect PIN" }),
          { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Create session
      const token = generateSessionToken();
      const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

      // Delete existing sessions
      await supabase
        .from("user_sessions")
        .delete()
        .eq("user_id", profile.id);

      // Create new session
      const { error: sessionError } = await supabase
        .from("user_sessions")
        .insert({
          user_id: profile.id,
          phone: formattedPhone,
          session_token: token,
          expires_at: expiresAt.toISOString(),
        });

      if (sessionError) {
        console.error("Session creation error:", sessionError);
        return new Response(
          JSON.stringify({ error: "Failed to create session" }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      console.log(`PIN login successful for ${profile.name} (${formattedPhone})`);

      return new Response(
        JSON.stringify({
          success: true,
          sessionToken: token,
          user: {
            id: profile.id,
            name: profile.name,
            phone: formattedPhone,
          },
          expiresAt: expiresAt.toISOString(),
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (action === "check_pin") {
      // Check if user has PIN set
      if (!formattedPhone || formattedPhone.length !== 10) {
        return new Response(
          JSON.stringify({ error: "Valid phone number required" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("id, name, pin_hash")
        .eq("phone", formattedPhone)
        .maybeSingle();

      return new Response(
        JSON.stringify({
          exists: !!profile,
          hasPin: !!profile?.pin_hash,
          name: profile?.name,
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ error: "Invalid action" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("Session error:", error);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
