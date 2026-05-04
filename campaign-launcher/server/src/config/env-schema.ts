import * as Joi from 'joi';

import { EVM_ADDRESS_REGEX } from '@/common/constants';

const EVM_ADDRESS_SCHEMA = Joi.string().pattern(EVM_ADDRESS_REGEX);
const BOOL_STRING_SCHEMA = Joi.string().valid('true', 'false');
const RPC_URL_SCHEMA = Joi.string()
  .uri({ scheme: ['http', 'https'] })
  .allow('');

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
  RPC_URL_ETHEREUM: RPC_URL_SCHEMA,
  RPC_URL_SEPOLIA: RPC_URL_SCHEMA,
  RPC_URL_POLYGON: RPC_URL_SCHEMA,
  RPC_URL_POLYGON_AMOY: RPC_URL_SCHEMA,
  RPC_URL_LOCALHOST: Joi.string(),

  EXCHANGE_ORACLE: EVM_ADDRESS_SCHEMA.required(),
  RECORDING_ORACLE: EVM_ADDRESS_SCHEMA.required(),
  REPUTATION_ORACLE: EVM_ADDRESS_SCHEMA.required(),

  ALCHEMY_API_KEY: Joi.string().required(),

  // Cache
  VALKEY_HOST: Joi.alternatives()
    .try(Joi.string().ip({ version: ['ipv4'] }), Joi.string().hostname())
    .required(),
  VALKEY_PORT: Joi.number().positive().integer(),
  VALKEY_DB: Joi.number().integer().min(0).required(),
  VALKEY_TLS: BOOL_STRING_SCHEMA,

  // Exchanges
  FEATURE_BIGONE: BOOL_STRING_SCHEMA,
  FEATURE_BITMART: BOOL_STRING_SCHEMA,
  FEATURE_BYBIT: BOOL_STRING_SCHEMA,
  FEATURE_GATE: BOOL_STRING_SCHEMA,
  FEATURE_HTX: BOOL_STRING_SCHEMA,
  FEATURE_HYPERLIQUID: BOOL_STRING_SCHEMA,
  FEATURE_KRAKEN: BOOL_STRING_SCHEMA,
  FEATURE_MEXC: BOOL_STRING_SCHEMA,
  FEATURE_PANCAKESWAP: BOOL_STRING_SCHEMA,
  FEATURE_XT: BOOL_STRING_SCHEMA,
});
