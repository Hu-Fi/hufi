import * as Joi from 'joi';

const UUID_V4_SCHEMA = Joi.string().uuid({ version: 'uuidv4' });

export function isUuidV4(value: unknown): boolean {
  if (typeof value !== 'string') {
    return false;
  }

  const validationResult = UUID_V4_SCHEMA.validate(value);

  return validationResult.error === undefined;
}
