import { z } from "zod";

export const timelineQuerySchema = z.object({
  // How many days back to show — default 30, max 90
  days: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : 30))
    .pipe(
      z
        .number()
        .min(1, { error: "days must be at least 1" })
        .max(90, { error: "days cannot exceed 90" }),
    ),
});

export const shortCodeParamSchema = z.object({
  shortCode: z
    .string()
    .min(7, { error: "Invalid short code" })
    .max(7, { error: "Invalid short code" })
    .regex(/^[a-zA-Z0-9]+$/, { error: "Invalid short code format" }),
});

export type TimelineQuery = z.infer<typeof timelineQuerySchema>;
