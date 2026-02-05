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

export const GET_ACCOUNT_SWAPS_QUERY = gql`
  query getMakerSwaps(
    $account: Bytes!
    $tokenIn: Bytes!
    $tokenOut: Bytes!
    $since: BigInt!
    $until: BigInt!
    $skip: Int
  ) {
    swaps(
      where: {
        account_: { id: $account }
        tokenIn_: {id: $tokenIn }
        tokenOut_: {id: $tokenOut }
        timestamp_gte: $since
        timestamp_lt: $until
      }
      first: ${MAX_PAGE_SIZE}
      skip: $skip
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

export type SubgraphSwapData = {
  id: string;
  hash: string;
  nonce: string;
  timestamp: string;
  amountIn: string;
  amountOut: string;
  tokenIn: SubgraphToken;
  tokenOut: SubgraphToken;
};

export const GET_LATEST_SWAP_QUERY = gql`
  query getLatestSwap($timestamp: BigInt!) {
    swaps(
      where: { timestamp_gte: $timestamp }
      first: 1
      orderBy: timestamp
      orderDirection: desc
    ) {
      id
      blockNumber
      hash
      timestamp
      nonce
    }
  }
`;
