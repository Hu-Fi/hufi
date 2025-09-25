import Joi from 'joi';

import * as httpUtils from '@/common/utils/http';

import {
  CampaignDetails,
  CampaignManifestBase,
  CampaignType,
  LiquidityCampaignDetails,
  VolumeCampaignDetails,
  type CampaignManifest,
  type LiquidityCampaignManifest,
  type VolumeCampaignManifest,
} from './types';

const baseManifestSchema = Joi.object({
  type: Joi.string().min(2).required(),
  exchange: Joi.string().min(2).required(),
  symbol: Joi.string().min(2).required(),
  start_date: Joi.date().iso().required(),
  end_date: Joi.date().iso().greater(Joi.ref('start_date')).required(),
}).options({ allowUnknown: true, stripUnknown: false });

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

export function validateBaseSchema(manifest: string): CampaignManifestBase {
  try {
    const manifestJson = JSON.parse(manifest);
    const validatedManifest = Joi.attempt(manifestJson, baseManifestSchema);

    return validatedManifest;
  } catch {
    throw new Error('Invalid manifest schema');
  }
}

const volumeManifestSchema = baseManifestSchema.keys({
  type: Joi.string().valid(CampaignType.VOLUME),
  symbol: Joi.string()
    .pattern(/^[A-Z]{3,10}\/[A-Z]{3,10}$/)
    .required(),
  daily_volume_target: Joi.number().greater(0).required(),
});
export function assertValidVolumeCampaignManifest(
  manifest: CampaignManifestBase,
): asserts manifest is VolumeCampaignManifest {
  try {
    Joi.assert(manifest, volumeManifestSchema);
  } catch {
    throw new Error('Invalid volume campaign manifest schema');
  }
}

const liquidityManifestSchema = baseManifestSchema.keys({
  type: Joi.string().valid(CampaignType.LIQUIDITY),
  symbol: Joi.string()
    .pattern(/^[A-Z]{3,10}$/)
    .required(),
  daily_balance_target: Joi.number().greater(0).required(),
});
export function assertValidLiquidityCampaignManifest(
  manifest: CampaignManifestBase,
): asserts manifest is LiquidityCampaignManifest {
  try {
    Joi.assert(manifest, liquidityManifestSchema);
  } catch {
    throw new Error('Invalid liquidity campaign manifest schema');
  }
}

export function extractCampaignDetails(
  manifest: CampaignManifest,
): CampaignDetails {
  switch (manifest.type) {
    case CampaignType.VOLUME: {
      const details: VolumeCampaignDetails = {
        dailyVolumeTarget: (manifest as VolumeCampaignManifest)
          .daily_volume_target,
      };
      return details;
    }
    case CampaignType.LIQUIDITY: {
      const details: LiquidityCampaignDetails = {
        dailyBalanceTarget: (manifest as LiquidityCampaignManifest)
          .daily_balance_target,
      };
      return details;
    }
    default:
      throw new Error(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        `Can't extract ${(manifest as any).type} campaign details`,
      );
  }
}
