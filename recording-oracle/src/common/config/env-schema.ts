import Joi from 'joi';

export const envValidator = Joi.object({
  // General
  NODE_ENV: Joi.string(),
  HOST: Joi.string(),
  PORT: Joi.string(),
  SESSION_SECRET: Joi.string(),
  API_KEY: Joi.string(),
  // Auth
  JWT_PRIVATE_KEY: Joi.string().default('private.pem'),
  JWT_PUBLIC_KEY: Joi.string().default('public.pem'),
  // Datbase
  POSTGRES_HOST: Joi.string().default('localhost'),
  POSTGRES_USER: Joi.string().default('user'),
  POSTGRES_PASSWORD: Joi.string().default('password'),
  POSTGRES_DATABASE: Joi.string().default('recording-oracle'),
  POSTGRES_PORT: Joi.string().default('5432'),
  POSTGRES_SSL: Joi.string().default('false'),
  POSTGRES_LOGGING: Joi.string(),
});
