// Google Sheets sync via Supabase Edge Function
import { supabase } from "@/integrations/supabase/client";

interface SyncUserPayload {
  action: "syncUser";
  phone: string;
  name: string;
  timestamp: string;
}

interface BookRidePayload {
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

type SheetPayload = SyncUserPayload | BookRidePayload;

async function sendToSheets(payload: SheetPayload): Promise<boolean> {
  try {
    console.log("Sending to Google Sheets:", payload.action);
    
    const { data, error } = await supabase.functions.invoke("sync-to-sheets", {
      body: payload,
    });

    if (error) {
      console.error("Google Sheets sync error:", error);
      return false;
    }

    console.log("Google Sheets sync success:", data);
    return true;
  } catch (error) {
    console.error("Google Sheets sync error:", error);
    return false;
  }
}

export async function syncUserToSheets(phone: string, name: string): Promise<boolean> {
  return sendToSheets({
    action: "syncUser",
    phone,
    name,
    timestamp: new Date().toISOString(),
  });
}

export async function bookRideToSheets(
  customerName: string,
  phone: string,
  pickup: string,
  drop: string,
  distance: string,
  days: string,
  pickupTime: string,
  startDate: string,
  perRideFare: number,
  totalAmount: number,
  paymentId: string
): Promise<boolean> {
  return sendToSheets({
    action: "bookRide",
    customerName,
    phone,
    pickup,
    drop,
    distance,
    days,
    pickupTime,
    startDate,
    perRideFare,
    totalAmount,
    paymentId,
    timestamp: new Date().toISOString(),
  });
}
