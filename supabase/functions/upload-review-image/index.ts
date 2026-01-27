import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = ["image/png", "image/jpeg", "image/jpg", "image/webp", "image/gif"];

function getSupabaseClient() {
  return createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
  );
}

// Validate file type using magic bytes (first few bytes of file)
function validateFileType(bytes: Uint8Array): string | null {
  const signatures: Record<string, number[]> = {
    "image/png": [0x89, 0x50, 0x4E, 0x47],
    "image/jpeg": [0xFF, 0xD8, 0xFF],
    "image/webp": [0x52, 0x49, 0x46, 0x46], // RIFF (WebP starts with RIFF)
    "image/gif": [0x47, 0x49, 0x46, 0x38],
  };

  for (const [type, sig] of Object.entries(signatures)) {
    if (sig.every((byte, i) => bytes[i] === byte)) {
      return type;
    }
  }
  return null;
}

serve(async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;
    const phone = formData.get("phone") as string;

    if (!file || !phone) {
      return new Response(
        JSON.stringify({ error: "File and phone are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = getSupabaseClient();

    // Format phone
    const phoneDigits = phone.replace(/\D/g, "");
    const formattedPhone = phoneDigits.slice(-10);

    if (formattedPhone.length !== 10 || !/^[6-9]\d{9}$/.test(formattedPhone)) {
      return new Response(
        JSON.stringify({ error: "Invalid phone number" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validate user has completed OTP verification
    const { data: profile } = await supabase
      .from("profiles")
      .select("id")
      .eq("phone", formattedPhone)
      .maybeSingle();

    if (!profile) {
      return new Response(
        JSON.stringify({ error: "Please complete phone verification first" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return new Response(
        JSON.stringify({ error: "File size must be less than 5MB" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Read file bytes for magic byte validation
    const arrayBuffer = await file.arrayBuffer();
    const bytes = new Uint8Array(arrayBuffer);

    // Validate file type using magic bytes
    const detectedType = validateFileType(bytes);
    if (!detectedType || !ALLOWED_TYPES.includes(detectedType)) {
      return new Response(
        JSON.stringify({ error: "Invalid file type. Only PNG, JPG, WebP, and GIF are allowed." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Generate unique filename
    const fileExt = file.name.split(".").pop()?.toLowerCase() || "jpg";
    const fileName = `${Date.now()}-${crypto.randomUUID().substring(0, 8)}.${fileExt}`;

    console.log(`Uploading review image for verified user: ${formattedPhone}, file: ${fileName}`);

    // Upload to storage using service role
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from("review-images")
      .upload(fileName, bytes, {
        contentType: detectedType,
        upsert: false,
      });

    if (uploadError) {
      console.error("Upload error:", uploadError);
      return new Response(
        JSON.stringify({ error: "Upload failed" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Upload successful:", uploadData);

    // Get public URL
    const { data: urlData } = supabase.storage
      .from("review-images")
      .getPublicUrl(fileName);

    return new Response(
      JSON.stringify({ success: true, url: urlData.publicUrl }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
