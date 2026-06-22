import {getShortUrl} from '@/lib/url';

describe('getShortUrl', () => {
	it('generates correct short URL with explicit base', () => {
		const url = getShortUrl('abc1234', 'https://my-app.up.railway.app');
		expect(url).toBe('https://my-app.up.railway.app/abc1234');
	});

	it('strips trailing slash from base URL', () => {
		const url = getShortUrl('abc1234', 'https://my-app.up.railway.app/');
		expect(url).toBe('https://my-app.up.railway.app/abc1234');
	});

	it('falls back to localhost:5000 when no base provided', () => {
		// Pass empty string to bypass env var — tests the fallback logic directly
		const url = getShortUrl('abc1234', '');
		// Empty string after replace is falsy — falls back to localhost:5000
		expect(url).toBe('http://localhost:5000/abc1234');
	});

	it('works with any 7-character short code', () => {
		expect(getShortUrl('aBcDeFg', 'https://example.com')).toBe(
			'https://example.com/aBcDeFg'
		);
		expect(getShortUrl('1234567', 'https://example.com')).toBe(
			'https://example.com/1234567'
		);
	});
});