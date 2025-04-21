import { ChainId } from '@human-protocol/sdk';
import { Injectable, Logger } from '@nestjs/common';
import type { RequestDocument, Variables } from 'graphql-request';

import { Web3ConfigService } from '../../common/config/web3-config.service';
import { UNISWAP_V3_SUBGRAPH_ID } from '../../common/constants/subgraph';

@Injectable()
export class UniswapService {
  private readonly logger = new Logger(UniswapService.name);
  private readonly graphql = import('graphql-request');
  private readonly subgraphBase =
    'https://gateway-arbitrum.network.thegraph.com/api/';

  constructor(private readonly web3Config: Web3ConfigService) {}
  public async fetchTrades(
    chainId: number,
    operator: string,
    token: string,
    from: Date,
    to: Date,
  ): Promise<number[]> {
    this.logger.debug(
      `Uniswap fetchTrades ${operator} ${token} ${from.toISOString()} → ${to.toISOString()}`,
    );

    const url = this._getSubgraphURL(chainId);
    if (!url) {
      this.logger.warn(`No subgraph configured for chain ${chainId}`);
      return [];
    }

    const fromTs = Math.floor(from.getTime() / 1000);
    const toTs = Math.floor(to.getTime() / 1000);
    const origin = operator.toLowerCase();
    const tok = token.toLowerCase();

    const sell = await this._querySubgraph<{
      swaps: { amount0: string }[];
    }>(
      url,
      /* GraphQL */ `
        query ($origin: String!, $token: String!, $from: Int!, $to: Int!) {
          swaps(
            where: {
              origin: $origin
              token0: $token
              timestamp_gt: $from
              timestamp_lt: $to
            }
          ) {
            amount0
          }
        }
      `,
      { origin, token: tok, from: fromTs, to: toTs },
    );

    const buy = await this._querySubgraph<{
      swaps: { amount1: string }[];
    }>(
      url,
      /* GraphQL */ `
        query ($origin: String!, $token: String!, $from: Int!, $to: Int!) {
          swaps(
            where: {
              origin: $origin
              token1: $token
              timestamp_gt: $from
              timestamp_lt: $to
            }
          ) {
            amount1
          }
        }
      `,
      { origin, token: tok, from: fromTs, to: toTs },
    );

    return [
      ...sell.swaps.map((s) => Math.abs(+s.amount0)),
      ...buy.swaps.map((b) => Math.abs(+b.amount1)),
    ];
  }

  private async _querySubgraph<T>(
    url: string,
    document: RequestDocument,
    variables?: Variables,
  ): Promise<T> {
    const { request } = await this.graphql;
    return request<T>(url, document, variables);
  }

  private _getSubgraphURL(chainId: number): string | undefined {
    switch (chainId) {
      case ChainId.MAINNET:
      case ChainId.POLYGON:
      case ChainId.BSC_MAINNET:
        return this._fromId(UNISWAP_V3_SUBGRAPH_ID[chainId]);
      case ChainId.SEPOLIA:
        return 'https://api.studio.thegraph.com/query/37613/human-uniswap-v3/version/latest';
      default:
        return undefined;
    }
  }

  private _fromId(id: string | undefined): string | undefined {
    return id
      ? `${this.subgraphBase}${this.web3Config.subgraphAPIKey}/subgraphs/id/${id}`
      : undefined;
  }
}
