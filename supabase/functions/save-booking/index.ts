import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.89.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const twilioAccountSid = Deno.env.get("TWILIO_ACCOUNT_SID")!;
const twilioAuthToken = Deno.env.get("TWILIO_AUTH_TOKEN")!;
const twilioPhoneNumber = Deno.env.get("TWILIO_PHONE_NUMBER")!;
const opsPhone = "+919686638787"; // Ops team WhatsApp number

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

// Format days for display
function formatDaysOfTravel(days: string[]): string {
  if (days.length === 0) return "None";
  if (days.length === 1) return days[0];
  if (days.length === 6) return "Monday-Saturday";
  if (days.length === 7) return "Monday-Sunday";
  return days.join(", ");
}

// Format date for display (e.g., "19th January")
function formatStartDate(dateStr: string): string {
  const date = new Date(dateStr);
  const day = date.getDate();
  const month = date.toLocaleString('en-IN', { month: 'long' });
  
  const suffix = (d: number) => {
    if (d > 3 && d < 21) return 'th';
    switch (d % 10) {
      case 1: return 'st';
      case 2: return 'nd';
      case 3: return 'rd';
      default: return 'th';
    }
  };
  
  return `${day}${suffix(day)} ${month}`;
}

// Send WhatsApp message via Twilio
async function sendWhatsAppNotification(message: string): Promise<void> {
  const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${twilioAccountSid}/Messages.json`;
  
  const body = new URLSearchParams({
    From: `whatsapp:${twilioPhoneNumber}`,
    To: `whatsapp:${opsPhone}`,
    Body: message,
  });

  const response = await fetch(twilioUrl, {
    method: "POST",
    headers: {
      "Authorization": `Basic ${btoa(`${twilioAccountSid}:${twilioAuthToken}`)}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: body.toString(),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error("Twilio WhatsApp error:", errorText);
    throw new Error(`Failed to send WhatsApp: ${response.status}`);
  }
  
  console.log("WhatsApp notification sent successfully to admin");
}

// Build admin notification message
function buildAdminMessage(rideNumber: number, data: BookingData): string {
  const daysCount = data.selectedDays.length;
  const subscriptionType = `Weekly (${daysCount} day${daysCount > 1 ? 's' : ''})`;
  
  return `RIDE #${rideNumber}

${data.customerName}

${data.phone}

📍 Pickup location: ${data.pickupAddress}

📍 Drop location: ${data.dropAddress}

📅 Days of travel: ${formatDaysOfTravel(data.selectedDays)}

🗓 Start date: ${formatStartDate(data.startDate)}

⏰ Pickup time: ${data.pickupTime}

📆 Subscription type: ${subscriptionType}

📏 Distance: ${data.distanceKm}km

💰 Fare per day: ₹${data.perRideFare}

📆 Number of rides (this week): ${daysCount}

💳 Total amount for the week: 

₹${data.totalAmount}`;
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

    // Get total booking count for ride number
    const { count } = await supabase
      .from("bookings")
      .select("*", { count: "exact", head: true });
    
    const rideNumber = count || 1;

    // Send WhatsApp notification to admin in background
    const notificationTask = async () => {
      try {
        const message = buildAdminMessage(rideNumber, {
          ...data,
          customerName,
          phone: formattedPhone,
        });
        await sendWhatsAppNotification(message);
      } catch (err) {
        console.error("Failed to send admin WhatsApp notification:", err);
      }
    };

    // Fire and forget - don't block the response
    notificationTask();

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
