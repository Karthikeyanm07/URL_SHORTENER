// src/middleware/authenticate.ts

import {NextFunction, Request, Response} from 'express';
import jwt from 'jsonwebtoken';
import {env} from '@/config/env';
import {UnauthorizedError} from '@/errors/AppError';
import {COOKIE_NAME} from '@/lib/cookie';
import {isTokenBlocked} from '@/services/auth.service';

interface JwtPayload {
	userId: string;
	email: string;
}

export const authenticate = async (
	req: Request,
	_res: Response,
	next: NextFunction
): Promise<void> => {
	try {
		const token = req.cookies?.[COOKIE_NAME] as string | undefined;

		if (!token) {
			throw new UnauthorizedError('No authentication token provided');
		}

		// Check blocklist before verifying — blocked tokens are instantly rejected
		// even if they're cryptographically valid
		const blocked = await isTokenBlocked(token);
		if (blocked) {
			throw new UnauthorizedError('Token has been invalidated');
		}

		const payload = jwt.verify(token, env.JWT_SECRET) as JwtPayload;

		req.user = {
			id: payload.userId,
			email: payload.email,
		};

		next();
	} catch (err) {
		if (err instanceof UnauthorizedError) {
			next(err);
		} else {
			next(new UnauthorizedError('Invalid or expired token'));
		}
	}
};

export const optionalAuthenticate = async (
	req: Request,
	_res: Response,
	next: NextFunction
): Promise<void> => {
	try {
		const token = req.cookies?.[COOKIE_NAME] as string | undefined;

		if (!token) {
			return next();
		}

		const blocked = await isTokenBlocked(token);
		if (blocked) {
			// Blocked token on optional route — treat as anonymous
			return next();
		}

		const payload = jwt.verify(token, env.JWT_SECRET) as JwtPayload;

		req.user = {
			id: payload.userId,
			email: payload.email,
		};

		next();
	} catch {
		next();
	}
};