// src/tests/errors.test.ts

import {
	AppError,
	ConflictError,
	ForbiddenError,
	GoneError,
	NotFoundError,
	RateLimitError,
	UnauthorizedError,
	ValidationError,
} from '@/errors/AppError';

describe('AppError hierarchy', () => {
	it('ValidationError has statusCode 400', () => {
		const err = new ValidationError('bad input');
		expect(err.statusCode).toBe(400);
		expect(err.isOperational).toBe(true);
		expect(err instanceof AppError).toBe(true);
		expect(err instanceof Error).toBe(true);
	});

	it('UnauthorizedError has statusCode 401', () => {
		expect(new UnauthorizedError().statusCode).toBe(401);
	});

	it('ForbiddenError has statusCode 403', () => {
		expect(new ForbiddenError().statusCode).toBe(403);
	});

	it('NotFoundError has statusCode 404', () => {
		expect(new NotFoundError().statusCode).toBe(404);
	});

	it('ConflictError has statusCode 409', () => {
		expect(new ConflictError('conflict').statusCode).toBe(409);
	});

	it('GoneError has statusCode 410', () => {
		expect(new GoneError().statusCode).toBe(410);
	});

	it('RateLimitError has statusCode 429', () => {
		expect(new RateLimitError().statusCode).toBe(429);
	});

	it('preserves prototype chain for instanceof checks', () => {
		const err = new NotFoundError('not found');
		expect(err instanceof NotFoundError).toBe(true);
		expect(err instanceof AppError).toBe(true);
	});

	it('has a stack trace defined', () => {
		const err = new ValidationError('test');
		expect(err.stack).toBeDefined();
		expect(typeof err.stack).toBe('string');
		expect(err.stack!.length).toBeGreaterThan(0);
	});
});