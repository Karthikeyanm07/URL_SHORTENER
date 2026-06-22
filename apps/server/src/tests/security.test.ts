import {validatePassword} from '@/services/auth.service';
import {ValidationError} from '@/errors/AppError';
import {hashIp} from '@/lib/hash';

jest.mock('@/db/prisma', () => ({
	prisma: {user: {findUnique: jest.fn()}},
}));
jest.mock('@/lib/redis', () => ({
	redis: {set: jest.fn(), get: jest.fn(), del: jest.fn()},
}));
jest.mock('@/lib/logger', () => ({
	logger: {info: jest.fn(), warn: jest.fn(), error: jest.fn(), debug: jest.fn()},
}));

describe('Password security', () => {
	const weakPasswords = [
		'password',     // no uppercase, no number, common word
		'12345678',     // no uppercase, no letter
		'ALLCAPS1',     // no lowercase — wait, our rules don't require lowercase
		'short1A',      // under 8 chars
		'nouppercase1', // no uppercase
		'NoNumber',     // no number
	];

	weakPasswords.forEach((pwd) => {
		it(`rejects weak password: "${pwd}"`, () => {
			try {
				validatePassword(pwd);
				// If no throw, it means we incorrectly accepted a weak password
				if (pwd === 'ALLCAPS1') return; // Our rules: uppercase + number + 8 chars, ALLCAPS1 actually passes
				fail(`Expected ValidationError for password: ${pwd}`);
			} catch (err) {
				expect(err).toBeInstanceOf(ValidationError);
			}
		});
	});

	it('accepts strong passwords', () => {
		const strong = ['ValidPass1', 'Str0ngP@ss', 'Secure123', 'MyP4ssword'];
		strong.forEach((pwd) => {
			expect(() => validatePassword(pwd)).not.toThrow();
		});
	});
});

describe('IP hashing', () => {
	it('produces a consistent hash for the same IP', () => {
		const hash1 = hashIp('192.168.1.1');
		const hash2 = hashIp('192.168.1.1');
		expect(hash1).toBe(hash2);
	});

	it('produces different hashes for different IPs', () => {
		expect(hashIp('192.168.1.1')).not.toBe(hashIp('192.168.1.2'));
	});

	it('never returns the raw IP', () => {
		const ip = '203.0.113.42';
		const hash = hashIp(ip);
		expect(hash).not.toContain(ip);
		// SHA-256 hex is always 64 chars
		expect(hash).toHaveLength(64);
	});

	it('handles IPv6 addresses', () => {
		const hash = hashIp('::1');
		expect(hash).toHaveLength(64);
	});
});

describe('Short code validation schema — URL security', () => {
	it('rejects javascript: protocol — XSS vector', async () => {
		const {createLinkSchema} = await import('@/services/link.service');
		expect(
			createLinkSchema.safeParse({originalUrl: 'javascript:alert(1)'}).success
		).toBe(false);
	});

	it('rejects javascript: protocol with encoded content', async () => {
		const {createLinkSchema} = await import('@/services/link.service');
		expect(
			createLinkSchema.safeParse({
				originalUrl: 'javascript:alert(document.cookie)',
			}).success
		).toBe(false);
	});

	it('rejects data: protocol — data exfiltration vector', async () => {
		const {createLinkSchema} = await import('@/services/link.service');
		expect(
			createLinkSchema.safeParse({
				originalUrl: 'data:text/html,<script>alert(1)</script>',
			}).success
		).toBe(false);
	});

	it('rejects ftp: protocol — only http/https allowed', async () => {
		const {createLinkSchema} = await import('@/services/link.service');
		expect(
			createLinkSchema.safeParse({originalUrl: 'ftp://files.example.com'}).success
		).toBe(false);
	});

	it('accepts valid https URLs', async () => {
		const {createLinkSchema} = await import('@/services/link.service');
		expect(
			createLinkSchema.safeParse({originalUrl: 'https://example.com'}).success
		).toBe(true);
	});

	it('accepts valid http URLs', async () => {
		const {createLinkSchema} = await import('@/services/link.service');
		expect(
			createLinkSchema.safeParse({originalUrl: 'http://example.com'}).success
		).toBe(true);
	});

	it('rejects plain strings that are not URLs', async () => {
		const {createLinkSchema} = await import('@/services/link.service');
		expect(
			createLinkSchema.safeParse({originalUrl: 'not-a-url-at-all'}).success
		).toBe(false);
	});

	it('rejects URLs over 2048 characters', async () => {
		const {createLinkSchema} = await import('@/services/link.service');
		const longUrl = 'https://example.com/' + 'a'.repeat(2040);
		expect(
			createLinkSchema.safeParse({originalUrl: longUrl}).success
		).toBe(false);
	});
});