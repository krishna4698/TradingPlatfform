import redis from "@repo/redis";
import { Redis } from "ioredis";

export const CALLBACK_QUEUE = "callback-queue";

export class RedisSubscriber {
  private client: Redis;
  private callbacks: Record<string, (data: Record<string, string>) => void>;

  constructor() {
    // Use the shared Redis package config so this subscriber connects to the same Redis as the rest of the app.
    this.client = redis.duplicate();
    this.callbacks = {};
    this.runLoop();
  }

  async runLoop() {
    // Keep the last seen stream id so xread does not skip messages after the first loop.
    let lastId = "$";

    while (true) {
      try {
        const response = await this.client.xread(
          "BLOCK",
          0,
          "STREAMS",
          CALLBACK_QUEUE,
          lastId
        );
        if (!response || response.length === 0) continue;

        const [, messages] = response[0]!;
        if (!messages || messages.length === 0) continue;

        for (const [id, rawFields] of messages) {
          lastId = id;
          const fields = rawFields as string[];

          const data: Record<string, string> = {};
          for (let i = 0; i < fields.length; i += 2)
            data[fields[i]!] = fields[i + 1]!;

          const callbackId = data.id;
          console.log(`[SUBSCRIBER] Received callback:`, data);

          const fn = callbackId ? this.callbacks[callbackId] : undefined;
          if (fn) {
            fn(data);
            delete this.callbacks[callbackId!];
          } else {
            console.log(`[SUBSCRIBER] No waiter for id: ${callbackId}`);
          }
        }
      } catch (err) {
        console.error(`[SUBSCRIBER] xread error:`, err);
      }
    }
  }

  waitForMessage(callbackId: number) {
    return new Promise<Record<string, string>>((resolve, reject) => {
      console.log(`[SUBSCRIBER] Waiting for callback id: ${callbackId}`);
      const callbackKey = String(callbackId);

      const timer = setTimeout(() => {
        if (this.callbacks[callbackKey]) {
          delete this.callbacks[callbackKey];
          reject(new Error("Timeout waiting for message"));
        }
      }, 5000);

      // Stream field values come back as strings, so the callback registry should use string keys too.
      this.callbacks[callbackKey] = (data: Record<string, string>) => {
        clearTimeout(timer);
        resolve(data);
      };
    });
  }
}
