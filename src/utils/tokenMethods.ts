import ERC20Token from "@/app/types/ERC20Token";
import { ethers, ZeroAddress } from "ethers";
import { ContractFunctionParameters, erc20Abi, zeroAddress } from "viem";
import { readContract, readContracts } from "wagmi/actions";
import { abi as priceFeedAbi } from "@/abi/aggregatorV3InterfaceAbi";
import { abi as OptopusAbi } from "@/abi/OptopusAbi";
import { abi as NonfungiblePositionManagerAbi } from "@/abi/NonfungiblePositionManagerAbi";
import { abi as UniswapV3PoolAbi } from "@/abi/UniswapV3PoolAbi";
import { abi as UniswapV3FactoryAbi } from "@/abi/UniswapV3FactoryAbi";
import CONSTANTS from "./constants";
import { compareEthereumAddresses } from "./utilFunc";
import { config } from "@/wagmiConfig";
import { Pool, Position } from "@uniswap/v3-sdk";
import { Token } from "@uniswap/sdk-core";
import { default as OptopusPosition } from "@/app/types/Position";

const calculatePriceFromFeedResult = (
  priceFeedResult: number | null,
  priceFeedDecimals: number | null
): number => {
  return priceFeedResult && priceFeedDecimals
    ? Number(priceFeedResult) / 10 ** priceFeedDecimals
    : 0;
};

/**
 * Fetches token details (symbol, decimals, and logo) for the provided token addresses.
 *
 * @param tokenAddresses - Array of tokens ERC20 addresses.
 * @returns A promise resolving to an array of ERC20Token objects.
 */
export const getTokenDetails = async (
  tokenAddresses: string[]
): Promise<ERC20Token[]> => {
  try {
    // Filter out invalid addresses and remove doubles
    const uniqueAddresses = Array.from(new Set(tokenAddresses)).filter(
      (address) => !!ethers.isAddress(address)
    );

    const contracts: ContractFunctionParameters[] = uniqueAddresses.flatMap(
      (address) => {
        // If address of Chainlink price feed is in constant, use it
        const priceFeedAddress =
          CONSTANTS.TOKENS.find((token) =>
            compareEthereumAddresses(token.address, address)
          )?.priceFeedAddress ?? zeroAddress;
        return [
          {
            address: address as `0x${string}`,
            abi: erc20Abi,
            chainId: 8453,
            functionName: "symbol",
          },
          {
            address: address as `0x${string}`,
            abi: erc20Abi,
            chainId: 8453,
            functionName: "decimals",
          },
          {
            address: priceFeedAddress as `0x${string}`,
            abi: priceFeedAbi,
            chainId: 8453,
            functionName: "latestAnswer",
          },
          {
            address: priceFeedAddress as `0x${string}`,
            abi: priceFeedAbi,
            chainId: 8453,
            functionName: "decimals",
          },
        ];
      }
    );

    const rawResults = await readContracts(config, { contracts });

    const results = rawResults.map(({ result }) => result);

    return uniqueAddresses.map((address, index) => {
      const baseIndex = index * 4; // Each token has 4 calls: symbol, decimals, latestAnswer, feed decimals

      const symbol: string = results[baseIndex] as string;
      const decimals: number = results[baseIndex + 1] as number;
      const priceFeedResult = results[baseIndex + 2] as number | null;
      const priceFeedDecimals = results[baseIndex + 3] as number | null;

      const price = calculatePriceFromFeedResult(
        priceFeedResult,
        priceFeedDecimals
      );

      const logo: string = `/tokenLogos/${symbol}.png`;

      return {
        address,
        symbol,
        decimals,
        logo,
        price,
      };
    });
  } catch (error) {
    console.error("getTokenDetails ERROR:", error);
    return [];
  }
};

export const getTokenBalance = async (
  tokenAddress: string | undefined,
  userAddress: string | undefined
): Promise<string> => {
  try {
    if (!ethers.isAddress(userAddress)) {
      throw new Error("Invalid user address");
    }

    if (!ethers.isAddress(tokenAddress)) {
      throw new Error("Invalid ERC20 token address");
    }

    const result = await readContract(config, {
      address: tokenAddress as `0x${string}`,
      abi: erc20Abi,
      chainId: 8453,
      functionName: "balanceOf",
      args: [userAddress as `0x${string}`],
    });

    return String(result);
  } catch (error) {
    console.error("getTokenDetails ERROR:", error);
    return "0";
  }
};

export const getTokenAllowance = async (
  tokenAddress: string | undefined,
  userAddress: string | undefined,
  contractAddress: string | undefined
): Promise<string> => {
  try {
    if (!ethers.isAddress(userAddress)) {
      throw new Error("Invalid user address");
    }

    if (!ethers.isAddress(tokenAddress)) {
      throw new Error("Invalid ERC20 token address");
    }

    if (!ethers.isAddress(contractAddress)) {
      throw new Error("Invalid contract address");
    }

    const result = await readContract(config, {
      address: tokenAddress as `0x${string}`,
      abi: erc20Abi,
      chainId: 8453,
      functionName: "allowance",
      args: [userAddress as `0x${string}`, contractAddress as `0x${string}`],
    });

    return String(result);
  } catch (error) {
    console.error("getTokenAllowance ERROR:", error);
    return "0";
  }
};

export const getApprovedPosition = async (
  tokenId: string | undefined
): Promise<string> => {
  try {
    if (!tokenId) {
      throw new Error("Invalid token id");
    }

    return await readContract(config, {
      address: CONSTANTS.NONFUNGIBLE_POSITION_MANAGER_CONTRACT as `0x${string}`,
      abi: NonfungiblePositionManagerAbi,
      chainId: 8453,
      functionName: "getApproved",
      args: [BigInt(tokenId)],
    });
  } catch (error) {
    console.error("getApprovedPosition ERROR:", error);
    return ZeroAddress;
  }
};

export const getUniswapV3NonfungiblePositions = async (
  userAddress: `0x${string}` | undefined
): Promise<OptopusPosition[]> => {
  try {
    // If no user is connected, return empty array
    if (!ethers.isAddress(userAddress)) return [];

    const {
      OPTOPUS_CONTRACT: optopusContractAddress,
      NONFUNGIBLE_POSITION_MANAGER_CONTRACT: positionManagerAddress,
      UNISWAPV3_FACTORY_CONTRACT: uniswapV3Factory,
    } = CONSTANTS;
    // Get total count of NFTs
    const nftCount = await readContract(config, {
      address: positionManagerAddress as `0x${string}`,
      abi: NonfungiblePositionManagerAbi,
      functionName: "balanceOf",
      args: [userAddress as `0x${string}`],
    });

    // Get tokenId and underlying ERC20 tokens
    const fetchPromises = Array.from({ length: Number(nftCount) }, (_, i) => {
      return (async () => {
        try {
          // Get the actual NFT tokenId
          const tokenId = await readContract(config, {
            address: positionManagerAddress as `0x${string}`,
            abi: NonfungiblePositionManagerAbi,
            functionName: "tokenOfOwnerByIndex",
            args: [userAddress as `0x${string}`, BigInt(i)],
          });

          // Query Uniswap V3 for the position’s underlying tokens
          const [
            nonce,
            operator,
            token0Addr,
            token1Addr,
            fee,
            tickLower,
            tickUpper,
            liquidity,
          ] = await readContract(config, {
            address: positionManagerAddress as `0x${string}`,
            abi: NonfungiblePositionManagerAbi,
            functionName: "positions",
            args: [tokenId],
          });

          // Check if token0 or token1 are supported by Optopus
          const supportedResults = await readContracts(config, {
            contracts: [
              {
                address: optopusContractAddress as `0x${string}`,
                abi: OptopusAbi,
                functionName: "supportedAssets",
                args: [token0Addr as `0x${string}`],
              },
              {
                address: optopusContractAddress as `0x${string}`,
                abi: OptopusAbi,
                functionName: "supportedAssets",
                args: [token1Addr as `0x${string}`],
              },
            ],
          });

          const [token0IsSupported, token1IsSupported] = supportedResults.map(
            ({ result }) => result
          );
          console.log(`token0IsSupported:`, token0IsSupported);
          console.log(`token1IsSupported:`, token1IsSupported);

          // If either tokens are not supported, skip
          if (!token0IsSupported || !token1IsSupported) return null;

          // Get the pool address from the UniswapV3Factory
          const poolAddress = await readContract(config, {
            address: uniswapV3Factory as `0x${string}`,
            abi: UniswapV3FactoryAbi,
            functionName: "getPool",
            args: [token0Addr, token1Addr, fee],
          });

          // If no pool found, skip
          if (poolAddress === ethers.ZeroAddress) return null;

          // We now read pool's slot0() to get sqrtPriceX96, tick, etc.
          const slot0Data = await readContract(config, {
            address: poolAddress as `0x${string}`,
            abi: UniswapV3PoolAbi,
            functionName: "slot0",
          });
          const [sqrtPriceX96, tickCurrent] = slot0Data;

          // Also read the total in-range liquidity from the pool
          const totalLiquidity = await readContract(config, {
            address: poolAddress as `0x${string}`,
            abi: UniswapV3PoolAbi,
            functionName: "liquidity",
          });

          // Fetch underlying token details
          const [token0Details, token1Details] = await getTokenDetails([
            token0Addr,
            token1Addr,
          ]);

          const token0 = new Token(
            8353,
            token0Addr as string,
            Number(token0Details.decimals),
            token0Details.symbol,
            "Token0"
          );
          const token1 = new Token(
            8353,
            token1Addr as string,
            Number(token1Details.decimals),
            token1Details.symbol,
            "Token1"
          );

          // Build a Pool object from the SDK
          // The "fee" in the SDK is just a number like 3000 for a 0.3% pool
          // sqrtPriceX96, totalLiquidity, and tickCurrent need to be string or number inputs
          const pool = new Pool(
            token0,
            token1,
            Number(fee),
            sqrtPriceX96.toString(),
            totalLiquidity.toString(),
            Number(tickCurrent)
          );

          // Create the user's Position object
          const { amount0, amount1 } = new Position({
            pool,
            liquidity: liquidity.toString(), // the user's portion
            tickLower: Number(tickLower),
            tickUpper: Number(tickUpper),
          });

          // Convert them to human-readable strings
          const amount0Str = amount0.toExact();
          const amount1Str = amount1.toExact();

          return {
            tokenId: tokenId.toString(),
            token0: token0Details,
            token1: token1Details,
            fee: fee.toString(),
            liquidity: liquidity.toString(),
            amount0: amount0Str,
            amount1: amount1Str,
          };
        } catch (e) {
          console.error("Failed to get details for position id", i);
          return null;
        }
      })();
    });

    const rawPositions = await Promise.all(fetchPromises);
    return rawPositions.filter((position) => position !== null);
  } catch (e) {
    console.error("getUniswapV3NonfungiblePositions ERROR", e);
    return [];
  }
};
