import axios, {AxiosError} from "axios";

export const api = axios.create({
	baseURL: import.meta.env.VITE_API_URL ?? "",
	withCredentials: true,
	headers: {
		"Content-Type": "application/json",
	},
	timeout: 10000,
});

api.interceptors.response.use(
	(response) => response,
	(error: AxiosError<{ error?: string }>) => {
		const message =
			error.response?.data?.error ??
			error.message ??
			"An unexpected error occurred";
		return Promise.reject(new Error(message));
	},
);

// ─── Auth ─────────────────────────────────────────────────────────────────────
export const authApi = {
	register: (email: string, password: string) =>
		api.post<{ data: { user: import("@/types").User } }>(
			"/api/v1/auth/register",
			{email, password},
		),

	login: (email: string, password: string) =>
		api.post<{ data: { user: import("@/types").User } }>("/api/v1/auth/login", {
			email,
			password,
		}),

	logout: () => api.post("/api/v1/auth/logout"),

	me: () =>
		api.get<{ data: { user: import("@/types").User } }>("/api/v1/auth/me"),
};

// ─── Links ────────────────────────────────────────────────────────────────────
export const linksApi = {
	create: (originalUrl: string, expiresAt?: string) =>
		api.post<{ data: import("@/types").Link }>("/api/v1/links", {
			originalUrl,
			...(expiresAt && {expiresAt}),
		}),

	getMyLinks: () =>
		api.get<{ data: import("@/types").Link[] }>("/api/v1/links"),

	toggle: (shortCode: string) =>
		api.patch<{ data: import("@/types").Link }>(
			`/api/v1/links/${shortCode}/toggle`,
		),

	remove: (shortCode: string) => api.delete(`/api/v1/links/${shortCode}`),
};

// ─── Analytics ────────────────────────────────────────────────────────────────
export const analyticsApi = {
	summary: (shortCode: string) =>
		api.get<{
			data: {
				link: import("@/types").Link;
				summary: import("@/types").ClickSummary;
			};
		}>(`/api/v1/analytics/${shortCode}/summary`),

	timeline: (shortCode: string, days: number = 30) =>
		api.get<{ data: { timeline: import("@/types").TimelinePoint[] } }>(
			`/api/v1/analytics/${shortCode}/timeline`,
			{params: {days}},
		),

	breakdown: (shortCode: string) =>
		api.get<{ data: { breakdown: import("@/types").AnalyticsBreakdown } }>(
			`/api/v1/analytics/${shortCode}/breakdown`,
		),
};
