import rateLimit from "express-rate-limit";

const rateLimitResponse = (message: string) => ({
  success: false,
  error: message,
});

// Login / register — 10 attempts per 15 minutes per IP
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: rateLimitResponse(
    "Too many attempts. Please try again in 15 minutes.",
  ),
  standardHeaders: true,
  legacyHeaders: false,
});

// Link creation — anonymous users especially 20 links per 15 minutes per IP
export const createLinkLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: rateLimitResponse("Too many links created. Please try again later."),
  standardHeaders: true,
  legacyHeaders: false,
});

// Redirect route — the highest traffic route
// 200 redirects per minute per IP — high enough for real users, blocks bots
export const redirectLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 200,
  message: rateLimitResponse("Too many requests. Please slow down."),
  standardHeaders: true,
  legacyHeaders: false,
});
