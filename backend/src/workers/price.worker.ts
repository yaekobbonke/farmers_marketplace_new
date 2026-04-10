import { Worker } from 'bullmq';
import IORedis from 'ioredis';

// 1. Create the connection with the mandatory BullMQ setting
const connection = new IORedis({
  host: process.env.REDIS_HOST || 'localhost',
  port: Number(process.env.REDIS_PORT) || 6379,
  maxRetriesPerRequest: null, // <--- THIS IS THE FIX
});

// 2. Pass that connection to your Worker
const priceWorker = new Worker(
  'price-queue', 
  async (job) => {
    // your price logic here
  }, 
  { connection }
);