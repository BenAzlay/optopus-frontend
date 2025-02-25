import Option from "@/app/types/Option";
import { useCurrentTimestamp } from "@/utils/customHooks";
import {
  abbreviateAmount,
  convertQuantityFromWei,
  formatDuration,
  numberWithCommas,
} from "@/utils/utilFunc";
import Decimal from "decimal.js";
import { FC, Fragment, memo, useMemo } from "react";
import TransactionButton from "./TransactionButton";
import Tooltip from "./Tooltip";
import TokenLogo from "./TokenLogo";
import CONSTANTS from "@/utils/constants";
import { abi as OptopusAbi } from "@/abi/OptopusAbi";
import useContractTransaction from "@/utils/useContractTransaction";

interface OptionItemProps {
  option: Option;
}

const OptionItem: FC<OptionItemProps> = ({ option }) => {
  const currentTs = useCurrentTimestamp();

  const {
    id: optionId,
    owner,
    tokenId,
    asset,
    token0,
    amount0,
    amount1,
    exercisedAmount,
    expiry,
    isCall,
    premium,
    strikePrice,
    token1,
    totalSupply,
  } = option;

  const endDuration = expiry - currentTs;

  const optionIsExpired = useMemo(
    () => new Decimal(currentTs).gte(expiry),
    [expiry, currentTs]
  );

  const formattedSoldTokenAmount = useMemo(
    () => convertQuantityFromWei(totalSupply, asset.decimals),
    [totalSupply, asset.decimals]
  );

  const formattedTotalSupply = useMemo(
    () => convertQuantityFromWei(totalSupply, asset.decimals),
    [totalSupply, asset.decimals]
  );

  // Value in USD of all sold tokens remaining in option (from market price)
  const soldTokenAmountInUsdc = useMemo(
    () => new Decimal(formattedTotalSupply).mul(asset.price).toString(),
    [formattedTotalSupply, asset.price]
  );

  const {
    isPending: returnAssetsIsPending,
    executeTransaction: executeReturnAssetsTransaction,
  } = useContractTransaction({
    abi: OptopusAbi,
    contractAddress: CONSTANTS.OPTOPUS_CONTRACT,
    functionName: "returnAssets",
    args: [optionId],
    onSuccess: async () => {
      console.log("Return successful");
    },
    onError: (errorMessage) => {
      console.error(errorMessage);
    },
  });

  const transactionButton = () => {
    return (
      <div className="grid grid-cols-2 gap-2">
        <TransactionButton onClickAction={() => null} disabled={true}>
          COMING SOON
        </TransactionButton>
        <TransactionButton
          onClickAction={() => executeReturnAssetsTransaction()}
          disabled={!optionIsExpired || returnAssetsIsPending}
          loading={returnAssetsIsPending}
        >
          RETURN
        </TransactionButton>
      </div>
    );
  };

  return (
    <Fragment>
      <div className="option-item glass-bg">
        <p className="text-secondary text-lg font-bold text-center">
          {isCall ? "Call" : "Put"} option for {asset.symbol}
        </p>
        <p className="flex items-center gap-2">
          <TokenLogo symbol={asset.symbol} size={18} />
          {asset.symbol} remaining:
          <Tooltip message={`${formattedSoldTokenAmount} ${asset.symbol}`}>
            {abbreviateAmount(formattedSoldTokenAmount, "", 2)}
          </Tooltip>
          <Tooltip message={`$${numberWithCommas(soldTokenAmountInUsdc)}`}>
            ({abbreviateAmount(soldTokenAmountInUsdc, "$", 2)})
          </Tooltip>
        </p>
        <p className="flex items-center gap-2">
          ⚡ Strike price: ${numberWithCommas(strikePrice)}
        </p>
        <p className="flex items-center gap-2">
          💹 Market price: ${numberWithCommas(asset.price)}
        </p>
        <div className="inline-flex gap-1">💸 Premium: {premium}%</div>
        <p>
          ⌛ {endDuration > 0 ? "Expires in" : "Expired"}{" "}
          {formatDuration(Math.abs(endDuration))} {endDuration > 0 ? "" : "ago"}
        </p>
        {transactionButton()}
      </div>
    </Fragment>
  );
};

export default memo(OptionItem);
