import Joi from 'joi';

export const envValidator = Joi.object({
  // General
  NODE_ENV: Joi.string(),
  HOST: Joi.string(),
  PORT: Joi.number(),
  API_KEY: Joi.string().required(),
  // S3
  S3_ENDPOINT: Joi.string().required(),
  S3_PORT: Joi.string().required(),
  S3_ACCESS_KEY: Joi.string().required(),
  S3_SECRET_KEY: Joi.string().required(),
  S3_BUCKET: Joi.string().required(),
  S3_USE_SSL: Joi.boolean(),
  // Web3
  WEB3_ENV: Joi.string().required(),
  SUBGRAPH_API_KEY: Joi.string().required(),
  RECORDING_ORACLE: Joi.string().required(),
  REPUTATION_ORACLE: Joi.string().required(),
  WEB3_PRIVATE_KEY: Joi.string().required(),
  GAS_PRICE_MULTIPLIER: Joi.number(),
  RPC_URL_MAINNET: Joi.string(),
  RPC_URL_SEPOLIA: Joi.string(),
  RPC_URL_POLYGON: Joi.string(),
  RPC_URL_POLYGON_AMOY: Joi.string(),
  RPC_URL_BSC_MAINNET: Joi.string(),
  RPC_URL_BSC_TESTNET: Joi.string(),
  RPC_URL_LOCALHOST: Joi.string(),
});
