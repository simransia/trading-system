import { z } from "zod";

export const durationOptions = [
  { value: "seconds", label: "Seconds", multiplier: 1 },
  { value: "minutes", label: "Minutes", multiplier: 60 },
  { value: "hours", label: "Hours", multiplier: 3600 },
  { value: "days", label: "Days", multiplier: 86400 },
  { value: "weeks", label: "Weeks", multiplier: 604800 },
];

export const formDataSchema = z.object({
  asset: z.string().nonempty("Asset is required"),
  quantity: z
    .number()
    .min(0.00001, "Minimum quantity is 0.00001")
    .max(1000, "Maximum quantity is 1000"),
  price: z
    .number()
    .min(0.01, "Minimum price is 0.01")
    .max(1000000, "Maximum price is 1,000,000"),
  type: z.enum(["BUY", "SELL"], {
    required_error: "Order type is required",
  }),
  expirationDuration: z.number().optional(),
  expirationUnit: z.string().optional(),
  expirationDatetime: z.string().optional(),
});
