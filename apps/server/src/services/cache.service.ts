import {redis} from "@/lib/redis";
import {logger} from "@/lib/logger";

export interface CachedLink {
	originalUrl: string;
	isActive: boolean;
	expiresAt: string | null;
}

const LINK_TTL_SECONDS = 3600;

export const cacheService = {
	async getLink(shortCode: string): Promise<CachedLink | null> {
		try {
			const cached = await redis.get(`link/${shortCode}`);
			if (!cached) return null;
			return JSON.parse(cached) as CachedLink;
		} catch (err) {
			logger.warn(
				`Cached read failed for ${shortCode}: ${(err as Error).message}`,
			);
			return null;
		}
	},
	async setLink(shortCode: string, link: CachedLink): Promise<void> {
		try {
			await redis.set(
				`link:${shortCode}`,
				JSON.stringify(link),
				"EX",
				LINK_TTL_SECONDS,
			);
		} catch (err) {
			logger.warn(
				`Cached read failed for ${shortCode}: ${(err as Error).message}`,
			);
		}
	},
	async invalidateLink(shortCode: string): Promise<void> {
		try {
			await redis.del(`link:${shortCode}`);
		} catch (err) {
			logger.warn(`Cache validation failed for ${shortCode}: ${(err as Error).message}`);
		}
	}
};
