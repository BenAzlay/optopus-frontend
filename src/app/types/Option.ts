import ERC20Token from "./ERC20Token";

export default interface Option {
  id: string;
  owner: string;
  tokenId: string;
  asset: ERC20Token;
  token0: ERC20Token;
  amount0: number;
  amount1: number;
  exercisedAmount: number;
  expiry: number;
  isCall: boolean;
  premium: number;
  strikePrice: number;
  token1: ERC20Token;
  totalSupply: number;
}
