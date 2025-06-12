export const redisConfig = {
  host: process.env.REDIS_HOST!,
  port: Number(process.env.REDIS_PORT),
  password: process.env.REDIS_PASSWORD!,
};

export const redisConfigBullMQ = {
  ...redisConfig,
  maxRetriesPerRequest: null,
};

export default redisConfig;
