import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface CheckAdminRequest {
  phone: string;
}

function getSupabaseClient() {
  return createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
  );
}

serve(async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { phone }: CheckAdminRequest = await req.json();
    
    if (!phone) {
      return new Response(
        JSON.stringify({ error: "Phone number is required", isAdmin: false }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    // Format phone
    const phoneDigits = phone.replace(/\D/g, "");
    const formattedPhone = phoneDigits.length >= 10 ? phoneDigits.slice(-10) : phoneDigits;
    
    if (formattedPhone.length !== 10) {
      return new Response(
        JSON.stringify({ error: "Invalid phone number", isAdmin: false }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    const supabase = getSupabaseClient();
    
    // Check user_roles table for admin role
    const { data: roleRecord, error: roleError } = await supabase
      .from("user_roles")
      .select("role")
      .eq("phone", formattedPhone)
      .eq("role", "admin")
      .maybeSingle();
    
    if (roleError) {
      console.error("Error checking admin role:", roleError);
      // Fall back to checking ADMIN_PHONE secret
      const adminPhone = Deno.env.get("ADMIN_PHONE");
      const isAdmin = adminPhone === formattedPhone;
      
      return new Response(
        JSON.stringify({ isAdmin }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    // Also check the ADMIN_PHONE secret as a fallback
    const adminPhone = Deno.env.get("ADMIN_PHONE");
    const isAdmin = !!roleRecord || adminPhone === formattedPhone;
    
    return new Response(
      JSON.stringify({ isAdmin }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
    
  } catch (error) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error", isAdmin: false }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});