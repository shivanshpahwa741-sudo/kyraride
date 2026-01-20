import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { encode } from "https://deno.land/std@0.190.0/encoding/base64.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SPREADSHEET_ID = "1X-zACDHLdBy0nfi2mdRBrKDSYadyIjH-CtFEAnfbVVw";

interface UserPayload {
  action: "syncUser";
  name: string;
  phone: string;
  timestamp: string;
}

interface BookingPayload {
  action: "bookRide";
  customerName: string;
  phone: string;
  pickup: string;
  drop: string;
  distance: string;
  days: string;
  pickupTime: string;
  startDate: string;
  perRideFare: number;
  totalAmount: number;
  paymentId: string;
  timestamp: string;
}

type SheetPayload = UserPayload | BookingPayload;

// Get Google access token using service account
async function getAccessToken(): Promise<string> {
  const serviceAccountJson = Deno.env.get("GOOGLE_SERVICE_ACCOUNT_JSON");
  if (!serviceAccountJson) {
    throw new Error("GOOGLE_SERVICE_ACCOUNT_JSON not configured");
  }

  const serviceAccount = JSON.parse(serviceAccountJson);
  
  // Create JWT for Google OAuth
  const header = {
    alg: "RS256",
    typ: "JWT",
  };

  const now = Math.floor(Date.now() / 1000);
  const claims = {
    iss: serviceAccount.client_email,
    scope: "https://www.googleapis.com/auth/spreadsheets",
    aud: "https://oauth2.googleapis.com/token",
    exp: now + 3600,
    iat: now,
  };

  // Base64URL encode helpers
  const base64urlBytes = (bytes: Uint8Array): string => {
    // Ensure we always pass a real ArrayBuffer (not SharedArrayBuffer)
    const ab = bytes.slice().buffer as ArrayBuffer;
    return encode(ab)
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=/g, "");
  };

  const base64urlJson = (obj: unknown): string => {
    return base64urlBytes(new TextEncoder().encode(JSON.stringify(obj)));
  };

  const headerB64 = base64urlJson(header);
  const claimsB64 = base64urlJson(claims);
  const signatureInput = `${headerB64}.${claimsB64}`;

  // Import private key and sign
  const pemContent = serviceAccount.private_key
    .replace("-----BEGIN PRIVATE KEY-----", "")
    .replace("-----END PRIVATE KEY-----", "")
    .replace(/\n/g, "");

  const binaryKey = Uint8Array.from(atob(pemContent), (c) => c.charCodeAt(0));

  const cryptoKey = await crypto.subtle.importKey(
    "pkcs8",
    binaryKey,
    { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
    false,
    ["sign"],
  );

  const signature = await crypto.subtle.sign(
    "RSASSA-PKCS1-v1_5",
    cryptoKey,
    new TextEncoder().encode(signatureInput),
  );

  const signatureB64 = base64urlBytes(new Uint8Array(signature));
  const jwt = `${signatureInput}.${signatureB64}`;

  // Exchange JWT for access token
  const tokenBody = new URLSearchParams({
    grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
    assertion: jwt,
  });

  const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: tokenBody.toString(),
  });

  const tokenData = await tokenResponse.json();
  if (!tokenData.access_token) {
    console.error("Token response:", tokenData);
    throw new Error("Failed to get access token");
  }

  return tokenData.access_token;
}

// Append row to a specific sheet
async function appendToSheet(accessToken: string, sheetName: string, values: string[][]): Promise<void> {
  const range = `${sheetName}!A:Z`;
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/${encodeURIComponent(range)}:append?valueInputOption=USER_ENTERED`;

  const response = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ values }),
  });

  if (!response.ok) {
    const error = await response.text();
    console.error("Sheets API error:", error);
    throw new Error(`Failed to append to sheet: ${response.status}`);
  }

  console.log(`Successfully appended to ${sheetName}`);
}

// Ensure sheet exists with headers
async function ensureSheetExists(accessToken: string, sheetName: string, headers: string[]): Promise<void> {
  // First, try to get the sheet
  const getUrl = `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}?fields=sheets.properties.title`;
  const getResponse = await fetch(getUrl, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  const spreadsheet = await getResponse.json();
  const sheets = spreadsheet.sheets?.map((s: any) => s.properties.title) || [];

  if (!sheets.includes(sheetName)) {
    // Create the sheet
    const createUrl = `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}:batchUpdate`;
    await fetch(createUrl, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        requests: [{
          addSheet: {
            properties: { title: sheetName },
          },
        }],
      }),
    });

    // Add headers
    await appendToSheet(accessToken, sheetName, [headers]);
    console.log(`Created sheet "${sheetName}" with headers`);
  }
}

serve(async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const payload: SheetPayload = await req.json();
    console.log("Received payload:", payload.action);

    const accessToken = await getAccessToken();

    if (payload.action === "syncUser") {
      const userPayload = payload as UserPayload;
      
      // Ensure Users sheet exists
      await ensureSheetExists(accessToken, "Users", [
        "Timestamp", "Name", "Phone"
      ]);

      // Append user data
      await appendToSheet(accessToken, "Users", [[
        userPayload.timestamp,
        userPayload.name,
        userPayload.phone,
      ]]);

      return new Response(
        JSON.stringify({ success: true, message: "User synced to Google Sheets" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (payload.action === "bookRide") {
      const bookingPayload = payload as BookingPayload;

      // Ensure Bookings sheet exists
      await ensureSheetExists(accessToken, "Bookings", [
        "Timestamp", "Payment ID", "Customer Name", "Phone", 
        "Pickup", "Drop", "Distance", "Days", "Pickup Time", 
        "Start Date", "Per Ride Fare", "Total Amount"
      ]);

      // Append booking data
      await appendToSheet(accessToken, "Bookings", [[
        bookingPayload.timestamp,
        bookingPayload.paymentId,
        bookingPayload.customerName,
        bookingPayload.phone,
        bookingPayload.pickup,
        bookingPayload.drop,
        bookingPayload.distance,
        bookingPayload.days,
        bookingPayload.pickupTime,
        bookingPayload.startDate,
        String(bookingPayload.perRideFare),
        String(bookingPayload.totalAmount),
      ]]);

      return new Response(
        JSON.stringify({ success: true, message: "Booking synced to Google Sheets" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ error: "Unknown action" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Failed to sync to sheets";
    console.error("Sync error:", error);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
