import Joi from 'joi';

export const envValidator = Joi.object({
  // General
  NODE_ENV: Joi.string(),
  HOST: Joi.string(),
  PORT: Joi.string(),
  SESSION_SECRET: Joi.string(),
  // Datbase
  DB_HOST: Joi.string().default('127.0.0.1'),
  DB_USER: Joi.string().default('operator'),
  DB_PASSWORD: Joi.string().default('qwerty'),
  DB_DATABASE: Joi.string().default('recording-oracle'),
  DB_PORT: Joi.string().default('5432'),
  DB_SSL: Joi.string().default('false'),
});
