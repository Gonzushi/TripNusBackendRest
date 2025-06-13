export const redisConfig = {
  host: process.env.REDIS_HOST!,
  port: Number(process.env.REDIS_PORT),
  password: process.env.REDIS_PASSWORD!,
  enableReadyCheck: false,
  connectTimeout: 10000,
  keepAlive: 30000,
  retryStrategy: (times: number) => {
    const delay = Math.min(times * 100, 3000);
    console.log(`Retrying Redis in ${delay}ms...`);
    return delay;
  },
};

export const redisConfigBullMQ = {
  ...redisConfig,
  maxRetriesPerRequest: null,
};

export default redisConfig;
