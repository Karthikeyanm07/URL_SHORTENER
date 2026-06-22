// src/context/AuthContext.tsx
// Global auth state — user object, loading state, login/logout actions.
// Wrapped around the entire app so any component can access auth state.

import {createContext, ReactNode, useCallback, useContext, useEffect, useState,} from 'react';
import {authApi} from '@/services/api';
import type {User} from '@/types';

interface AuthContextValue {
	user: User | null;
	isLoading: boolean;
	isAuthenticated: boolean;
	login: (email: string, password: string) => Promise<void>;
	register: (email: string, password: string) => Promise<void>;
	logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export const AuthProvider = ({children}: { children: ReactNode }) => {
	const [user, setUser] = useState<User | null>(null);
	const [isLoading, setIsLoading] = useState(true);

	// On mount, check if user is already logged in via existing cookie
	useEffect(() => {
		const checkAuth = async () => {
			try {
				const res = await authApi.me();
				setUser(res.data.data.user);
			} catch {
				// No valid session — stay logged out, not an error
				setUser(null);
			} finally {
				setIsLoading(false);
			}
		};
		void checkAuth();
	}, []);

	const login = useCallback(async (email: string, password: string) => {
		const res = await authApi.login(email, password);
		setUser(res.data.data.user);
	}, []);

	const register = useCallback(async (email: string, password: string) => {
		const res = await authApi.register(email, password);
		setUser(res.data.data.user);
	}, []);

	const logout = useCallback(async () => {
		await authApi.logout();
		setUser(null);
	}, []);

	return (
		<AuthContext.Provider
			value={{
				user,
				isLoading,
				isAuthenticated: user !== null,
				login,
				register,
				logout,
			}}
		>
			{children}
		</AuthContext.Provider>
	);
};

// Named export — never useContext(AuthContext) directly in components
export const useAuth = (): AuthContextValue => {
	const ctx = useContext(AuthContext);
	if (!ctx) {
		throw new Error('useAuth must be used within AuthProvider');
	}
	return ctx;
};