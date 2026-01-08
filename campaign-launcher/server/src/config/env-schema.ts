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
  RPC_URL_ETHEREUM: Joi.string()
    .uri({ scheme: ['http', 'https'] })
    .allow(''),
  RPC_URL_SEPOLIA: Joi.string()
    .uri({ scheme: ['http', 'https'] })
    .allow(''),
  RPC_URL_POLYGON: Joi.string()
    .uri({ scheme: ['http', 'https'] })
    .allow(''),
  RPC_URL_POLYGON_AMOY: Joi.string()
    .uri({ scheme: ['http', 'https'] })
    .allow(''),
  RPC_URL_LOCALHOST: Joi.string(),

  EXCHANGE_ORACLE: Joi.string().pattern(EVM_ADDRESS_REGEX).required(),
  RECORDING_ORACLE: Joi.string().pattern(EVM_ADDRESS_REGEX).required(),
  REPUTATION_ORACLE: Joi.string().pattern(EVM_ADDRESS_REGEX).required(),

  ALCHEMY_API_KEY: Joi.string().required(),

  // Cache
  VALKEY_HOST: Joi.alternatives()
    .try(Joi.string().ip({ version: ['ipv4'] }), Joi.string().hostname())
    .required(),
  VALKEY_PORT: Joi.number().positive().integer(),
  VALKEY_DB: Joi.number().integer().min(0).required(),
});
