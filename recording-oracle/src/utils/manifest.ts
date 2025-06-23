import Joi from 'joi';

import { SUPPORTED_EXCHANGE_NAMES } from '@/common/constants';
import type { CampaignManifest } from '@/common/types';

const manifestSchema = Joi.object({
  exchange: Joi.string()
    .valid(...SUPPORTED_EXCHANGE_NAMES)
    .required(),
  pair: Joi.string().required(),
  fund_token: Joi.string().required(),
  start_date: Joi.date().iso(),
  end_date: Joi.date().iso().greater(Joi.ref('start_date')).required(),
}).unknown();

export async function downloadCampaignManifest(
  url: string,
): Promise<CampaignManifest> {
  const response = await fetch(url);
  const manifestJson = await response.json();

  const validationResult = manifestSchema.validate(manifestJson);

  if (validationResult.error) {
    throw new Error(`Invalid manifest schema`);
  }

  return validationResult.value;
}
