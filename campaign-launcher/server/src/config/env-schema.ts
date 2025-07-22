import * as Joi from 'joi';

import { EVM_ADDRESS_REGEX } from '@/common/constants';

export const envValidator = Joi.object({
  // General
  HOST: Joi.string(),
  PORT: Joi.number().integer(),
  // Web3
  RPC_URL_SEPOLIA: Joi.string().uri({ scheme: ['http', 'https'] }),
  RPC_URL_POLYGON: Joi.string().uri({ scheme: ['http', 'https'] }),
  RPC_URL_POLYGON_AMOY: Joi.string().uri({ scheme: ['http', 'https'] }),
  RPC_URL_LOCALHOST: Joi.string(),

  RECORDING_ORACLE: Joi.string().pattern(EVM_ADDRESS_REGEX).required(),
  REPUTATION_ORACLE: Joi.string().pattern(EVM_ADDRESS_REGEX).required(),
  // S3
  S3_ENDPOINT: Joi.string(),
  S3_PORT: Joi.number().integer(),
  S3_ACCESS_KEY: Joi.string().required(),
  S3_SECRET_KEY: Joi.string().required(),
  S3_BUCKET: Joi.string(),
  S3_USE_SSL: Joi.string().valid('true', 'false'),
});
