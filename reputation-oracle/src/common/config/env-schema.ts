import Joi from 'joi';

export const envValidator = Joi.object({
  // General
  NODE_ENV: Joi.string(),
  HOST: Joi.string(),
  PORT: Joi.number(),
  // Auth
  HASH_SECRET: Joi.string().required(),
  JWT_SECRET: Joi.string().required(),
  JWT_ACCESS_TOKEN_EXPIRES_IN: Joi.number(),
  JWT_REFRESH_TOKEN_EXPIRES_IN: Joi.number(),
  // Database
  POSTGRES_HOST: Joi.string().required(),
  POSTGRES_USER: Joi.string().required(),
  POSTGRES_PASSWORD: Joi.string().required(),
  POSTGRES_DATABASE: Joi.string().required(),
  POSTGRES_PORT: Joi.string().required(),
  POSTGRES_SSL: Joi.boolean(),
  // Web3
  WEB3_ENV: Joi.string().required(),
  WEB3_PRIVATE_KEY: Joi.string().required(),
  GAS_PRICE_MULTIPLIER: Joi.number(),
  RECORDING_ORACLE: Joi.string().required(),
  REPUTATION_ORACLE: Joi.string().required(),
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
});
