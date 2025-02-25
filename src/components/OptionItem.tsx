import Option from "@/app/types/Option";
import { useCurrentTimestamp } from "@/utils/customHooks";
import {
  abbreviateAmount, convertQuantityFromWei, formatDuration,
  numberWithCommas
} from "@/utils/utilFunc";
import Decimal from "decimal.js";
import { FC, Fragment, memo, useMemo } from "react";
import TransactionButton from "./TransactionButton";
import Tooltip from "./Tooltip";
import TokenLogo from "./TokenLogo";

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

  // Value in USD of all sold tokens remaining in option (from market price)
  const soldTokenAmountInUsdc = useMemo(
    () => new Decimal(totalSupply).mul(asset.price).toString(),
    [formattedSoldTokenAmount, asset.price]
  );

  const transactionButton = () => {
    return (
      <div className="grid grid-cols-2 gap-2">
        <TransactionButton onClickAction={() => null} disabled={true}>
          COMING SOON
        </TransactionButton>
        <TransactionButton
          onClickAction={() => null}
          disabled={!optionIsExpired}
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
          <span>{asset.symbol}</span> for{" "}
          <span>${numberWithCommas(strikePrice)}</span>
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
        <div className="inline-flex gap-1">🛡️ Premium: {premium}%</div>
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
