// Tests auth state management — login, logout, session check on mount.
import {act, render, screen, waitFor} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {vi} from 'vitest';
import {AuthProvider, useAuth} from '@/context/AuthContext';

// Mock the API service — we test context logic, not HTTP
vi.mock('@/services/api', () => ({
	authApi: {
		me: vi.fn(),
		login: vi.fn(),
		register: vi.fn(),
		logout: vi.fn(),
	},
}));

// Simple component that reads from auth context — used to assert state
const AuthDisplay = () => {
	const {user, isAuthenticated, isLoading} = useAuth();
	if (isLoading) return <div>Loading...</div>;
	return (
		<div>
			<div data-testid="authenticated">{String(isAuthenticated)}</div>
			<div data-testid="email">{user?.email ?? 'none'}</div>
		</div>
	);
};

const LoginButton = () => {
	const {login} = useAuth();
	return (
		<button onClick={() => login('user@example.com', 'ValidPass1')}>
			Login
		</button>
	);
};

const LogoutButton = () => {
	const {logout} = useAuth();
	return <button onClick={() => logout()}>Logout</button>;
};

const renderWithAuth = (ui: React.ReactNode) =>
	render(<AuthProvider>{ui}</AuthProvider>);

describe('AuthContext', () => {
	beforeEach(() => vi.clearAllMocks());

	it('starts in loading state then resolves to unauthenticated when no session', async () => {
		const {authApi} = await import('@/services/api');
		(authApi.me as ReturnType<typeof vi.fn>).mockRejectedValue(
			new Error('Unauthorized')
		);

		renderWithAuth(<AuthDisplay/>);

		// Initially loading
		expect(screen.getByText('Loading...')).toBeInTheDocument();

		// Resolves to unauthenticated
		await waitFor(() => {
			expect(screen.getByTestId('authenticated')).toHaveTextContent('false');
		});
		expect(screen.getByTestId('email')).toHaveTextContent('none');
	});

	it('restores session when valid cookie exists on mount', async () => {
		const {authApi} = await import('@/services/api');
		(authApi.me as ReturnType<typeof vi.fn>).mockResolvedValue({
			data: {
				data: {
					user: {
						id: 'user-id',
						email: 'user@example.com',
						createdAt: '2026-01-01',
					},
				},
			},
		});

		renderWithAuth(<AuthDisplay/>);

		await waitFor(() => {
			expect(screen.getByTestId('authenticated')).toHaveTextContent('true');
		});
		expect(screen.getByTestId('email')).toHaveTextContent('user@example.com');
	});

	it('sets user on successful login', async () => {
		const {authApi} = await import('@/services/api');
		// Initial /me check fails — not logged in
		(authApi.me as ReturnType<typeof vi.fn>).mockRejectedValue(
			new Error('Unauthorized')
		);
		// Login succeeds
		(authApi.login as ReturnType<typeof vi.fn>).mockResolvedValue({
			data: {
				data: {
					user: {
						id: 'user-id',
						email: 'user@example.com',
						createdAt: '2026-01-01',
					},
				},
			},
		});

		renderWithAuth(
			<>
				<AuthDisplay/>
				<LoginButton/>
			</>
		);

		await waitFor(() => {
			expect(screen.getByTestId('authenticated')).toHaveTextContent('false');
		});

		await userEvent.click(screen.getByText('Login'));

		await waitFor(() => {
			expect(screen.getByTestId('authenticated')).toHaveTextContent('true');
			expect(screen.getByTestId('email')).toHaveTextContent('user@example.com');
		});
	});

	it('clears user on logout', async () => {
		const {authApi} = await import('@/services/api');
		// Start logged in
		(authApi.me as ReturnType<typeof vi.fn>).mockResolvedValue({
			data: {
				data: {
					user: {
						id: 'user-id',
						email: 'user@example.com',
						createdAt: '2026-01-01',
					},
				},
			},
		});
		(authApi.logout as ReturnType<typeof vi.fn>).mockResolvedValue({});

		renderWithAuth(
			<>
				<AuthDisplay/>
				<LogoutButton/>
			</>
		);

		await waitFor(() => {
			expect(screen.getByTestId('authenticated')).toHaveTextContent('true');
		});

		await act(async () => {
			await userEvent.click(screen.getByText('Logout'));
		});

		await waitFor(() => {
			expect(screen.getByTestId('authenticated')).toHaveTextContent('false');
			expect(screen.getByTestId('email')).toHaveTextContent('none');
		});
	});

	it('throws if useAuth is used outside AuthProvider', () => {
		// Suppress console.error for this expected throw
		const consoleSpy = vi
			.spyOn(console, 'error')
			.mockImplementation(() => {
			});

		expect(() => render(<AuthDisplay/>)).toThrow(
			'useAuth must be used within AuthProvider'
		);

		consoleSpy.mockRestore();
	});
});