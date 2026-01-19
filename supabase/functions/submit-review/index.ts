import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface SubmitReviewRequest {
  phone: string;
  userName: string;
  reviewText: string;
  imageUrl: string;
  rating: number;
}

// Rate limiting: max 3 reviews per phone per day
const MAX_REVIEWS_PER_DAY = 3;

function getSupabaseClient() {
  return createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
  );
}

// Validate and sanitize input
function validateInput(data: SubmitReviewRequest): { valid: boolean; error?: string } {
  // Validate phone
  const phoneDigits = data.phone.replace(/\D/g, "");
  const formattedPhone = phoneDigits.length >= 10 ? phoneDigits.slice(-10) : phoneDigits;
  
  if (formattedPhone.length !== 10 || !/^[6-9]\d{9}$/.test(formattedPhone)) {
    return { valid: false, error: "Invalid phone number" };
  }
  
  // Validate userName
  const trimmedName = data.userName.trim();
  if (trimmedName.length < 2 || trimmedName.length > 50) {
    return { valid: false, error: "User name must be between 2 and 50 characters" };
  }
  
  // Validate rating
  if (!Number.isInteger(data.rating) || data.rating < 1 || data.rating > 5) {
    return { valid: false, error: "Rating must be between 1 and 5" };
  }
  
  // Validate review text (optional but max 500 chars)
  if (data.reviewText && data.reviewText.length > 500) {
    return { valid: false, error: "Review text must be less than 500 characters" };
  }
  
  // Validate image URL if provided (must be from our storage or empty)
  if (data.imageUrl && data.imageUrl.length > 0) {
    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    if (!data.imageUrl.startsWith(supabaseUrl) && !data.imageUrl.startsWith("https://")) {
      return { valid: false, error: "Invalid image URL" };
    }
    if (data.imageUrl.length > 500) {
      return { valid: false, error: "Image URL too long" };
    }
  }
  
  return { valid: true };
}

serve(async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const data: SubmitReviewRequest = await req.json();
    
    // Validate input
    const validation = validateInput(data);
    if (!validation.valid) {
      return new Response(
        JSON.stringify({ error: validation.error }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    const supabase = getSupabaseClient();
    
    // Format phone for consistency
    const phoneDigits = data.phone.replace(/\D/g, "");
    const formattedPhone = phoneDigits.slice(-10);
    
    // Check if the user has verified their OTP (exists in otp_verifications with verified=true)
    const { data: otpVerification, error: otpError } = await supabase
      .from("otp_verifications")
      .select("id, name, phone")
      .eq("phone", formattedPhone)
      .eq("verified", true)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    
    // Also check profiles table as fallback
    const { data: profile } = await supabase
      .from("profiles")
      .select("id, name, phone")
      .eq("phone", formattedPhone)
      .maybeSingle();
    
    // User must have either a verified OTP or a profile
    const verifiedUser = profile || otpVerification;
    
    if (!verifiedUser) {
      console.log("No verified user found for phone:", formattedPhone);
      return new Response(
        JSON.stringify({ error: "Please complete phone verification before submitting a review" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    // Use the verified user's ID and name
    const userId = verifiedUser.id;
    const verifiedName = verifiedUser.name || data.userName;
    
    // Rate limiting: check reviews count in last 24 hours
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    
    const { count: recentReviewsCount, error: countError } = await supabase
      .from("reviews")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId)
      .gte("created_at", oneDayAgo);
    
    if (countError) {
      console.error("Error checking review count:", countError);
    } else if (recentReviewsCount && recentReviewsCount >= MAX_REVIEWS_PER_DAY) {
      return new Response(
        JSON.stringify({ error: `You can only submit ${MAX_REVIEWS_PER_DAY} reviews per day. Please try again later.` }),
        { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    // Insert the review using the verified user data
    const { data: review, error: insertError } = await supabase
      .from("reviews")
      .insert({
        user_id: userId,
        user_name: verifiedName,
        review_text: data.reviewText.trim(),
        image_url: data.imageUrl || "",
        rating: data.rating,
      })
      .select()
      .single();
    
    if (insertError) {
      console.error("Error inserting review:", insertError);
      return new Response(
        JSON.stringify({ error: "Failed to submit review. Please try again." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    console.log(`Review submitted by ${verifiedName} (${formattedPhone})`);
    
    return new Response(
      JSON.stringify({ success: true, review }),
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