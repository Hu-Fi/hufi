import { Injectable, Logger } from '@nestjs/common';
import * as ccxt from 'ccxt';

import { SUPPORTED_DEX_LIST } from '../../common/constants/exchanges';
import { ExchangeType } from '../../common/types/exchange';

import { ExchangeDataDto } from './exchange.dto';

@Injectable()
export class ExchangeService {
  private readonly logger = new Logger(ExchangeService.name);

  constructor() {}

  public async getExchanges(): Promise<ExchangeDataDto[]> {
    const cexList: ExchangeDataDto[] = (
      ccxt.exchanges as unknown as string[]
    ).map((exchangeName) => {
      // eslint-disable-next-line import/namespace
      const exchange: ccxt.Exchange = new ccxt[exchangeName]();

      return {
        name: exchangeName,
        displayName: exchange.name,
        url: exchange.urls.www,
        logo: exchange.urls.logo,
        type: ExchangeType.CEX,
      };
    });

    return [...cexList, ...SUPPORTED_DEX_LIST];
  }

  public async getSymbols(exchangeName: string): Promise<string[]> {
    // eslint-disable-next-line import/namespace
    const exchange: ccxt.Exchange = new ccxt[exchangeName]();

    return exchange
      .loadMarkets()
      .then((markets) => {
        return Object.keys(markets);
      })
      .catch((error) => {
        this.logger.error(error);
        return [];
      });
  }
}
