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
});
