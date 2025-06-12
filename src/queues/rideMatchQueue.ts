import { Queue } from "bullmq";
import redisConfigBullMQ from "../config/redisConfig";
import Redis from "ioredis";

const redisBullMQ = new Redis(redisConfigBullMQ);

export const rideMatchQueue = new Queue("ride-matching", {
  connection: redisBullMQ,
});
