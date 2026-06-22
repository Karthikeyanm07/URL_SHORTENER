import winston from "winston";

const {combine, timestamp, json, colorize, simple} = winston.format;

const isDevelopment = process.env.NODE_ENV === "development";

export const logger = winston.createLogger({
	level: isDevelopment ? "debug" : "info",
	format: combine(
		timestamp({format: "YYYY-MM-DD HH:mm:ss"}),
		isDevelopment ? combine(colorize(), simple()) : json(),
	),
	transports: [
		new winston.transports.Console(),

		...(!isDevelopment
			? [
				new winston.transports.File({
					filename: "logs/error.log",
					level: "error",
				}),
			]
			: []),
	],
});
