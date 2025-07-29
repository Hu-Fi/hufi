import * as Joi from 'joi';

import { EVM_ADDRESS_REGEX } from '@/common/constants';

export const envValidator = Joi.object({
  // General
  HOST: Joi.string(),
  PORT: Joi.number().integer(),
  // Web3
  /**
   * Allow empty strings for URLs to pass validation,
   * because for the code it's the same case
   * as absence of value, but more conveninent for CI/CD.
   */
  RPC_URL_SEPOLIA: Joi.string()
    .uri({ scheme: ['http', 'https'] })
    .allow(''),
  RPC_URL_POLYGON: Joi.string()
    .uri({ scheme: ['http', 'https'] })
    .allow(''),
  RPC_URL_POLYGON_AMOY: Joi.string()
    .uri({ scheme: ['http', 'https'] })
    .allow(''),
  RPC_URL_AURORA_TESTNET: Joi.string()
    .uri({ scheme: ['http', 'https'] })
    .allow(''),
  RPC_URL_LOCALHOST: Joi.string(),

  RECORDING_ORACLE: Joi.string().pattern(EVM_ADDRESS_REGEX).required(),
  REPUTATION_ORACLE: Joi.string().pattern(EVM_ADDRESS_REGEX).required(),
});
