import {z} from "zod";

const envSchema = z.object({
	NODE_ENV: z
		.enum(["development", "production", "test"])
		.default("development"),
	PORT: z.string().default("5000"),

	DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),
	REDIS_URL: z.string().min(1, "REDIS_URL is required"),

	JWT_SECRET: z.string().min(32, "JWT_SECRET must be at least 32 characters"),
	JWT_EXPIRES: z.string().default("7d"),

	CLIENT_URL: z.url({error: 'CLIENT_URL must be a valid URL'}),
	COOKIE_SECRET: z
		.string()
		.min(32, "COOKIE_SECRET must be at least 32 characters"),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
	console.error("❌ Invalid environment variables:");
	parsed.error.issues.forEach((issue) => {
		console.error(`  ${issue.path.join(".")}: ${issue.message}`);
	});
	process.exit(1);
}

export const env = parsed.data;
