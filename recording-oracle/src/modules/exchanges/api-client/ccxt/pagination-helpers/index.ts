import { ExchangeName } from '@/common/constants';
import Environment from '@/common/utils/environment';

import * as bitmartHelpers from './bitmart';
import * as bybitHelpers from './bybit';
import * as gateHelpers from './gate';
import * as htxHelpers from './htx';
import * as mexcHelpers from './mexc';
import * as testHelpers from './test';
import type { GetPaginationInputFn, HandlePaginationResponseFn } from './types';
import * as xtHelpers from './xt';

const safeWrapHandlePaginationResponse: (
  fn: HandlePaginationResponseFn,
) => HandlePaginationResponseFn = (fn) => {
  return (input) => {
    if (input.trades.length === 0) {
      throw new Error('Should not be called with empty trades');
    }
    return fn(input);
  };
};

type PaginationHelpers = {
  getPaginationInput: GetPaginationInputFn;
  handlePaginationResponse: HandlePaginationResponseFn;
};

export function getPaginationHelpers(
  exchangeName: ExchangeName,
): PaginationHelpers {
  let paginationHelpers: PaginationHelpers;

  switch (exchangeName) {
    case ExchangeName.BITMART: {
      paginationHelpers = bitmartHelpers;
      break;
    }
    case ExchangeName.BYBIT: {
      paginationHelpers = bybitHelpers;
      break;
    }
    case ExchangeName.GATE: {
      paginationHelpers = gateHelpers;
      break;
    }
    case ExchangeName.HTX: {
      paginationHelpers = htxHelpers;
      break;
    }
    case ExchangeName.MEXC: {
      paginationHelpers = mexcHelpers;
      break;
    }
    case ExchangeName.XT: {
      paginationHelpers = xtHelpers;
      break;
    }
    default: {
      if (Environment.isTest()) {
        paginationHelpers = testHelpers;
        break;
      }
      throw new Error(
        `Pagination mechanism should be defined for ${exchangeName}`,
      );
    }
  }

  return {
    getPaginationInput: paginationHelpers.getPaginationInput,
    handlePaginationResponse: safeWrapHandlePaginationResponse(
      paginationHelpers.handlePaginationResponse,
    ),
  };
}
