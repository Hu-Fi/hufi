import Joi from 'joi';

import { ChainIds } from '@/common/constants';
import * as httpUtils from '@/common/utils/http';

import { CampaignManifest, IntermediateResultsData } from './types';

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
  reserved_funds: Joi.number().min(0).required(),
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
  symbol: Joi.string().required(),
  results: Joi.array().items(intermediateResultSchema).required(),
}).options({ allowUnknown: true, stripUnknown: true });

export async function downloadIntermediateResults(
  url: string,
): Promise<IntermediateResultsData> {
  /**
   * TODO: add hash verification when we have it in subgraph
   */
  const resultsData = await httpUtils.downloadFile(url);

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

  return JSON.parse(manifestData);
}
