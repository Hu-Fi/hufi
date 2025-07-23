import Joi from 'joi';

import type { CampaignManifest } from './types';

const manifestSchema = Joi.object({
  type: Joi.string().required(),
  exchange: Joi.string().required(),
  daily_volume_target: Joi.number().greater(0).required(),
  pair: Joi.string()
    .pattern(/^[A-Z]{3,10}\/[A-Z]{3,10}$/)
    .required(),
  fund_token: Joi.string()
    .pattern(/^[A-Z]{3,10}$/)
    .required(),
  start_date: Joi.date().iso().required(),
  end_date: Joi.date().iso().greater(Joi.ref('start_date')).required(),
}).options({ allowUnknown: true, stripUnknown: true });

export function validateManifest(manifestJson: unknown): CampaignManifest {
  try {
    const validatedManifest = Joi.attempt(manifestJson, manifestSchema);

    return validatedManifest;
  } catch {
    throw new Error('Invalid manifest schema');
  }
}
