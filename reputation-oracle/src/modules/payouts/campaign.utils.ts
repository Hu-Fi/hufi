import dayjs from 'dayjs';
import Joi from 'joi';

import { ChainIds } from '@/common/constants';
import * as decimalUtils from '@/common/utils/decimal';
import * as httpUtils from '@/common/utils/http';

import {
  CampaignManifest,
  CampaignWithResults,
  IntermediateResultsData,
} from './types';

const participantOutcome = Joi.object({
  address: Joi.string().required(),
  score: Joi.number().required(),
  total_volume: Joi.number().min(0).required(),
});

const participantsOutcomesBatchSchema = Joi.object({
  id: Joi.string().uuid({ version: 'uuidv4' }).required(),
  results: Joi.array().items(participantOutcome).required(),
});

const intermediateResultSchema = Joi.object({
  from: Joi.date().iso().required(),
  to: Joi.date().iso().greater(Joi.ref('from')).required(),
  total_volume: Joi.number().min(0).required(),
  participants_outcomes_batches: Joi.array()
    .items(participantsOutcomesBatchSchema)
    .required(),
});

const intermedateResultsSchema = Joi.object({
  chain_id: Joi.number()
    .valid(...ChainIds)
    .required(),
  address: Joi.string().required(),
  exchange: Joi.string().required(),
  pair: Joi.string()
    .pattern(/^[A-Z]{3,10}\/[A-Z]{3,10}$/)
    .required(),
  results: Joi.array().items(intermediateResultSchema).required(),
}).options({ allowUnknown: true, stripUnknown: true });

export async function downloadIntermediateResults(
  url: string,
): Promise<IntermediateResultsData> {
  const resultsData = await httpUtils.downloadFile(url);

  try {
    const resultsJson = JSON.parse(resultsData.toString());
    const valudatedResults = Joi.attempt(resultsJson, intermedateResultsSchema);

    return valudatedResults;
  } catch {
    throw new Error('Invalid intermediate results schema');
  }
}

export async function downloadCampaignManifest(
  url: string,
  manifestHash: string,
): Promise<CampaignManifest> {
  const manifestData = await httpUtils.downloadFileAndVerifyHash(
    url,
    manifestHash,
    { algorithm: 'sha1' },
  );

  return JSON.parse(manifestData.toString());
}

export function calculateDailyReward(
  campaign: CampaignWithResults,
  manifest: CampaignManifest,
): number {
  const campaignDurationDays = Math.ceil(
    dayjs(manifest.end_date).diff(manifest.start_date, 'days', true),
  );

  return decimalUtils.div(campaign.fundAmount, campaignDurationDays);
}
