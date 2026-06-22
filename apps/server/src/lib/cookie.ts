// src/lib/cookie.ts
import {Response} from 'express';
import {env} from '@/config/env';

export const COOKIE_NAME = 'token';

const COOKIE_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;

export const setAuthCookie = (res: Response, token: string): void => {
	res.cookie(COOKIE_NAME, token, {
		httpOnly: true,
		secure: env.NODE_ENV === 'production',
		sameSite: env.NODE_ENV === 'production' ? 'strict' : 'lax',
		maxAge: COOKIE_MAX_AGE_MS,
		path: '/',
	});
};

export const clearAuthCookie = (res: Response): void => {
	res.cookie(COOKIE_NAME, '', {
		httpOnly: true,
		secure: env.NODE_ENV === 'production',
		sameSite: env.NODE_ENV === 'production' ? 'strict' : 'lax',
		maxAge: 0,
		path: '/',
	});
};