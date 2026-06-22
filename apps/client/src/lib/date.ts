// Lightweight date utility — avoids pulling in a heavy library like date-fns for the one formatting function we need.
export const formatDistanceToNow = (dateStr: string): string => {
	const date = new Date(dateStr);
	const now = new Date();
	const diffMs = now.getTime() - date.getTime();
	const diffSecs = Math.floor(diffMs / 1000);
	const diffMins = Math.floor(diffSecs / 60);
	const diffHours = Math.floor(diffMins / 60);
	const diffDays = Math.floor(diffHours / 24);
	const diffMonths = Math.floor(diffDays / 30);

	if (diffSecs < 60) return 'just now';
	if (diffMins < 60) return `${diffMins}m ago`;
	if (diffHours < 24) return `${diffHours}h ago`;
	if (diffDays < 30) return `${diffDays}d ago`;
	if (diffMonths < 12) return `${diffMonths}mo ago`;
	return date.toLocaleDateString();
};