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
});
