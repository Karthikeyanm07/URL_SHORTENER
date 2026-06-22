export interface User {
	id: string;
	email: string;
	createdAt: string;
}

export interface Link {
	id: string;
	shortCode: string;
	originalUrl: string;
	isActive: boolean;
	expiresAt: string | null;
	createdAt: string;
	userId: string | null;
	_count?: { clicks: number };
}

export interface ClickSummary {
	totalClicks: number;
	uniqueVisitors: number;
	topCountry: string | null;
	topBrowser: string | null;
	topDevice: string | null;
}

export interface TimelinePoint {
	date: string;
	clicks: number;
}

export interface BreakdownItem {
	label: string;
	count: number;
	percentage: number;
}

export interface AnalyticsBreakdown {
	byDevice: BreakdownItem[];
	byBrowser: BreakdownItem[];
	byCountry: BreakdownItem[];
	byOs: BreakdownItem[];
}

// API response wrapper — matches backend { success, data, error } shape
export interface ApiResponse<T> {
	success: boolean;
	data?: T;
	error?: string;
}

// Auth state
export interface AuthState {
	user: User | null;
	isLoading: boolean;
	isAuthenticated: boolean;
}