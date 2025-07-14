import Joi from 'joi';

import { ChainIds } from '@/common/constants';
import * as httpUtils from '@/common/utils/http';

import { IntermediateResults } from './types';

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
  total_volume: Joi.number().positive().required(),
  participants_outcomes_batches: Joi.array()
    .items(participantsOutcomesBatchSchema)
    .required(),
});

const intermedateResultsSchema = Joi.object({
  chain_id: Joi.number().valid(ChainIds).required(),
  address: Joi.string().required(),
  exchange: Joi.string().required(),
  pair: Joi.string()
    .pattern(/^[A-Z]{3,10}\/[A-Z]{3,10}$/)
    .required(),
  results: Joi.array().items(intermediateResultSchema).required(),
}).options({ allowUnknown: true, stripUnknown: true });

export async function downloadIntermediateResults(
  url: string,
): Promise<IntermediateResults> {
  const resultsData = await httpUtils.downloadFile(url);

  try {
    const resultsJson = JSON.parse(resultsData.toString());
    const valudatedResults = Joi.attempt(resultsJson, intermedateResultsSchema);

    return valudatedResults;
  } catch {
    throw new Error('Invalid intermediate results schema');
  }
}
