import { z } from "zod";

export const bookingSchema = z.object({
  name: z
    .string()
    .min(2, "Name must be at least 2 characters")
    .max(100, "Name is too long"),

  phone: z
    .string()
    .regex(/^[6-9]\d{9}$/, "Please enter a valid 10-digit Indian mobile number"),

  pickupAddress: z.string().min(1, "Please select a pickup location"),
  pickupPlaceId: z.string().min(1, "Invalid pickup location"),
  pickupLat: z.number(),
  pickupLng: z.number(),

  dropAddress: z.string().min(1, "Please select a drop location"),
  dropPlaceId: z.string().min(1, "Invalid drop location"),
  dropLat: z.number(),
  dropLng: z.number(),

  pickupTime: z
    .string()
    .regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, "Please select a valid time"),

  selectedDays: z
    .array(z.enum(["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"]))
    .min(1, "Please select at least one day"),
});

export type BookingSchemaType = z.infer<typeof bookingSchema>;
