import Joi from 'joi';

import { ChainIds } from '@/common/constants';
import * as httpUtils from '@/common/utils/http';

import {
  CampaignManifest,
  CampaignType,
  CompetitiveCampaignManifest,
  IntermediateResultsData,
} from './types';

const participantOutcome = Joi.object({
  address: Joi.string().required(),
  score: Joi.number().strict().min(0).required(),
  total_volume: Joi.number().strict().min(0).optional(),
});

const participantsOutcomesBatchSchema = Joi.object({
  id: Joi.string().uuid({ version: 'uuidv4' }).required(),
  results: Joi.array().items(participantOutcome).required(),
});

const intermediateResultSchema = Joi.object({
  from: Joi.date().iso().required(),
  to: Joi.date().iso().greater(Joi.ref('from')).required(),
  reserved_funds: Joi.alternatives()
    .try(
      Joi.number().strict().positive(),
      Joi.string().pattern(/^\d+(\.\d+)?$/),
    )
    .required(),
  participants_outcomes_batches: Joi.array()
    .items(participantsOutcomesBatchSchema)
    .required(),
});

const intermedateResultsSchema = Joi.object({
  chain_id: Joi.number()
    .strict()
    .valid(...ChainIds)
    .required(),
  address: Joi.string().required(),
  exchange: Joi.string().required(),
  results: Joi.array().items(intermediateResultSchema).required(),
}).options({ allowUnknown: true, stripUnknown: false });

const competitiveManifestSchema = Joi.object({
  type: Joi.string().valid(CampaignType.COMPETITIVE_MARKET_MAKING).required(),
  exchange: Joi.string().required(),
  start_date: Joi.date().iso().required(),
  end_date: Joi.date().iso().greater(Joi.ref('start_date')).required(),
  pair: Joi.string()
    .pattern(/^[\dA-Z]{3,10}\/[\dA-Z]{3,10}$/)
    .required(),
  rewards_distribution: Joi.array()
    .items(Joi.number().strict().greater(0))
    .min(1)
    .required(),
}).options({ allowUnknown: true, stripUnknown: false });

export async function downloadIntermediateResults(
  url: string,
  hash: string,
): Promise<IntermediateResultsData> {
  const resultsData = await httpUtils.downloadFileAndVerifyHash(url, hash, {
    algorithm: 'sha256',
  });

  try {
    const resultsJson = JSON.parse(resultsData.toString());
    const valudatedResults = Joi.attempt(resultsJson, intermedateResultsSchema);

    return valudatedResults;
  } catch {
    throw new Error('Invalid intermediate results schema');
  }
}

export async function retrieveCampaignManifest(
  manifestOrUrl: string,
  manifestHash: string,
): Promise<CampaignManifest> {
  let manifestData;
  if (httpUtils.isValidHttpUrl(manifestOrUrl)) {
    const manifestContent = await httpUtils.downloadFileAndVerifyHash(
      manifestOrUrl,
      manifestHash,
      {
        algorithm: 'sha1',
      },
    );
    manifestData = manifestContent.toString();
  } else {
    manifestData = manifestOrUrl;
  }

  const manifest = JSON.parse(manifestData) as CampaignManifest;
  if (manifest.type !== CampaignType.COMPETITIVE_MARKET_MAKING) {
    return manifest as CampaignManifest;
  }

  try {
    const validatedManifest = Joi.attempt(
      manifest,
      competitiveManifestSchema,
    ) as CompetitiveCampaignManifest;

    const rewardsDistributionSum =
      validatedManifest.rewards_distribution.reduce(
        (acc, value) => acc + value,
        0,
      );
    if (rewardsDistributionSum > 100) {
      throw new Error('Invalid campaign manifest');
    }

    return validatedManifest;
  } catch {
    throw new Error('Invalid campaign manifest');
  }
}
