import * as crypto from 'crypto';

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
  manifestHash: string,
): Promise<CampaignManifest> {
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error('Failed to load manifest');
  }

  const manifestText = await response.text();
  const hash = calculateManifestHash(manifestText as string);

  if (hash !== manifestHash) {
    throw new Error('Invalid manifest hash');
  }

  try {
    const manifestJson = JSON.parse(manifestText);
    const validatedManifest = Joi.attempt(manifestJson, manifestSchema);

    return validatedManifest;
  } catch {
    throw new Error('Invalid manifest schema');
  }
}

export function calculateManifestHash(manifest: string): string {
  return crypto.createHash('sha1').update(manifest).digest('hex');
}
