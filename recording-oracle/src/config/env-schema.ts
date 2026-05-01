import * as Joi from 'joi';

const BOOL_STRING_SCHEMA = Joi.string().valid('true', 'false');
const RPC_URL_SCHEMA = Joi.string()
  .uri({ scheme: ['http', 'https'] })
  .allow('');

export const envValidator = Joi.object({
  // General
  HOST: Joi.string(),
  PORT: Joi.number().integer(),

  // Database
  POSTGRES_HOST: Joi.string(),
  POSTGRES_USER: Joi.string(),
  POSTGRES_PASSWORD: Joi.string(),
  POSTGRES_DATABASE: Joi.string(),
  POSTGRES_PORT: Joi.number().integer(),
  POSTGRES_SSL: BOOL_STRING_SCHEMA,
  POSTGRES_LOGGING: Joi.string(),
  POSTGRES_URL: Joi.string().uri(),

  // Auth
  JWT_PRIVATE_KEY: Joi.string()
    .required()
    .pattern(
      /^-----BEGIN EC PRIVATE KEY-----[\s\S]+-----END EC PRIVATE KEY-----$/,
    )
    .message('Invalid JWT_PRIVATE_KEY format (expecting EC PEM format)'),
  JWT_PUBLIC_KEY: Joi.string()
    .required()
    .pattern(/^-----BEGIN PUBLIC KEY-----[\s\S]+-----END PUBLIC KEY-----$/)
    .message('Invalid JWT_PUBLIC_KEY format (expecting PEM)'),
  JWT_ACCESS_TOKEN_EXPIRES_IN: Joi.number().integer().min(60),
  JWT_REFRESH_TOKEN_EXPIRES_IN: Joi.number().integer().min(60),

  // Encryption
  AES_ENCRYPTION_KEY: Joi.string().required().length(32),

  // Exchange
  USE_EXCHANGE_SANDBOX: BOOL_STRING_SCHEMA,
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
  PANCAKESWAP_SUBGRAPH_URL: Joi.string()
    .uri({ scheme: ['https'] })
    .allow(''),

  // Web3
  WEB3_PRIVATE_KEY: Joi.string().required(),
  GAS_PRICE_MULTIPLIER: Joi.number().positive().integer(),
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
  ALCHEMY_API_KEY: Joi.string().required(),
  SUBGRAPH_API_KEY: Joi.string().required(),

  // S3
  S3_ENDPOINT: Joi.string(),
  S3_PORT: Joi.number().integer(),
  S3_ACCESS_KEY: Joi.string().required(),
  S3_SECRET_KEY: Joi.string().required(),
  S3_BUCKET: Joi.string(),
  S3_USE_SSL: BOOL_STRING_SCHEMA,

  // Cache
  VALKEY_HOST: Joi.alternatives()
    .try(Joi.string().ip({ version: ['ipv4'] }), Joi.string().hostname())
    .required(),
  VALKEY_PORT: Joi.number().positive().integer(),
  VALKEY_DB: Joi.number().integer().min(0).required(),
  VALKEY_TLS: BOOL_STRING_SCHEMA,

  // Logging
  LOG_EXCHANGE_PERMISSION_ERRORS: BOOL_STRING_SCHEMA,

  // Campaigns
  FEATURE_LIMIT_HOLDING_JOIN: BOOL_STRING_SCHEMA,
  STORE_RESULTS_TIMEOUT: Joi.number().integer().min(30),
});
