import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.89.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

interface BookingData {
  customerName: string;
  phone: string;
  pickupAddress: string;
  dropAddress: string;
  distanceKm: number;
  selectedDays: string[];
  pickupTime: string;
  startDate: string;
  perRideFare: number;
  totalAmount: number;
  paymentId: string;
}

serve(async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const data: BookingData = await req.json();

    // Validate required fields
    if (!data.phone || !data.paymentId || !data.pickupAddress || !data.dropAddress) {
      return new Response(
        JSON.stringify({ error: "Missing required booking fields" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Format phone number
    const phoneDigits = data.phone.replace(/\D/g, "");
    const formattedPhone = phoneDigits.slice(-10);

    // Get user profile
    const { data: profile } = await supabase
      .from("profiles")
      .select("id, name")
      .eq("phone", formattedPhone)
      .maybeSingle();

    const userId = profile?.id || crypto.randomUUID();
    const customerName = data.customerName || profile?.name || "Guest";

    // Check if booking already exists (prevent duplicates)
    const { data: existingBooking } = await supabase
      .from("bookings")
      .select("id")
      .eq("payment_id", data.paymentId)
      .maybeSingle();

    if (existingBooking) {
      console.log("Booking already exists for payment:", data.paymentId);
      return new Response(
        JSON.stringify({ success: true, message: "Booking already saved", bookingId: existingBooking.id }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Insert booking
    const { data: booking, error: bookingError } = await supabase
      .from("bookings")
      .insert({
        user_id: userId,
        user_phone: formattedPhone,
        customer_name: customerName,
        pickup_address: data.pickupAddress,
        drop_address: data.dropAddress,
        distance_km: data.distanceKm,
        selected_days: data.selectedDays,
        pickup_time: data.pickupTime,
        start_date: data.startDate,
        per_ride_fare: data.perRideFare,
        total_amount: data.totalAmount,
        payment_id: data.paymentId,
        status: "confirmed",
      })
      .select()
      .single();

    if (bookingError) {
      console.error("Booking insert error:", bookingError);
      return new Response(
        JSON.stringify({ error: "Failed to save booking" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Booking saved: ${booking.id} for ${customerName} (${formattedPhone})`);

    return new Response(
      JSON.stringify({ success: true, bookingId: booking.id }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("Save booking error:", error);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
