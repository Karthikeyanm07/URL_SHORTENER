import {ConflictError, UnauthorizedError, ValidationError} from '@/errors/AppError';
import {validatePassword} from '@/services/auth.service';

// Mock Prisma and Redis — we test logic, not DB/cache
jest.mock('@/db/prisma', () => ({
	prisma: {
		user: {
			findUnique: jest.fn(),
			create: jest.fn(),
		},
	},
}));

jest.mock('@/lib/redis', () => ({
	redis: {
		set: jest.fn(),
		get: jest.fn().mockResolvedValue(null),
		del: jest.fn(),
	},
}));

jest.mock('@/lib/logger', () => ({
	logger: {
		info: jest.fn(),
		warn: jest.fn(),
		error: jest.fn(),
		debug: jest.fn(),
	},
}));

// ─── validatePassword ─────────────────────────────────────────────────────────

describe('validatePassword', () => {
	it('throws if password is under 8 characters', () => {
		expect(() => validatePassword('Ab1')).toThrow(ValidationError);
		expect(() => validatePassword('Ab1')).toThrow('at least 8 characters');
	});

	it('throws if no uppercase letter', () => {
		expect(() => validatePassword('abcdefg1')).toThrow(ValidationError);
		expect(() => validatePassword('abcdefg1')).toThrow('uppercase');
	});

	it('throws if no number', () => {
		expect(() => validatePassword('Abcdefgh')).toThrow(ValidationError);
		expect(() => validatePassword('Abcdefgh')).toThrow('number');
	});

	it('passes for a valid password', () => {
		expect(() => validatePassword('ValidPass1')).not.toThrow();
	});
});

// ─── register ─────────────────────────────────────────────────────────────────

describe('register', () => {
	beforeEach(() => jest.clearAllMocks());

	it('throws ConflictError if email already exists', async () => {
		const {prisma} = await import('@/db/prisma');
		(prisma.user.findUnique as jest.Mock).mockResolvedValue({id: 'existing-id'});

		const {register} = await import('@/services/auth.service');
		await expect(register('taken@example.com', 'ValidPass1')).rejects.toThrow(ConflictError);
	});

	it('normalizes email to lowercase before storing', async () => {
		const {prisma} = await import('@/db/prisma');
		(prisma.user.findUnique as jest.Mock).mockResolvedValue(null);
		(prisma.user.create as jest.Mock).mockResolvedValue({
			id: 'new-id',
			email: 'user@example.com',
			createdAt: new Date(),
		});

		const {register} = await import('@/services/auth.service');
		await register('USER@EXAMPLE.COM', 'ValidPass1');

		expect(prisma.user.create).toHaveBeenCalledWith(
			expect.objectContaining({
				data: expect.objectContaining({
					email: 'user@example.com', // normalized
				}),
			})
		);
	});

	it('returns user without passwordHash in result', async () => {
		const {prisma} = await import('@/db/prisma');
		(prisma.user.findUnique as jest.Mock).mockResolvedValue(null);
		(prisma.user.create as jest.Mock).mockResolvedValue({
			id: 'new-id',
			email: 'user@example.com',
			createdAt: new Date(),
		});

		const {register} = await import('@/services/auth.service');
		const result = await register('user@example.com', 'ValidPass1');

		expect(result.user).not.toHaveProperty('passwordHash');
		expect(result.user).toHaveProperty('id');
		expect(result.user).toHaveProperty('email');
		expect(result.token).toBeTruthy();
	});
});

// ─── login ────────────────────────────────────────────────────────────────────

describe('login', () => {
	beforeEach(() => jest.clearAllMocks());

	it('throws UnauthorizedError for non-existent email', async () => {
		const {prisma} = await import('@/db/prisma');
		(prisma.user.findUnique as jest.Mock).mockResolvedValue(null);

		const {login} = await import('@/services/auth.service');
		await expect(login('nobody@example.com', 'ValidPass1')).rejects.toThrow(UnauthorizedError);
	});

	it('throws UnauthorizedError for wrong password', async () => {
		const bcrypt = await import('bcryptjs');
		const hash = await bcrypt.hash('RealPassword1', 12);

		const {prisma} = await import('@/db/prisma');
		(prisma.user.findUnique as jest.Mock).mockResolvedValue({
			id: 'user-id',
			email: 'user@example.com',
			passwordHash: hash,
			createdAt: new Date(),
		});

		const {login} = await import('@/services/auth.service');
		await expect(login('user@example.com', 'WrongPassword1')).rejects.toThrow(UnauthorizedError);
	});

	it('returns same error message for wrong email and wrong password — no enumeration', async () => {
		const {prisma} = await import('@/db/prisma');
		(prisma.user.findUnique as jest.Mock).mockResolvedValue(null);

		const {login} = await import('@/services/auth.service');

		let wrongEmailError: Error | null = null;
		try {
			await login('nobody@example.com', 'ValidPass1');
		} catch (e) {
			wrongEmailError = e as Error;
		}

		(prisma.user.findUnique as jest.Mock).mockResolvedValue({
			id: 'user-id',
			email: 'user@example.com',
			passwordHash: '$2a$12$invalidhash',
			createdAt: new Date(),
		});

		let wrongPasswordError: Error | null = null;
		try {
			await login('user@example.com', 'WrongPass1');
		} catch (e) {
			wrongPasswordError = e as Error;
		}

		// Both errors must be identical — prevents user enumeration
		expect(wrongEmailError?.message).toBe(wrongPasswordError?.message);
	});
});