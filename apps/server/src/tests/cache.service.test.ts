const mockRedis = {
	get: jest.fn(),
	set: jest.fn(),
	del: jest.fn(),
};

jest.mock('@/lib/redis', () => ({redis: mockRedis}));
jest.mock('@/lib/logger', () => ({
	logger: {warn: jest.fn(), info: jest.fn(), error: jest.fn(), debug: jest.fn()},
}));

describe('cacheService', () => {
	beforeEach(() => jest.clearAllMocks());

	it('returns null on cache miss', async () => {
		mockRedis.get.mockResolvedValue(null);
		const {cacheService} = await import('@/services/cache.service');
		const result = await cacheService.getLink('missing');
		expect(result).toBeNull();
	});

	it('returns parsed object on cache hit', async () => {
		const cached = {originalUrl: 'https://example.com', isActive: true, expiresAt: null};
		mockRedis.get.mockResolvedValue(JSON.stringify(cached));

		const {cacheService} = await import('@/services/cache.service');
		const result = await cacheService.getLink('abc1234');
		expect(result).toEqual(cached);
	});

	it('sets key with correct TTL', async () => {
		mockRedis.set.mockResolvedValue('OK');
		const {cacheService} = await import('@/services/cache.service');

		await cacheService.setLink('abc1234', {
			originalUrl: 'https://example.com',
			isActive: true,
			expiresAt: null,
		});

		expect(mockRedis.set).toHaveBeenCalledWith(
			'link:abc1234',
			expect.any(String),
			'EX',
			3600 // 1 hour TTL
		);
	});

	it('does not throw if Redis is unavailable — cache failures are non-fatal', async () => {
		mockRedis.get.mockRejectedValue(new Error('Connection refused'));
		const {cacheService} = await import('@/services/cache.service');

		// Should return null, not throw
		await expect(cacheService.getLink('abc1234')).resolves.toBeNull();
	});

	it('invalidates by deleting the key', async () => {
		mockRedis.del.mockResolvedValue(1);
		const {cacheService} = await import('@/services/cache.service');
		await cacheService.invalidateLink('abc1234');
		expect(mockRedis.del).toHaveBeenCalledWith('link:abc1234');
	});
});