import { ChainId } from '@human-protocol/sdk';
import { Injectable, Logger } from '@nestjs/common';

import { Web3ConfigService } from '../../common/config/web3-config.service';
import { UNISWAP_V3_SUBGRAPH_ID } from '../../common/constants/subgraph';

@Injectable()
export class UniswapService {
  private logger: Logger = new Logger(UniswapService.name);
  private subgraphBaseURL =
    'https://gateway-arbitrum.network.thegraph.com/api/';

  constructor(private web3ConfigService: Web3ConfigService) {}

  public async fetchTrades(
    chainId: number,
    operator: string,
    token: string,
    from: Date,
    to: Date,
  ) {
    this.logger.log(
      `Fetching trades for ${operator} on ${token} from ${from.toISOString()} to ${to.toISOString()}`,
    );

    const { gql } = await this._importGraphQLRequest();
    const fromTimestamp = Math.floor(from.getTime() / 1000);
    const toTimestamp = Math.floor(to.getTime() / 1000);

    const sellTrades = await this._fetchSubgraph<{
      swaps: Array<{ amount0: string }>;
    }>(
      chainId,
      gql`
        query getSwaps(
          $origin: String!
          $token: String!
          $from: Int!
          $to: Int!
        ) {
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
      {
        origin: operator.toLowerCase(),
        token: token.toLowerCase(),
        from: fromTimestamp,
        to: toTimestamp,
      },
    );

    const buyTrades = await this._fetchSubgraph<{
      swaps: Array<{ amount1: string }>;
    }>(
      chainId,
      gql`
        query getSwaps(
          $origin: String!
          $token: String!
          $from: Int!
          $to: Int!
        ) {
          swaps(
            where: {
              origin: $origin
              token1: $token
              timestamp_gt: $from
              timstamp_lt: $to
            }
          ) {
            amount1
          }
        }
      `,
      {
        origin: operator.toLowerCase(),
        token: token.toLowerCase(),
        from: fromTimestamp,
        to: toTimestamp,
      },
    );

    return [
      ...sellTrades.swaps.map((trade: any) => Math.abs(+trade.amount0)),
      ...buyTrades.swaps.map((trade: any) => Math.abs(+trade.amount1)),
    ];
  }

  private async _importGraphQLRequest() {
    return await import('graphql-request');
  }

  private async _fetchSubgraph<T>(
    chainId: number,
    document: string,
    variables?: any,
  ): Promise<T> {
    const { request } = await this._importGraphQLRequest();

    return await request<T>(this._getSubgraphURL(chainId), document, variables);
  }

  private _getSubgraphURL(chainId: number) {
    switch (chainId) {
      case ChainId.MAINNET:
      case ChainId.POLYGON:
      case ChainId.BSC_MAINNET:
        return this._getSubgraphURLFromId(UNISWAP_V3_SUBGRAPH_ID[chainId]);
      case ChainId.SEPOLIA:
        return 'https://api.studio.thegraph.com/query/37613/human-uniswap-v3/version/latest';
      default:
        return '';
    }
  }

  private _getSubgraphURLFromId(id: string) {
    return (
      this.subgraphBaseURL +
      this.web3ConfigService.subgraphAPIKey +
      '/subgraphs/id/' +
      id
    );
  }
}
