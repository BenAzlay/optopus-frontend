"use client";

import { useState, useEffect, useMemo, Fragment } from "react";
import {
  compareEthereumAddresses,
  convertQuantityToWei,
  getTimestampSecondsFromDate,
} from "@/utils/utilFunc";
import CONSTANTS from "@/utils/constants";
import ERC20Token from "../types/ERC20Token";
import TokensDropdown from "@/components/TokensDropdown";
import TokenAmountField from "@/components/TokenAmountField";
import Decimal from "decimal.js";
import { abi as OptopusAbi } from "@/abi/OptopusAbi";
import { zeroAddress } from "viem";
import {
  getApprovedPosition,
  getUniswapV3NonfungiblePositions,
} from "@/utils/tokenMethods";
import { useAsyncEffect, useCurrentTimestamp } from "@/utils/customHooks";
import { ethers } from "ethers";
import SignInButton from "@/components/SignInButton";
import TransactionButton from "@/components/TransactionButton";
import { base } from "viem/chains";
import SwitchChainButton from "@/components/SwitchChainButton";
import useContractTransaction from "@/utils/useContractTransaction";
import { useAccount } from "wagmi";
import Position from "../types/Position";
import PositionsDropdown from "@/components/PositionsDropdown";
import DateField from "@/components/DateField";
import NumberField from "@/components/NumberField";
import { abi as NonfungiblePositionManagerAbi } from "@/abi/NonfungiblePositionManagerAbi";
import ToggleCallPut from "@/components/ToggleCallPut";

const currentDate = new Date();

const Sell = () => {
  const { address: connectedAddress, chainId: connectedChainId } = useAccount();

  const currentTs = useCurrentTimestamp();

  const [positions, setPositons] = useState<Position[]>([]);
  const [selectedPosition, setSelectedPosition] = useState<Position | null>(
    null
  );
  const [positionsApproved, setPositionsApproved] = useState<boolean>(false);

  const [soldToken, setSoldToken] = useState<ERC20Token | null>(null);
  const [strikePrice, setStrikePrice] = useState<string>("");
  const [soldTokenAmount, setSoldTokenAmount] = useState<string>("");
  const [expiryDate, setExpiryDate] = useState<Date>(currentDate);
  const [isCall, setIsCall] = useState<boolean>(false);
  const [txError, setTxError] = useState<string | null>(null);
  const [loadingPositions, setLoadingPositions] = useState<boolean>(false);

  // Fetch all user Uniswap v3 positions
  const positionsGetter = async () => {
    setLoadingPositions(true);
    return await getUniswapV3NonfungiblePositions(connectedAddress);
  };
  const positionsSetter = (positions: Position[]) => {
    setPositons(positions);
    // Set default selected position and soldToken
    if (!!positions.length) {
      setSelectedPosition(positions[0]);
      setSoldToken(positions[0].token0);
    } else {
      setSelectedPosition(null);
    }
    setLoadingPositions(false);
  };
  useAsyncEffect(positionsGetter, positionsSetter, [connectedAddress]);

  const getPositionsApproved = async () => {
    const approvedAddress = await getApprovedPosition(
      selectedPosition?.tokenId
    );
    return compareEthereumAddresses(
      approvedAddress,
      CONSTANTS.OPTOPUS_CONTRACT
    );
  };
  const positionsApprovedSetter = (bool: boolean) => {
    setPositionsApproved(bool);
  };
  useAsyncEffect(getPositionsApproved, positionsApprovedSetter, [
    selectedPosition,
  ]);

  const soldTokenAmountWei = useMemo(
    () => convertQuantityToWei(soldTokenAmount, soldToken?.decimals ?? 18),
    [soldTokenAmount, soldToken?.decimals]
  );

  const tokensList = useMemo(
    () =>
      !!selectedPosition
        ? [selectedPosition.token0, selectedPosition.token1]
        : [],
    [selectedPosition]
  );

  const maxSoldToken = useMemo(() => {
    if (!soldToken || !selectedPosition) return "0";
    return compareEthereumAddresses(
      soldToken.address,
      selectedPosition.token0.address
    )
      ? selectedPosition.amount0
      : selectedPosition.amount1;
  }, [soldToken, selectedPosition]);

  const maxSoldTokenWei = useMemo(
    () => convertQuantityToWei(maxSoldToken, soldToken?.decimals ?? 18),
    [maxSoldToken, soldToken]
  );

  const formErrors = useMemo((): string[] => {
    const _errors: string[] = [];
    // Sold token amount exceeds max
    if (
      ethers.isAddress(connectedAddress) &&
      new Decimal(soldTokenAmountWei).gt(maxSoldTokenWei)
    ) {
      _errors.push(
        `⚖️ ${soldToken?.symbol ?? "Sold token"} amount exceeds liquidity.`
      );
    }
    return _errors;
  }, [
    soldToken?.symbol,
    expiryDate,
    soldTokenAmountWei,
    maxSoldTokenWei,
    connectedAddress,
  ]);

  // Reset txError after 10 seconds
  useEffect(() => {
    if (txError !== null) {
      const timer = setTimeout(() => {
        setTxError(null);
      }, 10000); // 10 seconds

      return () => clearTimeout(timer);
    }
  }, [txError]);

  // Approve TX hooks
  const {
    isPending: approveIsPending,
    executeTransaction: executeApproveTransaction,
  } = useContractTransaction({
    abi: NonfungiblePositionManagerAbi,
    contractAddress: CONSTANTS.NONFUNGIBLE_POSITION_MANAGER_CONTRACT,
    functionName: "approve",
    args: [
      CONSTANTS.OPTOPUS_CONTRACT as `0x${string}`,
      BigInt(selectedPosition?.tokenId ?? 0),
    ],
    onSuccess: async () => {
      console.log("Approval successful");
      setTxError(null);
      const _approved = await getPositionsApproved();
      setPositionsApproved(_approved);
    },
    onError: (errorMessage) => {
      setTxError(errorMessage);
    },
  });

  // MINT OPTION TX HOOK
  const getMintOptionArgs = () => {
    const tokenId = selectedPosition?.tokenId ?? "0";
    const soldTokenAddress = (soldToken?.address ??
      zeroAddress) as `0x${string}`;

    let expiryDateTs: number = getTimestampSecondsFromDate(expiryDate);
    // Make sure start date is at least 5 minutes in the future to account for tx time
    if (currentTs >= expiryDateTs - 300) expiryDateTs += 300;

    const premium = 0;
    const deadline = Math.floor(Date.now() / 1000) + 60 * 20; // 20 minutes from the current Unix time

    return [
      tokenId, // tokenId
      BigInt(strikePrice), // strikePrice
      expiryDateTs, // expiry
      isCall, // isCall
      soldTokenAddress, // asset
      premium, // premium
      BigInt(deadline), // deadline
    ];
  };
  const {
    isPending: mintOptionIsPending,
    executeTransaction: executeMintOptionTransaction,
  } = useContractTransaction({
    abi: OptopusAbi,
    contractAddress: CONSTANTS.OPTOPUS_CONTRACT,
    functionName: "mintOption",
    args: getMintOptionArgs(),
    onSuccess: async () => {
      console.log("Create option successful");
      setTxError(null);
      try {
        setSoldTokenAmount("");
        setStrikePrice("");
        const newPositions = await positionsGetter();
        positionsSetter(newPositions);
      } catch (error) {
        console.error("Error updating states", error);
      }
    },
    onError: (errorMessage) => {
      setTxError(errorMessage);
    },
  });

  const handleSoldTokenChange = (token: ERC20Token) => {
    setSoldToken(token);
  };

  const onChangeExpiryDate = (_expiryDate: Date | null) => {
    if (!_expiryDate) return;
    setExpiryDate(_expiryDate);
  };

  const errorsBox = () => (
    <div className="border-2 border-error rounded-md bg-[#E53E3E20] text-red-300 font-semibold px-2 py-2">
      {formErrors.map((formError, index) => (
        <p key={index}>{formError}</p>
      ))}
    </div>
  );

  const transactionButton = () => {
    if (!connectedAddress) return <SignInButton />;
    if (connectedChainId !== base.id) return <SwitchChainButton />;
    if (!positionsApproved)
      return (
        <TransactionButton
          disabled={approveIsPending || positionsApproved}
          loading={approveIsPending}
          onClickAction={executeApproveTransaction}
          errorMessage={txError}
        >
          APPROVE LP NFTs
        </TransactionButton>
      );
    return (
      <TransactionButton
        disabled={
          new Decimal(soldTokenAmountWei).lte(0) ||
          new Decimal(strikePrice.length ? strikePrice : 0).lte(0) ||
          mintOptionIsPending ||
          formErrors.length > 0
        }
        onClickAction={executeMintOptionTransaction}
        loading={mintOptionIsPending}
        errorMessage={txError}
      >
        CREATE OPTION
      </TransactionButton>
    );
  };

  const mintOptionForm = () => (
    <Fragment>
      <div className="space-y-2">
        <div>
          <label className="field-title">Select a Uniswap V3 NFT</label>
          <div className="field-subtitle">
            The underlying tokens in that LP position will be used as
            collateral. Only positions for which both tokens are supported by
            Optopus are shown.
          </div>
        </div>
        <PositionsDropdown
          positions={positions}
          selectedPosition={selectedPosition}
          onSelectPosition={(position) => setSelectedPosition(position)}
        />
      </div>
      <div className="space-y-2">
        <label className="field-title">What do you want to sell?</label>
        <TokenAmountField
          amount={soldTokenAmount}
          onChangeAmount={(amount) => setSoldTokenAmount(amount)}
          showTokenBalance={true}
          tokenBalance={maxSoldToken}
          balanceLabel="Max"
          placeholder="Sold amount"
          tokenPrice={soldToken?.price ?? 0}
          balanceIsLoading={false}
          tokenComponent={
            <TokensDropdown
              tokens={tokensList}
              selectedToken={soldToken}
              onSelectToken={handleSoldTokenChange}
            />
          }
        />
      </div>
      <div className="space-y-2">
        <label className="field-title">Strike price ($)</label>
        <NumberField
          value={strikePrice}
          onChangeValue={(price) => setStrikePrice(price)}
        />
      </div>

      {/* Dates */}
      <div className="space-y-2">
        <label className="field-title">Expiry date</label>
        <DateField
          onSelectDate={onChangeExpiryDate}
          selectedDate={expiryDate}
          minDate={currentDate}
        />
      </div>

      <ToggleCallPut value={isCall} onChange={(bool) => setIsCall(bool)} />
      {formErrors.length > 0 ? errorsBox() : null}
    </Fragment>
  );

  return (
    <div className="flex flex-col gap-2 items-center py-6 w-full overflow-hidden">
      <h1 className="text-2xl font-bold mb-4 text-center w-full">
        Create an Option
      </h1>
      <div
        id="form"
        className="space-y-4 max-w-lg border-2 rounded-md border-primary p-2 sm:p-4 w-full overflow-hidden glass-bg"
      >
        {!connectedAddress ? (
          <p className="text-center">Connect your wallet to create an option</p>
        ) : loadingPositions ? (
          <p className="text-center">Loading your Uniswap V3 LP NFTs...</p>
        ) : !positions.length ? (
          <p className="text-center">
            You have no Uniswap V3 LP NFT with supported tokens (WETH + USDC)
          </p>
        ) : (
          mintOptionForm()
        )}
        {/* Submit */}
        {transactionButton()}
      </div>
    </div>
  );
};

export default Sell;
