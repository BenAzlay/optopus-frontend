import { gql } from "graphql-request";

// GET OPTIONS
export const getOptionsQuery = gql`
  query GetOptions {
    options(first: 1000, orderDirection: asc) {
      id
      owner
      tokenId
      asset
      token0
      exercisedAmount
      expiry
      isCall
      premium
      strikePrice
      token1
      totalSupply
    }
  }
`;

export interface Option {
  id: string;
  owner: string;
  tokenId: string;
  asset: string;
  token0: string;
  amount0: number;
  amount1: number;
  exercisedAmount: number;
  expiry: number;
  isCall: boolean;
  premium: number;
  strikePrice: number;
  token1: string;
  totalSupply: number;
}
