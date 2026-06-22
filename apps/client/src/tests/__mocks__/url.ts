// Consistent short URL in tests — no env var needed
export const getShortUrl = (shortCode: string) =>
	`http://localhost:5000/${shortCode}`;