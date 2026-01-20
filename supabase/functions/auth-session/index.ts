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

serve(async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const { action, phone, sessionToken } = await req.json();

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
        .select("id, name, phone")
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
        .select("id, name, phone")
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
