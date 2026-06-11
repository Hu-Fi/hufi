import Joi from 'joi';

import { CampaignType } from '@/common/constants';
import * as httpUtils from '@/common/utils/http';

import {
  CampaignDetails,
  CampaignManifestBase,
  CompetitiveMarketMakingCampaignDetails,
  HoldingCampaignDetails,
  MarketMakingCampaignDetails,
  ThresholdCampaignDetails,
  type CampaignManifest,
  type CompetitiveMarketMakingCampaignManifest,
  type ThresholdMarketMakingCampaignManifest,
  type HoldingCampaignManifest,
  type MarketMakingCampaignManifest,
  type ThresholdCampaignManifest,
  ThresholdMarketMakingCampaignDetails,
} from './types';

const TOKEN_SYMBOL_REGEX = /^[\dA-Z]{3,10}$/;
const TRADING_PAIR_REGEX = /^[\dA-Z]{3,10}\/[\dA-Z]{3,10}$/;

const baseManifestSchema = Joi.object({
  type: Joi.string().min(2).required(),
  exchange: Joi.string().min(2).required(),
  /**
   * Duration interval is [start_date, end_date)
   */
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
  pair: Joi.string().pattern(TRADING_PAIR_REGEX).required(),
  daily_volume_target: Joi.number().strict().positive().required(),
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
  pair: Joi.string().pattern(TRADING_PAIR_REGEX).required(),
  minimum_volume_required: Joi.number().strict().positive().required(),
  rewards_distribution: Joi.array()
    .items(Joi.number().strict().positive())
    .min(1)
    .required()
    .custom((values, helpers) => {
      const distributionSum = values.reduce(
        (acc: number, value: number) => acc + value,
        0,
      );
      if (distributionSum > 100) {
        return helpers.error('any.custom');
      }
      return values;
    })
    .messages({
      'any.custom':
        '"rewards_distribution" sum must be less than or equal to 100',
    }),
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

const thresholdMarketMakingManifestSchema = baseManifestSchema.keys({
  type: Joi.string().valid(CampaignType.THRESHOLD_MARKET_MAKING),
  pair: Joi.string().pattern(TRADING_PAIR_REGEX).required(),
  minimum_volume_target: Joi.number().strict().positive().required(),
  max_participants: Joi.number().strict().positive().integer().required(),
});
export function assertValidThresholdMarketMakingCampaignManifest(
  manifest: CampaignManifestBase,
): asserts manifest is ThresholdMarketMakingCampaignManifest {
  try {
    Joi.assert(manifest, thresholdMarketMakingManifestSchema);
  } catch {
    throw new Error('Invalid threshold market making campaign manifest schema');
  }
}

const holdingManifestSchema = baseManifestSchema.keys({
  type: Joi.string().valid(CampaignType.HOLDING),
  symbol: Joi.string().pattern(TOKEN_SYMBOL_REGEX).required(),
  daily_balance_target: Joi.number().strict().positive().required(),
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
  symbol: Joi.string().pattern(TOKEN_SYMBOL_REGEX).required(),
  minimum_balance_target: Joi.number().strict().positive().required(),
  max_participants: Joi.number().strict().positive().integer(),
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
        minimumVolumeRequired: _manifest.minimum_volume_required,
      };
      return {
        symbol: _manifest.pair,
        details,
      };
    }
    case CampaignType.THRESHOLD_MARKET_MAKING: {
      const _manifest = manifest as ThresholdMarketMakingCampaignManifest;
      const details: ThresholdMarketMakingCampaignDetails = {
        minimumVolumeTarget: _manifest.minimum_volume_target,
        maxParticipants: _manifest.max_participants,
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
        maxParticipants: _manifest.max_participants,
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
