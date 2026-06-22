import {z} from 'zod';
import {UAParser} from 'ua-parser-js';
import {prisma} from '@/db/prisma';
import {cacheService} from '@/services/cache.service';
import {generateUniqueShortCode} from '@/lib/nanoid';
import {hashIp} from '@/lib/hash';
import {logger} from '@/lib/logger';
import {ForbiddenError, GoneError, NotFoundError,} from '@/errors/AppError';
import geoip from 'geoip-lite';


// Zod schema for link creation
export const createLinkSchema = z.object({
	originalUrl: z
		.string()
		.max(2048, 'URL must be under 2048 characters')
		.refine(
			(val) => {
				try {
					const url = new URL(val);
					return url.protocol === 'http:' || url.protocol === 'https:';
				} catch {
					return false;
				}
			},
			{message: 'Must be a valid http or https URL'}
		),
	expiresAt: z
		.iso.datetime({error: 'Must be a valid ISO date string'})
		.optional()
		.nullable(),
});

export type CreateLinkInput = z.infer<typeof createLinkSchema>;

export interface LinkResult {
	id: string;
	shortCode: string;
	originalUrl: string;
	expiresAt: Date | null;
	isActive: boolean;
	createdAt: Date;
	userId: string | null;
}

// Creates a new shortened link.
// userId is optional — null means anonymous link.
export const createLink = async (
	input: CreateLinkInput,
	userId: string | null
): Promise<LinkResult> => {
	const shortCode = await generateUniqueShortCode();

	const link = await prisma.link.create({
		data: {
			shortCode,
			originalUrl: input.originalUrl,
			userId: userId ?? null,
			expiresAt: input.expiresAt ? new Date(input.expiresAt) : null,
		},
		select: {
			id: true,
			shortCode: true,
			originalUrl: true,
			expiresAt: true,
			isActive: true,
			createdAt: true,
			userId: true,
		},
	});

	// Pre-warm the cache immediately after creation.
	// The first redirect will be a cache hit instead of a DB query.
	await cacheService.setLink(shortCode, {
		originalUrl: link.originalUrl,
		isActive: link.isActive,
		expiresAt: link.expiresAt ? link.expiresAt.toISOString() : null,
	});

	logger.info(`Link created: ${shortCode} → ${input.originalUrl}`);

	return link;
};

// Resolves a short code to its original URL.
// This is the hot path — Redis first, DB fallback.
export const resolveLink = async (shortCode: string): Promise<string> => {
	// 1. Check Redis cache first
	const cached = await cacheService.getLink(shortCode);

	if (cached) {
		// Cache hit — validate before redirecting
		if (!cached.isActive) {
			throw new GoneError('This link has been deactivated');
		}
		if (cached.expiresAt && new Date(cached.expiresAt) < new Date()) {
			throw new GoneError('This link has expired');
		}
		return cached.originalUrl;
	}

	// 2. Cache miss — query the DB
	const link = await prisma.link.findUnique({
		where: {shortCode},
		select: {
			originalUrl: true,
			isActive: true,
			expiresAt: true,
		},
	});

	if (!link) {
		throw new NotFoundError('Link not found');
	}

	if (!link.isActive) {
		throw new GoneError('This link has been deactivated');
	}

	if (link.expiresAt && link.expiresAt < new Date()) {
		throw new GoneError('This link has expired');
	}

	// 3. Warm the cache for next time
	await cacheService.setLink(shortCode, {
		originalUrl: link.originalUrl,
		isActive: link.isActive,
		expiresAt: link.expiresAt ? link.expiresAt.toISOString() : null,
	});

	return link.originalUrl;
};

// Records a click asynchronously — called after the redirect is sent.
// We fire-and-forget this so the user is never waiting for analytics writes.
// Any failure here is logged but does not affect the redirect.
export const recordClick = async (
	shortCode: string,
	ip: string,
	userAgent: string,
	referer: string | undefined
): Promise<void> => {
	try {
		// Find the link id — we need it for the Click record
		const link = await prisma.link.findUnique({
			where: {shortCode},
			select: {id: true},
		});

		if (!link) return;

		// Parse device/browser/OS from User-Agent string
		const parser = new UAParser(userAgent);
		const ua = parser.getResult();

		const deviceType = ua.device.type ?? 'desktop';
		const browser = ua.browser.name ?? null;
		const os = ua.os.name ?? null;

		// Geo lookup from IP — returns null if IP is private or unrecognized
		const geo = geoip.lookup(ip);

		await prisma.click.create({
			data: {
				linkId: link.id,
				country: geo?.country ?? null,
				city: geo?.city ?? null,
				device: deviceType,
				browser,
				os,
				referer: referer ?? null,
				ipHash: hashIp(ip),
			},
		});
	} catch (err) {
		// Analytics failure must never crash the redirect flow
		logger.error(`Failed to record click for ${shortCode}: ${(err as Error).message}`);
	}
};

// Returns all links owned by a user with click counts
export const getUserLinks = async (userId: string): Promise<object[]> => {
	const links = await prisma.link.findMany({
		where: {userId},
		select: {
			id: true,
			shortCode: true,
			originalUrl: true,
			isActive: true,
			expiresAt: true,
			createdAt: true,
			_count: {
				select: {clicks: true},
			},
		},
		orderBy: {createdAt: 'desc'},
	});

	return links;
};

// Toggles isActive on a link — only the owner can do this
export const toggleLinkStatus = async (
	shortCode: string,
	userId: string
): Promise<LinkResult> => {
	const link = await prisma.link.findUnique({
		where: {shortCode},
	});

	if (!link) {
		throw new NotFoundError('Link not found');
	}

	// Ownership check — must happen in service, not just route middleware
	if (link.userId !== userId) {
		throw new ForbiddenError('You do not own this link');
	}

	const updated = await prisma.link.update({
		where: {shortCode},
		data: {isActive: !link.isActive},
	});

	// Invalidate cache — status changed, cached value is now stale
	await cacheService.invalidateLink(shortCode);

	return updated;
};

// Deletes a link — only the owner can do this
export const deleteLink = async (
	shortCode: string,
	userId: string
): Promise<void> => {
	const link = await prisma.link.findUnique({
		where: {shortCode},
	});

	if (!link) {
		throw new NotFoundError('Link not found');
	}

	if (link.userId !== userId) {
		throw new ForbiddenError('You do not own this link');
	}

	await prisma.link.delete({where: {shortCode}});

	// Invalidate cache immediately — deleted link must stop redirecting now
	await cacheService.invalidateLink(shortCode);

	logger.info(`Link deleted: ${shortCode} by user ${userId}`);
};