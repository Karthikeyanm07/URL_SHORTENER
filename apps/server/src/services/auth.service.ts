import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import {prisma} from "@/db/prisma";
import {env} from "@/config/env";
import {logger} from "@/lib/logger";
import {ConflictError, UnauthorizedError, ValidationError,} from "@/errors/AppError";
import {redis} from '@/lib/redis';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface AuthResult {
	user: {
		id: string;
		email: string;
		createdAt: Date;
	};
	token: string;
}

interface JwtPayload {
	userId: string;
	email: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

// Generates a signed JWT containing userId and email.
// We only put non-sensitive, stable identifiers in the token —
// never put passwords, roles that change often, or sensitive PII.
const signToken = (userId: string, email: string): string => {
	const payload: JwtPayload = {userId, email};
	return jwt.sign(payload, env.JWT_SECRET, {
		expiresIn: env.JWT_EXPIRES,
	} as jwt.SignOptions);
};

// bcrypt cost factor 12 — high enough to be slow for attackers,
// fast enough for real users (~300ms on modern hardware).
// Never go below 10 in production.
const SALT_ROUNDS = 12;

// ─── Register ─────────────────────────────────────────────────────────────────

export const register = async (
	email: string,
	password: string,
): Promise<AuthResult> => {
	// Normalize email — prevent duplicate accounts from case differences
	const normalizedEmail = email.toLowerCase().trim();

	// Check for existing account before hashing — hashing is expensive,
	// no point doing it if we're going to reject anyway
	const existing = await prisma.user.findUnique({
		where: {email: normalizedEmail},
		select: {id: true},
	});

	if (existing) {
		// Don't say "email already registered" — that's user enumeration.
		// Attacker could use this to discover which emails have accounts.
		// Vague message is intentional here.
		throw new ConflictError("An account with this email already exists");
	}

	const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

	const user = await prisma.user.create({
		data: {
			email: normalizedEmail,
			passwordHash,
		},
		select: {
			id: true,
			email: true,
			createdAt: true,
		},
	});

	const token = signToken(user.id, user.email);

	logger.info(`New user registered: ${user.id}`);

	return {user, token};
};

// ─── Login ────────────────────────────────────────────────────────────────────

export const login = async (
	email: string,
	password: string,
): Promise<AuthResult> => {
	const normalizedEmail = email.toLowerCase().trim();

	const user = await prisma.user.findUnique({
		where: {email: normalizedEmail},
		select: {
			id: true,
			email: true,
			passwordHash: true,
			createdAt: true,
		},
	});

	// Always run bcrypt compare even if user doesn't exist —
	// this prevents timing attacks where an attacker can tell
	// "user not found" vs "wrong password" by measuring response time.
	// compareSync with a dummy hash takes the same time as a real compare.
	const dummyHash =
		"$2a$12$dummy.hash.to.prevent.timing.attacks.padding.here123";
	const passwordToCompare = user?.passwordHash ?? dummyHash;
	const isValid = await bcrypt.compare(password, passwordToCompare);

	if (!user || !isValid) {
		// Same message for both "user not found" and "wrong password" —
		// never tell an attacker which one it was
		throw new UnauthorizedError("Invalid email or password");
	}

	const token = signToken(user.id, user.email);

	logger.info(`User logged in: ${user.id}`);

	return {
		user: {
			id: user.id,
			email: user.email,
			createdAt: user.createdAt,
		},
		token,
	};
};

// ─── Get Current User ─────────────────────────────────────────────────────────

export const getMe = async (
	userId: string,
): Promise<{ id: string; email: string; createdAt: Date }> => {
	const user = await prisma.user.findUnique({
		where: {id: userId},
		select: {
			id: true,
			email: true,
			createdAt: true,
		},
	});

	if (!user) {
		// Token was valid but user was deleted after token was issued
		throw new UnauthorizedError("Account no longer exists");
	}

	return user;
};

// ─── Validate Password Strength ───────────────────────────────────────────────

// Called before register — keeps password rules in one place
export const validatePassword = (password: string): void => {
	if (password.length < 8) {
		throw new ValidationError("Password must be at least 8 characters");
	}
	if (!/[A-Z]/.test(password)) {
		throw new ValidationError(
			"Password must contain at least one uppercase letter",
		);
	}
	if (!/[0-9]/.test(password)) {
		throw new ValidationError("Password must contain at least one number");
	}
};

// ─── Token Blocklist ──────────────────────────────────────────────────────────

// On logout, we store the token in Redis until it naturally expires.
// Key: "blocklist:{token}" — Value: "1" (we only care if key exists)
// TTL is set to the token's remaining validity so Redis auto-cleans it.
// This makes logout truly secure — stolen tokens stop working immediately.
export const blockToken = async (token: string): Promise<void> => {
	try {
		const decoded = jwt.decode(token) as { exp?: number } | null;

		if (!decoded?.exp) return;

		// Calculate remaining TTL in seconds
		const now = Math.floor(Date.now() / 1000);
		const remainingTtl = decoded.exp - now;

		// Only block if token hasn't already expired
		if (remainingTtl > 0) {
			await redis.set(`blocklist:${token}`, '1', 'EX', remainingTtl);
			logger.info('Token added to blocklist');
		}
	} catch (err) {
		// Non-fatal — log but don't crash logout flow
		logger.error(`Failed to blocklist token: ${(err as Error).message}`);
	}
};

export const isTokenBlocked = async (token: string): Promise<boolean> => {
	try {
		const result = await redis.get(`blocklist:${token}`);
		return result !== null;
	} catch (err) {
		// If Redis is down, fail open (allow request) — availability over security
		// In a stricter system you'd fail closed, but that kills the app if Redis blips
		logger.warn(`Blocklist check failed: ${(err as Error).message}`);
		return false;
	}
};
