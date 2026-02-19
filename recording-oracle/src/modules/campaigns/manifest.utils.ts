import Joi from 'joi';

import * as httpUtils from '@/common/utils/http';

import {
  CampaignDetails,
  CampaignManifestBase,
  CampaignType,
  CompetitiveMarketMakingCampaignDetails,
  HoldingCampaignDetails,
  MarketMakingCampaignDetails,
  ThresholdCampaignDetails,
  type CampaignManifest,
  type CompetitiveMarketMakingCampaignManifest,
  type HoldingCampaignManifest,
  type MarketMakingCampaignManifest,
  type ThresholdCampaignManifest,
} from './types';

const baseManifestSchema = Joi.object({
  type: Joi.string().min(2).required(),
  exchange: Joi.string().min(2).required(),
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

const marketMakingManifestSchema = baseManifestSchema.keys({
  type: Joi.string().valid(CampaignType.MARKET_MAKING),
  pair: Joi.string()
    .pattern(/^[\dA-Z]{3,10}\/[\dA-Z]{3,10}$/)
    .required(),
  daily_volume_target: Joi.number().strict().greater(0).required(),
});
export function assertValidMarketMakingCampaignManifest(
  manifest: CampaignManifestBase,
): asserts manifest is MarketMakingCampaignManifest {
  try {
    Joi.assert(manifest, marketMakingManifestSchema);
  } catch {
    throw new Error('Invalid market making campaign manifest schema');
  }
}

const competitiveMarketMakingManifestSchema = baseManifestSchema.keys({
  type: Joi.string().valid(CampaignType.COMPETITIVE_MARKET_MAKING),
  pair: Joi.string()
    .pattern(/^[\dA-Z]{3,10}\/[\dA-Z]{3,10}$/)
    .required(),
  rewards_distribution: Joi.array()
    .items(Joi.number().strict().greater(0))
    .min(1)
    .required(),
});
export function assertValidCompetitiveMarketMakingCampaignManifest(
  manifest: CampaignManifestBase,
): asserts manifest is CompetitiveMarketMakingCampaignManifest {
  try {
    Joi.assert(manifest, competitiveMarketMakingManifestSchema);
  } catch {
    throw new Error(
      'Invalid competitive market making campaign manifest schema',
    );
  }
}

const holdingManifestSchema = baseManifestSchema.keys({
  type: Joi.string().valid(CampaignType.HOLDING),
  symbol: Joi.string()
    .pattern(/^[\dA-Z]{3,10}$/)
    .required(),
  daily_balance_target: Joi.number().strict().greater(0).required(),
});
export function assertValidHoldingCampaignManifest(
  manifest: CampaignManifestBase,
): asserts manifest is HoldingCampaignManifest {
  try {
    Joi.assert(manifest, holdingManifestSchema);
  } catch {
    throw new Error('Invalid holding campaign manifest schema');
  }
}

const thresholdManifestSchema = baseManifestSchema.keys({
  type: Joi.string().valid(CampaignType.THRESHOLD),
  symbol: Joi.string()
    .pattern(/^[\dA-Z]{3,10}$/)
    .required(),
  minimum_balance_target: Joi.number().strict().greater(0).required(),
});
export function assertValidThresholdCampaignManifest(
  manifest: CampaignManifestBase,
): asserts manifest is ThresholdCampaignManifest {
  try {
    Joi.assert(manifest, thresholdManifestSchema);
  } catch {
    throw new Error('Invalid threshold campaign manifest schema');
  }
}

export function extractCampaignDetails(manifest: CampaignManifest): {
  symbol: string;
  details: CampaignDetails;
} {
  switch (manifest.type) {
    case CampaignType.MARKET_MAKING: {
      const _manifest = manifest as MarketMakingCampaignManifest;
      const details: MarketMakingCampaignDetails = {
        dailyVolumeTarget: _manifest.daily_volume_target,
      };
      return {
        symbol: _manifest.pair,
        details,
      };
    }
    case CampaignType.COMPETITIVE_MARKET_MAKING: {
      const _manifest = manifest as CompetitiveMarketMakingCampaignManifest;
      const details: CompetitiveMarketMakingCampaignDetails = {
        rewardsDistribution: _manifest.rewards_distribution,
      };
      return {
        symbol: _manifest.pair,
        details,
      };
    }
    case CampaignType.HOLDING: {
      const _manifest = manifest as HoldingCampaignManifest;
      const details: HoldingCampaignDetails = {
        dailyBalanceTarget: _manifest.daily_balance_target,
      };
      return {
        symbol: _manifest.symbol,
        details,
      };
    }
    case CampaignType.THRESHOLD: {
      const _manifest = manifest as ThresholdCampaignManifest;
      const details: ThresholdCampaignDetails = {
        minimumBalanceTarget: _manifest.minimum_balance_target,
      };
      return {
        symbol: _manifest.symbol,
        details,
      };
    }
    default:
      throw new Error(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        `Can't extract ${(manifest as any).type} campaign details`,
      );
  }
}
