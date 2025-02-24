import ERC20Token from "./ERC20Token";

export default interface Position {
  tokenId: string;
  token0: ERC20Token;
  token1: ERC20Token;
  fee: string;
  liquidity: string;
  amount0: string;
  amount1: string;
}
