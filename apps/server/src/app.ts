import "dotenv/config";
import express, {Express, Request, Response} from "express";
import helmet from "helmet";
import cors from "cors";
import cookieParser from "cookie-parser";
import {env} from "@/config/env";
import {logger} from "@/lib/logger";
import {prisma} from "@/db/prisma";
import {redis} from "@/lib/redis";
import {errorHandler} from "@/middleware/errorHandler";
import {redirectLimiter} from "@/middleware/rateLimiter";
import {validate} from "@/middleware/validate";
import * as linkController from "@/controllers/link.controller";
import linkRoutes from "@/routes/link.routes";
import {z} from "zod";
import authRoutes from "./routes/auth.routes";
import analyticsRoutes from "@/routes/analytics.routes";

const app: Express = express();

// ─── Security Middleware ──────────────────────────────────────────────────────

// Helmet sets secure HTTP response headers automatically:
// X-Content-Type-Options, X-Frame-Options, Strict-Transport-Security, etc.
app.use(helmet());

// CORS — only allow requests from your frontend
app.use(
	cors({
		origin: env.CLIENT_URL,
		credentials: true, // Required for cookies to be sent cross-origin
		methods: ["GET", "POST", "PATCH", "DELETE"],
		allowedHeaders: ["Content-Type", "Authorization"],
	}),
);

// ─── Request Parsing ──────────────────────────────────────────────────────────
app.use(express.json({limit: "10kb"})); // Reject payloads over 10kb
app.use(express.urlencoded({extended: true, limit: "10kb"}));
app.use(cookieParser(env.COOKIE_SECRET));

// ─── API Routes ───────────────────────────────────────────────────────────────

// Health check — used by Railway to verify the app is alive
app.get("/health", (_req: Request, res: Response) => {
	res.status(200).json({
		status: "ok",
		timestamp: new Date().toISOString(),
		environment: env.NODE_ENV,
	});
});

// API v1 routes
app.use("/api/v1/links", linkRoutes);
app.use("/api/v1/auth", authRoutes);
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/links', linkRoutes);
app.use('/api/v1/analytics', analyticsRoutes);


// ─── Redirect Route ───────────────────────────────────────────────────────────
// This MUST be defined after /api routes so it doesn't swallow API paths.
// It catches /:shortCode — any path that didn't match an API route above.

const shortCodeParamSchema = z.object({
	shortCode: z
		.string()
		.min(7)
		.max(7)
		.regex(/^[a-zA-Z0-9]+$/, "Invalid short code format"),
});

app.get(
	"/:shortCode",
	redirectLimiter,
	validate({params: shortCodeParamSchema}),
	linkController.redirectToOriginal,
);

// ─── Error Handler ────────────────────────────────────────────────────────────
// Must be last — Express identifies error handlers by their 4-parameter signature
app.use(errorHandler);

// ─── Server Startup ───────────────────────────────────────────────────────────

const startServer = async (): Promise<void> => {
	try {
		// Verify DB connection before accepting traffic
		await prisma.$connect();
		logger.info("Database: connected");

		// Verify Redis connection
		await redis.ping();
		logger.info("Redis: ping successful");

		const port = parseInt(env.PORT, 10);

		app.listen(port, () => {
			logger.info(`Server running on port ${port} in ${env.NODE_ENV} mode`);
		});
	} catch (err) {
		logger.error(`Failed to start server: ${(err as Error).message}`);
		// Exit with non-zero code — Railway/Docker will restart the process
		process.exit(1);
	}
};

// Graceful shutdown — finish in-flight requests before closing connections
process.on("SIGTERM", async () => {
	logger.info("SIGTERM received — shutting down gracefully");
	await prisma.$disconnect();
	redis.disconnect();
	process.exit(0);
});

void startServer();
