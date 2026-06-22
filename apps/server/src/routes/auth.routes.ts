import {Router} from "express";
import {validate} from "@/middleware/validate";
import {authenticate} from "@/middleware/authenticate";
import {authLimiter} from "@/middleware/rateLimiter";
import {loginSchema, registerSchema} from "@/schemas/auth.schema";
import * as authController from "@/controllers/auth.controller";

const router = Router();

// Apply auth rate limiter to all auth routes —
// brute force protection on every endpoint here
router.use(authLimiter);

// POST /api/v1/auth/register
router.post(
	"/register",
	validate({body: registerSchema}),
	authController.register,
);

// POST /api/v1/auth/login
router.post("/login", validate({body: loginSchema}), authController.login);

// POST /api/v1/auth/logout
// No body validation needed — just clear the cookie
router.post("/logout", authController.logout);

// GET /api/v1/auth/me
// authenticate middleware verifies JWT before controller runs
router.get("/me", authenticate, authController.getMe);

export default router;
