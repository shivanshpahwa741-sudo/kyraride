import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const GOOGLE_SHEETS_URL = "https://script.google.com/macros/s/AKfycbwhLhBKYS9X8AxIIZXzWOcjK1b4rqTdbkQIWiFzUTF6GeP839CBLG0HTwJ-I9U8bngF/exec";

interface ProfileData {
  id: string;
  full_name: string;
  phone: string;
  created_at?: string;
}

serve(async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const payload = await req.json();
    console.log("Received payload:", JSON.stringify(payload));

    // Handle both direct calls and database webhook triggers
    let profileData: ProfileData;

    if (payload.type === "INSERT" && payload.record) {
      // Database webhook trigger format
      profileData = {
        id: payload.record.id,
        full_name: payload.record.name,
        phone: payload.record.phone,
        created_at: payload.record.created_at,
      };
    } else {
      // Direct call format
      profileData = {
        id: payload.id,
        full_name: payload.full_name || payload.name,
        phone: payload.phone,
        created_at: payload.created_at,
      };
    }

    console.log("Syncing profile to Google Sheets:", JSON.stringify(profileData));

    const response = await fetch(GOOGLE_SHEETS_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(profileData),
    });

    // Google Apps Script may return HTML on redirect, so we check status
    if (!response.ok && response.status !== 302) {
      const errorText = await response.text();
      console.error("Google Sheets error:", response.status, errorText);
      throw new Error(`Failed to sync to Google Sheets: ${response.status}`);
    }

    console.log("Successfully synced profile to Google Sheets");

    return new Response(
      JSON.stringify({ success: true, message: "Profile synced to Google Sheets" }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Failed to sync profile";
    console.error("Sync error:", error);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
