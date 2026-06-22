export const getShortUrl = (
	shortCode: string,
	base?: string
): string => {
	const rawBase =
		base !== undefined
			? base  // explicit override (including empty string for testing)
			: (import.meta.env.VITE_SHORT_URL_BASE ?? '');

	const resolvedBase = rawBase.replace(/\/$/, '') || 'http://localhost:5000';
	return `${resolvedBase}/${shortCode}`;
};