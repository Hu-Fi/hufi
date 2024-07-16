import Joi from 'joi';

export const envValidator = Joi.object({
  // General
  NODE_ENV: Joi.string(),
  HOST: Joi.string(),
  PORT: Joi.number(),
  API_KEY: Joi.string().required(),
  CRON_SECRET: Joi.string().required(),
  // Auth
  JWT_PRIVATE_KEY: Joi.string().required(),
  JWT_PUBLIC_KEY: Joi.string().required(),
  JWT_ACCESS_TOKEN_EXPIRES_IN: Joi.number(),
  JWT_REFRESH_TOKEN_EXPIRES_IN: Joi.number(),
  // Datbase
  POSTGRES_HOST: Joi.string().required(),
  POSTGRES_USER: Joi.string().required(),
  POSTGRES_PASSWORD: Joi.string().required(),
  POSTGRES_DATABASE: Joi.string().required(),
  POSTGRES_PORT: Joi.string().required(),
  POSTGRES_SSL: Joi.boolean(),
  POSTGRES_LOGGING: Joi.string(),
  // Web3
  WEB3_ENV: Joi.string().required(),
  WEB3_PRIVATE_KEY: Joi.string().required(),
  GAS_PRICE_MULTIPLIER: Joi.number(),
  SUBGRAPH_API_KEY: Joi.string().required(),
  RPC_URL_MAINNET: Joi.string(),
  RPC_URL_SEPOLIA: Joi.string(),
  RPC_URL_POLYGON: Joi.string(),
  RPC_URL_POLYGON_AMOY: Joi.string(),
  RPC_URL_BSC_MAINNET: Joi.string(),
  RPC_URL_BSC_TESTNET: Joi.string(),
  RPC_URL_LOCALHOST: Joi.string(),
  // S3
  S3_ENDPOINT: Joi.string().required(),
  S3_PORT: Joi.string().required(),
  S3_ACCESS_KEY: Joi.string().required(),
  S3_SECRET_KEY: Joi.string().required(),
  S3_BUCKET: Joi.string().required(),
  S3_USE_SSL: Joi.boolean(),
  // Encryption
  PGP_PRIVATE_KEY: Joi.string().required(),
  PGP_PUBLIC_KEY: Joi.string().required(),
  PGP_PASSPHRASE: Joi.string(),
});
