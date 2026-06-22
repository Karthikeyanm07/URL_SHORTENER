import {NextFunction, Request, Response} from "express";
import {AppError} from "@/errors/AppError";
import {logger} from "@/lib/logger";
import {env} from "@/config/env";

interface ErrorResponse {
	success: false;
	error: string;
	stack?: string;
}

export const errorHandler = (
	err: Error,
	req: Request,
	res: Response,
	_next: NextFunction,
): void => {
	logger.error({
		message: err.message,
		stack: err.stack,
		path: req.path,
		method: req.method,
		...(env.NODE_ENV === "development" && {body: req.body}),
	});

	if (err instanceof AppError) {
		// 401/403 are expected — don't pollute error logs with normal auth checks
		const logLevel = err.statusCode < 500 ? 'warn' : 'error';
		logger[logLevel]({
			message: err.message,
			path: req.path,
			method: req.method,
			statusCode: err.statusCode,
		});

		const response: ErrorResponse = {
			success: false,
			error: err.message,
			...(env.NODE_ENV === 'development' && {stack: err.stack}),
		};
		res.status(err.statusCode).json(response);
		return;
	}

	logger.error({
		message: err.message,
		stack: err.stack,
		path: req.path,
		method: req.method,
		...(env.NODE_ENV === 'development' && {body: req.body}),
	});

	const response: ErrorResponse = {
		success: false,
		error: 'An unexpected error occurred',
		...(env.NODE_ENV === 'development' && {stack: err.stack}),
	};
	res.status(500).json(response);
};

export const asyncHandler =
	(fn: (req: Request, res: Response, next: NextFunction) => Promise<void>) =>
		(req: Request, res: Response, next: NextFunction): void => {
			fn(req, res, next).catch(next);
		};
