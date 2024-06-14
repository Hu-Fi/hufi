import { ChainId } from '@human-protocol/sdk';
import { Injectable } from '@nestjs/common';

@Injectable()
export class UniswapService {
  constructor() {}

  public async fetchTrades(
    chainId: number,
    operator: string,
    token: string,
    since: Date,
  ) {
    const { gql } = await this._importGraphQLRequest();
    const sinceTimestamp = Math.floor(since.getTime() / 1000);

    const sellTrades = await this._fetchSubgraph<{
      swaps: Array<{ amount0: string }>;
    }>(
      chainId,
      gql`
        query getSwaps($sender: String!, $token: String!, $since: Int!) {
          swaps(
            where: { sender: $sender, token0: $token, timestamp_gt: $since }
          ) {
            amount0
          }
        }
      `,
      {
        sender: operator,
        token,
        since: sinceTimestamp,
      },
    );

    const buyTrades = await this._fetchSubgraph<{
      swaps: Array<{ amount1: string }>;
    }>(
      chainId,
      gql`
        query getSwaps($sender: String!, $token: String!, $since: Int!) {
          swaps(
            where: { sender: $sender, token1: $token, timestamp_gt: $since }
          ) {
            amount1
          }
        }
      `,
      {
        sender: operator,
        token,
        since: sinceTimestamp,
      },
    );

    return [
      ...sellTrades.swaps.map((trade: any) => +trade.amount0),
      ...buyTrades.swaps.map((trade: any) => +trade.amount1),
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
    // TODO: Read subgraph URL from configuration
    switch (chainId) {
      case ChainId.SEPOLIA:
        return 'https://api.studio.thegraph.com/query/37613/human-uniswap-v3/version/latest';
      default:
        return '';
    }
  }
}
