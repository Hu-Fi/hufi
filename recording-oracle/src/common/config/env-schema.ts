import Joi from 'joi';

export const envValidator = Joi.object({
  // General
  NODE_ENV: Joi.string(),
  HOST: Joi.string(),
  PORT: Joi.string(),
  SESSION_SECRET: Joi.string(),
  // Datbase
  POSTGRES_HOST: Joi.string().default('localhost'),
  POSTGRES_USER: Joi.string().default('user'),
  POSTGRES_PASSWORD: Joi.string().default('password'),
  POSTGRES_DB: Joi.string().default('recording-oracle'),
  POSTGRES_PORT: Joi.string().default('5432'),
  POSTGRES_SSL: Joi.string().default('false'),
});
