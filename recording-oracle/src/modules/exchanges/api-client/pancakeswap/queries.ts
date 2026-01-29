import { gql } from 'graphql-request';

import { MAX_PAGE_SIZE } from './constants';

const TOKEN_FRAGMENT = gql`
  fragment TokenFields on Token {
    id
    decimals
  }
`;

type SubgraphToken = {
  id: string;
  decimals: number;
};

export const GET_MAKER_SWAPS_QUERY = gql`
  query getMakerSwaps(
    $maker: Bytes
    $tokenIn: Bytes!
    $tokenOut: Bytes!
    $since: BigInt!
  ) {
    swaps(
      where: {
        account_: { id: $maker }
        tokenIn_: {id: $tokenIn }
        tokenOut_: {id: $tokenOut }
        timestamp_gte: $since
      }
      first: ${MAX_PAGE_SIZE}
      orderBy: timestamp
      orderDirection: asc
    ) {
      id
      hash
      nonce
      timestamp
      amountIn
      amountOut
      tokenIn {
        ...TokenFields
      }
      tokenOut {
        ...TokenFields
      }
    }
  }
  ${TOKEN_FRAGMENT}
`;

type SubgraphSwap = {
  id: string;
  hash: string;
  nonce: string;
  timestamp: string;
  amountIn: string;
  amountOut: string;
  tokenIn: SubgraphToken;
  tokenOut: SubgraphToken;
};

export type MakerSwap = Exclude<SubgraphSwap, 'id' | 'nonce'>;

export type LatestSwap = Pick<SubgraphSwap, 'hash' | 'timestamp'>;

export const GET_LATEST_SWAP_QUERY = gql`
  {
    swaps(first: 1, orderBy: timestamp, orderDirection: desc) {
      id
      blockNumber
      hash
      timestamp
      nonce
    }
  }
`;
