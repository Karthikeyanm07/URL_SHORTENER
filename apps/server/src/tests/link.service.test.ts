import {ForbiddenError, GoneError, NotFoundError} from '@/errors/AppError';

jest.mock('@/db/prisma', () => ({
	prisma: {
		link: {
			findUnique: jest.fn(),
			create: jest.fn(),
			update: jest.fn(),
			delete: jest.fn(),
		},
		click: {
			create: jest.fn(),
		},
	},
}));

jest.mock('@/services/cache.service', () => ({
	cacheService: {
		getLink: jest.fn().mockResolvedValue(null),
		setLink: jest.fn().mockResolvedValue(undefined),
		invalidateLink: jest.fn().mockResolvedValue(undefined),
	},
}));

jest.mock('@/lib/nanoid', () => ({
	generateUniqueShortCode: jest.fn().mockResolvedValue('abc1234'),
}));

jest.mock('@/lib/logger', () => ({
	logger: {
		info: jest.fn(),
		warn: jest.fn(),
		error: jest.fn(),
		debug: jest.fn(),
	},
}));

// ─── createLink ───────────────────────────────────────────────────────────────

describe('createLink', () => {
	beforeEach(() => jest.clearAllMocks());

	it('creates an anonymous link when userId is null', async () => {
		const {prisma} = await import('@/db/prisma');
		const mockLink = {
			id: 'link-id',
			shortCode: 'abc1234',
			originalUrl: 'https://example.com',
			expiresAt: null,
			isActive: true,
			createdAt: new Date(),
			userId: null,
		};
		(prisma.link.create as jest.Mock).mockResolvedValue(mockLink);

		const {createLink} = await import('@/services/link.service');
		const result = await createLink(
			{originalUrl: 'https://example.com', expiresAt: null},
			null
		);

		expect(result.userId).toBeNull();
		expect(result.shortCode).toBe('abc1234');
	});

	it('rejects invalid URLs', async () => {
		const {createLinkSchema} = await import('@/services/link.service');
		const result = createLinkSchema.safeParse({originalUrl: 'not-a-url'});
		expect(result.success).toBe(false);
	});

	it('rejects URLs over 2048 characters', async () => {
		const {createLinkSchema} = await import('@/services/link.service');
		const longUrl = 'https://example.com/' + 'a'.repeat(2040);
		const result = createLinkSchema.safeParse({originalUrl: longUrl});
		expect(result.success).toBe(false);
	});
});

// ─── resolveLink ──────────────────────────────────────────────────────────────

describe('resolveLink', () => {
	beforeEach(() => jest.clearAllMocks());

	it('throws NotFoundError for unknown short code', async () => {
		const {prisma} = await import('@/db/prisma');
		(prisma.link.findUnique as jest.Mock).mockResolvedValue(null);

		const {resolveLink} = await import('@/services/link.service');
		await expect(resolveLink('unknown')).rejects.toThrow(NotFoundError);
	});

	it('throws GoneError for inactive link', async () => {
		const {prisma} = await import('@/db/prisma');
		(prisma.link.findUnique as jest.Mock).mockResolvedValue({
			originalUrl: 'https://example.com',
			isActive: false,
			expiresAt: null,
		});

		const {resolveLink} = await import('@/services/link.service');
		await expect(resolveLink('abc1234')).rejects.toThrow(GoneError);
	});

	it('throws GoneError for expired link', async () => {
		const {prisma} = await import('@/db/prisma');
		(prisma.link.findUnique as jest.Mock).mockResolvedValue({
			originalUrl: 'https://example.com',
			isActive: true,
			expiresAt: new Date('2020-01-01'), // past date
		});

		const {resolveLink} = await import('@/services/link.service');
		await expect(resolveLink('abc1234')).rejects.toThrow(GoneError);
	});

	it('returns originalUrl for valid active link', async () => {
		const {prisma} = await import('@/db/prisma');
		(prisma.link.findUnique as jest.Mock).mockResolvedValue({
			originalUrl: 'https://example.com',
			isActive: true,
			expiresAt: null,
		});

		const {resolveLink} = await import('@/services/link.service');
		const url = await resolveLink('abc1234');
		expect(url).toBe('https://example.com');
	});

	it('uses cached value when available', async () => {
		const {cacheService} = await import('@/services/cache.service');
		(cacheService.getLink as jest.Mock).mockResolvedValue({
			originalUrl: 'https://cached.com',
			isActive: true,
			expiresAt: null,
		});

		const {prisma} = await import('@/db/prisma');

		const {resolveLink} = await import('@/services/link.service');
		const url = await resolveLink('abc1234');

		expect(url).toBe('https://cached.com');
		// DB should NOT be queried — cache hit
		expect(prisma.link.findUnique).not.toHaveBeenCalled();
	});
});

// ─── deleteLink ───────────────────────────────────────────────────────────────

describe('deleteLink', () => {
	beforeEach(() => jest.clearAllMocks());

	it('throws ForbiddenError if user does not own the link', async () => {
		const {prisma} = await import('@/db/prisma');
		(prisma.link.findUnique as jest.Mock).mockResolvedValue({
			id: 'link-id',
			shortCode: 'abc1234',
			userId: 'owner-id',
		});

		const {deleteLink} = await import('@/services/link.service');
		await expect(deleteLink('abc1234', 'different-user-id')).rejects.toThrow(ForbiddenError);
	});

	it('invalidates cache on successful delete', async () => {
		const {prisma} = await import('@/db/prisma');
		(prisma.link.findUnique as jest.Mock).mockResolvedValue({
			id: 'link-id',
			shortCode: 'abc1234',
			userId: 'owner-id',
		});
		(prisma.link.delete as jest.Mock).mockResolvedValue({});

		const {cacheService} = await import('@/services/cache.service');
		const {deleteLink} = await import('@/services/link.service');
		await deleteLink('abc1234', 'owner-id');

		expect(cacheService.invalidateLink).toHaveBeenCalledWith('abc1234');
	});
});