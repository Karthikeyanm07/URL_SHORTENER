// src/middleware/validate.ts

import {NextFunction, Request, Response} from "express";
import {ZodError, ZodSchema} from "zod";
import {ValidationError} from "@/errors/AppError";

interface ValidateSchemas {
	body?: ZodSchema;
	params?: ZodSchema;
	query?: ZodSchema;
}

export const validate =
	(schemas: ValidateSchemas) =>
		(req: Request, _res: Response, next: NextFunction): void => {
			try {
				if (schemas.body) {
					req.body = schemas.body.parse(req.body);
				}

				if (schemas.params) {
					req.params = schemas.params.parse(req.params) as typeof req.params;
				}

				if (schemas.query) {
					const parsed = schemas.query.parse(req.query);
					// Express 5 made req.query a read-only getter — direct assignment throws.
					// We attach validated query to req object under a custom key instead,
					// then read it from there in controllers that use query validation.
					(req as Request & { validatedQuery: unknown }).validatedQuery = parsed;
				}

				next();
			} catch (err) {
				if (err instanceof ZodError) {
					const message = err.issues
						.map((issue) => `${issue.path.join(".")}: ${issue.message}`)
						.join(", ");
					next(new ValidationError(message));
				} else {
					next(err);
				}
			}
		};
