import { Queue } from "bullmq";
import { redis } from "../config/redis";

export const priceQueue = new Queue("price-scraper", {
  connection: redis,
});
