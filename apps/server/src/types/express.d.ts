import {User} from "../../generated/prisma/client";

declare global {
	namespace Express {
		interface Request {
			user?: Pick<User, "id" | "email">;
			// Validated + coerced query params from Zod middleware.
			// Express 5 made req.query read-only so we attach parsed values here.
			validatedQuery?: unknown;
		}
	}
}

export {};
