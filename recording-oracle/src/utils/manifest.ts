import Joi from 'joi';

import { SUPPORTED_EXCHANGE_NAMES } from '@/common/constants';
import type { CampaignManifest } from '@/common/types';

const manifestSchema = Joi.object({
  exchange: Joi.string()
    .valid(...SUPPORTED_EXCHANGE_NAMES)
    .required(),
  pair: Joi.string()
    .pattern(/^[A-Z]{3,10}\/[A-Z]{3,10}$/)
    .required(),
  fund_token: Joi.string()
    .pattern(/^[A-Z]{3,10}$/)
    .required(),
  start_date: Joi.date().iso(),
  end_date: Joi.date().iso().greater(Joi.ref('start_date')).required(),
}).options({ allowUnknown: true, stripUnknown: true });

export async function downloadCampaignManifest(
  url: string,
): Promise<CampaignManifest> {
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error('Failed to load manifest');
  }

  try {
    const manifestJson = await response.json();

    const validatedManifest = Joi.attempt(manifestJson, manifestSchema);

    return validatedManifest;
  } catch {
    throw new Error(`Invalid manifest schema`);
  }
}
