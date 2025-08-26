import * as crypto from 'crypto';

import Joi from 'joi';

import * as httpUtils from '@/common/utils/http';

import type { CampaignManifest } from './types';

const manifestSchema = Joi.object({
  type: Joi.string().required(),
  exchange: Joi.string().required(),
  daily_volume_target: Joi.number().greater(0).required(),
  pair: Joi.string()
    .pattern(/^[A-Z]{3,10}\/[A-Z]{3,10}$/)
    .required(),
  start_date: Joi.date().iso().required(),
  end_date: Joi.date().iso().greater(Joi.ref('start_date')).required(),
}).options({ allowUnknown: true, stripUnknown: true });

export async function downloadCampaignManifest(
  url: string,
  manifestHash: string,
): Promise<string> {
  const manifestData = await httpUtils.downloadFileAndVerifyHash(
    url,
    manifestHash,
    { algorithm: 'sha1' },
  );

  return manifestData.toString();
}

export function calculateManifestHash(manifest: string): string {
  return crypto.createHash('sha1').update(manifest).digest('hex');
}

export function validateSchema(manifest: string): CampaignManifest {
  try {
    const manifestJson = JSON.parse(manifest);
    const validatedManifest = Joi.attempt(manifestJson, manifestSchema);

    return validatedManifest;
  } catch {
    throw new Error('Invalid manifest schema');
  }
}
