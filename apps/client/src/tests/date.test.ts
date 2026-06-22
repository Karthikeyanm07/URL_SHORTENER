import {formatDistanceToNow} from '@/lib/date';

describe('formatDistanceToNow', () => {
	const now = new Date('2026-06-20T12:00:00Z');

	beforeEach(() => {
		vi.useFakeTimers();
		vi.setSystemTime(now);
	});

	afterEach(() => {
		vi.useRealTimers();
	});

	it('returns "just now" for very recent times', () => {
		const date = new Date(now.getTime() - 30 * 1000); // 30 seconds ago
		expect(formatDistanceToNow(date.toISOString())).toBe('just now');
	});

	it('returns minutes for times under an hour', () => {
		const date = new Date(now.getTime() - 5 * 60 * 1000); // 5 minutes ago
		expect(formatDistanceToNow(date.toISOString())).toBe('5m ago');
	});

	it('returns hours for times under a day', () => {
		const date = new Date(now.getTime() - 3 * 60 * 60 * 1000); // 3 hours ago
		expect(formatDistanceToNow(date.toISOString())).toBe('3h ago');
	});

	it('returns days for times under a month', () => {
		const date = new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000); // 5 days ago
		expect(formatDistanceToNow(date.toISOString())).toBe('5d ago');
	});

	it('returns months for times under a year', () => {
		const date = new Date(now.getTime() - 45 * 24 * 60 * 60 * 1000); // ~45 days ago
		expect(formatDistanceToNow(date.toISOString())).toBe('1mo ago');
	});

	it('returns locale date for times over a year', () => {
		const date = new Date('2024-01-01T00:00:00Z'); // over a year ago
		const result = formatDistanceToNow(date.toISOString());
		// Result is a locale date string — just verify it's not a relative format
		expect(result).not.toContain('ago');
		expect(result.length).toBeGreaterThan(0);
	});
});