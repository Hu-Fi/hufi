import Joi from 'joi';

export const envValidator = Joi.object({
  // General
  NODE_ENV: Joi.string().default('development'),
  HOST: Joi.string().default('localhost'),
  PORT: Joi.string().default(5002),
  SESSION_SECRET: Joi.string().default('secret'),
  // Auth
  HASH_SECRET: Joi.string().default('a328af3fc1dad15342cc3d68936008fa'),
  JWT_SECRET: Joi.string().default('secret'),
  JWT_ACCESS_TOKEN_EXPIRES_IN: Joi.string().default(1000000000),
  JWT_REFRESH_TOKEN_EXPIRES_IN: Joi.string().default(1000000000),
  // Database
  POSTGRES_TYPE: Joi.string().default('postgres'),
  POSTGRES_HOST: Joi.string().default('127.0.0.1'),
  POSTGRES_USER: Joi.string().default('user'),
  POSTGRES_PASSWORD: Joi.string().default('password'),
  POSTGRES_DATABASE: Joi.string().default('reputation-oracle'),
  POSTGRES_PORT: Joi.string().default('5432'),
  POSTGRES_SSL: Joi.string().default('false'),
  // Web3
  WEB3_ENV: Joi.string(),
  WEB3_PRIVATE_KEY: Joi.string().required(),
  GAS_PRICE_MULTIPLIER: Joi.number(),
  RPC_URL_POLYGON: Joi.string(),
  RPC_URL_POLYGON_AMOY: Joi.string(),
  RPC_URL_BSC_MAINNET: Joi.string(),
  RPC_URL_BSC_TESTNET: Joi.string(),
  RPC_URL_LOCALHOST: Joi.string(),
  // S3
  S3_ENDPOINT: Joi.string().default('127.0.0.1'),
  S3_PORT: Joi.string().default(9000),
  S3_ACCESS_KEY: Joi.string().required(),
  S3_SECRET_KEY: Joi.string().required(),
  S3_BUCKET: Joi.string().default('reputations'),
  S3_USE_SSL: Joi.string().default('false'),
});
