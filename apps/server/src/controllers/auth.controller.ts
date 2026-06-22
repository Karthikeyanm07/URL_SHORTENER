// src/controllers/auth.controller.ts

import {NextFunction, Request, Response} from 'express';
import {asyncHandler} from '@/middleware/errorHandler';
import * as authService from '@/services/auth.service';
import {clearAuthCookie, COOKIE_NAME, setAuthCookie} from '@/lib/cookie';

export const register = asyncHandler(
	async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
		const {email, password} = req.body as {
			email: string;
			password: string;
		};

		authService.validatePassword(password);

		const {user, token} = await authService.register(email, password);

		setAuthCookie(res, token);

		res.status(201).json({
			success: true,
			data: {user},
		});
	}
);

export const login = asyncHandler(
	async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
		const {email, password} = req.body as {
			email: string;
			password: string;
		};

		const {user, token} = await authService.login(email, password);

		setAuthCookie(res, token);

		res.status(200).json({
			success: true,
			data: {user},
		});
	}
);

export const logout = asyncHandler(
	async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
		// Extract token before clearing the cookie
		const token = req.cookies?.[COOKIE_NAME] as string | undefined;

		// Blocklist the token so it can't be reused even if someone
		// captured it before logout — this is what makes logout truly secure
		if (token) {
			await authService.blockToken(token);
		}

		clearAuthCookie(res);

		res.status(200).json({
			success: true,
			message: 'Logged out successfully',
		});
	}
);

export const getMe = asyncHandler(
	async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
		const user = await authService.getMe(req.user!.id);

		res.status(200).json({
			success: true,
			data: {user},
		});
	}
);