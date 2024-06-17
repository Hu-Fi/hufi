import { CENTERALIZED_EXCHANGES } from '../constants';

export const isCenteralizedExchange = (exchangeName: string) => {
  return CENTERALIZED_EXCHANGES.includes(exchangeName);
};
