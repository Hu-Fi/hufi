import Joi from 'joi';

import * as httpUtils from '@/common/utils/http';

import type {
  CampaignManifest,
  LiquidityCampaignManifest,
  VolumeCampaignManifest,
} from './types';
import { CampaignType } from './types';

export function isVolumeManifest(
  manifest: CampaignManifest,
): manifest is VolumeCampaignManifest {
  return manifest.type === CampaignType.VOLUME;
}

export function isLiquidityManifest(
  manifest: CampaignManifest,
): manifest is LiquidityCampaignManifest {
  return manifest.type === CampaignType.LIQUIDITY;
}

const volumeManifestSchema = Joi.object({
  type: Joi.string().valid(CampaignType.VOLUME).required(),
  exchange: Joi.string().required(),
  daily_volume_target: Joi.number().greater(0).required(),
  symbol: Joi.string()
    .pattern(/^[A-Z]{3,10}\/[A-Z]{3,10}$/)
    .required(),
  start_date: Joi.date().iso().required(),
  end_date: Joi.date().iso().greater(Joi.ref('start_date')).required(),
}).options({ allowUnknown: true, stripUnknown: true });

const liquidityManifestSchema = Joi.object({
  type: Joi.string().valid(CampaignType.LIQUIDITY).required(),
  exchange: Joi.string().required(),
  daily_balance_target: Joi.number().greater(0).required(),
  symbol: Joi.string()
    .pattern(/^[A-Z]{3,10}$/)
    .required(),
  start_date: Joi.date().iso().required(),
  end_date: Joi.date().iso().greater(Joi.ref('start_date')).required(),
}).options({ allowUnknown: true, stripUnknown: true });

export async function donwload(
  manifestUrl: string,
  manifestHash: string,
): Promise<string> {
  const manifestData = await httpUtils.downloadFileAndVerifyHash(
    manifestUrl,
    manifestHash,
    { algorithm: 'sha1' },
  );

  return manifestData.toString();
}

export function validateSchema(manifestJson: unknown): CampaignManifest {
  try {
    let manifestSchema;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    switch ((manifestJson as any).type) {
      case CampaignType.VOLUME:
        manifestSchema = volumeManifestSchema;
        break;
      case CampaignType.LIQUIDITY:
        manifestSchema = liquidityManifestSchema;
        break;
      default:
        throw new Error('Unsupported campaign type');
    }
    const validatedManifest = Joi.attempt(manifestJson, manifestSchema);

    return validatedManifest;
  } catch {
    throw new Error('Invalid manifest schema');
  }
}
