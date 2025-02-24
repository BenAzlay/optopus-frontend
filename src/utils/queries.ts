import { gql } from "graphql-request";

// GET OFFERS
export const getOptionsQuery = gql`
  query GetOptions {
    options(first: 1000, orderDirection: asc) {
      id
      owner
      tokenId
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
  token0: string;
  exercisedAmount: number;
  expiry: number;
  isCall: boolean;
  premium: number;
  strikePrice: number;
  token1: string;
  totalSupply: number;
}
