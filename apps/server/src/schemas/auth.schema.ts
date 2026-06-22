import { z } from "zod";

export const registerSchema = z.object({
  email: z
    .email({ error: "Must be a valid email address" })
    .max(255, { error: "Email must be under 255 characters" }),
  password: z
    .string()
    .min(8, { error: "Password must be at least 8 characters" })
    .max(72, { error: "Password must be under 72 characters" }),
  // 72 char max: bcrypt silently truncates beyond 72 bytes —
  // setting an explicit limit prevents user confusion
});

export const loginSchema = z.object({
  email: z.email({ error: "Must be a valid email address" }),
  password: z.string().min(1, { error: "Password is required" }),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
