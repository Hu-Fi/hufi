import * as Joi from 'joi';

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
  POSTGRES_SSL: Joi.string().valid('true', 'false'),
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
  USE_EXCHANGE_SANDBOX: Joi.string().valid('true', 'false'),
  // Web3
  WEB3_PRIVATE_KEY: Joi.string().required(),
  GAS_PRICE_MULTIPLIER: Joi.number().positive().integer(),
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
  ALCHEMY_API_KEY: Joi.string(),
  // S3
  S3_ENDPOINT: Joi.string(),
  S3_PORT: Joi.number().integer(),
  S3_ACCESS_KEY: Joi.string().required(),
  S3_SECRET_KEY: Joi.string().required(),
  S3_BUCKET: Joi.string(),
  S3_USE_SSL: Joi.string().valid('true', 'false'),
  // Logging
  LOG_EXCHANGE_PERMISSION_ERRORS: Joi.string().valid('true', 'false'),
});
