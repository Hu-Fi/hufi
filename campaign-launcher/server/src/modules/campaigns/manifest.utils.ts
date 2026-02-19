import Joi from 'joi';

import * as httpUtils from '@/common/utils/http';

import type {
  CampaignManifest,
  CompetitiveMarketMakingCampaignManifest,
  HoldingCampaignManifest,
  ThresholdCampaignManifest,
  MarketMakingCampaignManifest,
} from './types';
import { CampaignType } from './types';

export function isMarketMakingManifest(
  manifest: CampaignManifest,
): manifest is MarketMakingCampaignManifest {
  return manifest.type === CampaignType.MARKET_MAKING;
}

export function isHoldingManifest(
  manifest: CampaignManifest,
): manifest is HoldingCampaignManifest {
  return manifest.type === CampaignType.HOLDING;
}

export function isCompetitiveMarketMakingManifest(
  manifest: CampaignManifest,
): manifest is CompetitiveMarketMakingCampaignManifest {
  return manifest.type === CampaignType.COMPETITIVE_MARKET_MAKING;
}

export function isThresholdManifest(
  manifest: CampaignManifest,
): manifest is ThresholdCampaignManifest {
  return manifest.type === CampaignType.THRESHOLD;
}

const marketMakingManifestSchema = Joi.object({
  type: Joi.string().valid(CampaignType.MARKET_MAKING).required(),
  exchange: Joi.string().required(),
  daily_volume_target: Joi.number().strict().greater(0).required(),
  pair: Joi.string()
    .pattern(/^[\dA-Z]{3,10}\/[\dA-Z]{3,10}$/)
    .required(),
  start_date: Joi.date().iso().required(),
  end_date: Joi.date().iso().greater(Joi.ref('start_date')).required(),
}).options({ allowUnknown: true, stripUnknown: true });

const holdingManifestSchema = Joi.object({
  type: Joi.string().valid(CampaignType.HOLDING).required(),
  exchange: Joi.string().required(),
  daily_balance_target: Joi.number().strict().greater(0).required(),
  symbol: Joi.string()
    .pattern(/^[\dA-Z]{3,10}$/)
    .required(),
  start_date: Joi.date().iso().required(),
  end_date: Joi.date().iso().greater(Joi.ref('start_date')).required(),
}).options({ allowUnknown: true, stripUnknown: true });

const competitiveMarketMakingManifestSchema = Joi.object({
  type: Joi.string().valid(CampaignType.COMPETITIVE_MARKET_MAKING).required(),
  exchange: Joi.string().required(),
  rewards_distribution: Joi.array()
    .items(Joi.number().strict().greater(0))
    .min(1)
    .required(),
  pair: Joi.string()
    .pattern(/^[\dA-Z]{3,10}\/[\dA-Z]{3,10}$/)
    .required(),
  start_date: Joi.date().iso().required(),
  end_date: Joi.date().iso().greater(Joi.ref('start_date')).required(),
}).options({ allowUnknown: true, stripUnknown: true });

const thresholdManifestSchema = Joi.object({
  type: Joi.string().valid(CampaignType.THRESHOLD).required(),
  exchange: Joi.string().required(),
  minimum_balance_target: Joi.number().strict().greater(0).required(),
  symbol: Joi.string()
    .pattern(/^[\dA-Z]{3,10}$/)
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
      case CampaignType.MARKET_MAKING:
        manifestSchema = marketMakingManifestSchema;
        break;
      case CampaignType.HOLDING:
        manifestSchema = holdingManifestSchema;
        break;
      case CampaignType.COMPETITIVE_MARKET_MAKING:
        manifestSchema = competitiveMarketMakingManifestSchema;
        break;
      case CampaignType.THRESHOLD:
        manifestSchema = thresholdManifestSchema;
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
