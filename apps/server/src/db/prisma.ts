import 'dotenv/config';
import {PrismaClient} from '../../generated/prisma/client';
import {PrismaPg} from '@prisma/adapter-pg';
import {env} from '@/config/env';
import {logger} from '@/lib/logger';

const createPrismaClient = (): PrismaClient => {
	const adapter = new PrismaPg({
		connectionString: env.DATABASE_URL,
	});

	return new PrismaClient({
		adapter,
		log: [
			...(process.env.NODE_ENV === 'development'
				? [{emit: 'event', level: 'query'} as const]
				: []),
			{emit: 'event', level: 'error'},
			{emit: 'event', level: 'warn'},
		],
	});
};

const globalForPrisma = globalThis as unknown as {
	prisma: PrismaClient | undefined;
};

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV === 'development') {
	globalForPrisma.prisma = prisma;
}

if (process.env.NODE_ENV === 'development') {
	// @ts-expect-error — Prisma event typing requires casting
	prisma.$on('query', (event: { query: string; duration: number }) => {
		logger.debug(`Prisma Query: ${event.query} — ${event.duration}ms`);
	});
}

// @ts-expect-error — Prisma event typing requires casting
prisma.$on('error', (event: { message: string }) => {
	logger.error(`Prisma Error: ${event.message}`);
});