import { config } from "dotenv";
import { Redis, type RedisOptions } from "ioredis";
import { fileURLToPath } from "node:url";

config();
config({ path: fileURLToPath(new URL("../.env", import.meta.url)) });

const redisUrl = process.env.REDIS_URL;

const redisOptions: RedisOptions = {
  lazyConnect: process.env.NODE_ENV === "test",
  maxRetriesPerRequest: null,
};

export const redis = redisUrl
  ? new Redis(redisUrl, redisOptions)
  : new Redis({
      host: process.env.REDIS_HOST ?? "127.0.0.1",
      port: Number(process.env.REDIS_PORT ?? 6379),
      password: process.env.REDIS_PASSWORD,
      db: Number(process.env.REDIS_DB ?? 0),
      ...redisOptions,
    });

export default redis;
