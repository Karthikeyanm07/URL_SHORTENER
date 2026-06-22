import {customAlphabet} from "nanoid";
import {prisma} from "@/db/prisma";
import {logger} from "@/lib/logger";

const ALPHABET = "abcdefghijkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const CODE_LENGTH = 7;
const MAX_ATTEMPTS = 5;

const generate = customAlphabet(ALPHABET, CODE_LENGTH);

export const generateUniqueShortCode = async (): Promise<string> => {
	for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
		const code = generate();

		const existing = await prisma.link.findUnique({
			where: {shortCode: code},
			select: {id: true},
		});
		if (!existing) {
			return code;
		}

		logger.warn(`Short code collision on attempt ${attempt}: ${code}`);
	}
	throw new Error(
		`Failed to generate unique short code after ${MAX_ATTEMPTS} attempts`,
	);
};
