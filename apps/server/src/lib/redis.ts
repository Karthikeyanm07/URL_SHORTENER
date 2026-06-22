import Redis from "ioredis";
import {env} from "@/config/env";
import {logger} from "@/lib/logger";

const createRedisClient = (): Redis => {
	const client = new Redis(env.REDIS_URL, {
		maxRetriesPerRequest: 3,
		retryStrategy: (times: number) => {
			if (times > 3) {
				logger.error(`Redis max retries reached - giving up`);
				return null;
			}
			return times * 500;
		},

		reconnectOnError: (err: Error) => {
			logger.warn(`Redis reconnect triggered: ${err.message}`);
			return true;
		},
	});
	client.on("connect", () => {
		logger.info(`Redis client connected`);
	});
	client.on("ready", () => {
		logger.info(`Redis: ready to accept commands`);
	});
	client.on("error", (err: Error) => {
		logger.error(`Redis error: ${err.message}`);
	});
	client.on("close", () => {
		logger.warn("Redis: connection closed");
	});

	return client;
};

export const redis = createRedisClient();

