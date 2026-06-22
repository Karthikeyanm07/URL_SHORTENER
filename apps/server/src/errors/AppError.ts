export class AppError extends Error {
	public readonly statusCode: number;
	public readonly isOperational: boolean;

	constructor(message: string, statusCode: number, isOperational = true) {
		super(message);
		this.statusCode = statusCode;
		this.isOperational = isOperational;

		Object.setPrototypeOf(this, new.target.prototype);
		Error.captureStackTrace(this, this.constructor);
	}
}

export class ValidationError extends AppError {
	constructor(message: string) {
		super(message, 400);
	}
}

export class UnauthorizedError extends AppError {
	constructor(message = "Authentication required") {
		super(message, 401);
	}
}

export class ForbiddenError extends AppError {
	constructor(message = "You do not have permission to perform this action") {
		super(message, 403);
	}
}

export class NotFoundError extends AppError {
	constructor(message = 'Resource not found') {
		super(message, 404);
	}
}

export class ConflictError extends AppError {
	constructor(message: string) {
		super(message, 409);
	}
}

export class GoneError extends AppError {
	constructor(message = 'This link has been deactivated') {
		super(message, 410);
	}
}

export class RateLimitError extends AppError {
	constructor(message = 'Too many requests. Please slow down.') {
		super(message, 429);
	}
}