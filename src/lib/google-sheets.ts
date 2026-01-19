// Google Sheets API integration
const GOOGLE_SHEETS_URL = "https://script.google.com/macros/s/AKfycbwMidv6cDZP6kiPeY0gzftirfM7i2kUSjEWNIeQ5EKEbeu4SIuT7UQVeWrSJk5bvhB-4A/exec";

interface SyncUserPayload {
  action: "syncUser";
  phone: string;
  name: string;
  timestamp: string;
}

interface AddReviewPayload {
  action: "addReview";
  name: string;
  text: string;
  imageUrl: string;
  rating: number;
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

type SheetPayload = SyncUserPayload | AddReviewPayload | BookRidePayload;

async function sendToSheets(payload: SheetPayload): Promise<boolean> {
  try {
    console.log("Sending to Google Sheets:", payload.action, payload);
    
    const response = await fetch(GOOGLE_SHEETS_URL, {
      method: "POST",
      mode: "no-cors", // Google Apps Script requires no-cors for external calls
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    // With no-cors, we can't read the response, but the request is sent
    console.log("Google Sheets sync initiated for:", payload.action);
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

export async function addReviewToSheets(
  name: string,
  text: string,
  imageUrl: string,
  rating: number
): Promise<boolean> {
  return sendToSheets({
    action: "addReview",
    name,
    text,
    imageUrl,
    rating,
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
