import * as crypto from 'crypto';

import Joi from 'joi';

import * as httpUtils from '@/common/utils/http';

import type { CampaignManifest } from './types';

const manifestSchema = Joi.object({
  type: Joi.string().required(),
  exchange: Joi.string().required(),
  daily_volume_target: Joi.number().greater(0),
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
  const manifestData = await httpUtils.downloadFileAndVerifyHash(
    url,
    manifestHash,
    { algorithm: 'sha1' },
  );

  try {
    const manifestJson = JSON.parse(manifestData.toString());
    const validatedManifest = Joi.attempt(manifestJson, manifestSchema);

    return validatedManifest;
  } catch {
    throw new Error('Invalid manifest schema');
  }
}

export function calculateManifestHash(manifest: string): string {
  return crypto.createHash('sha1').update(manifest).digest('hex');
}
