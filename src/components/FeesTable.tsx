import CreatorFee from "@/app/types/CreatorFee";
import React, { useState } from "react";
import TokenSymbolAndLogo from "./TokenSymbolAndLogo";
import {
  abbreviateAmount,
  convertQuantityFromWei,
  numberWithCommas,
} from "@/utils/utilFunc";
import Tooltip from "./Tooltip";

type Props = {
  creatorFees: CreatorFee[];
  onSelectFee: (fee: CreatorFee) => void;
};

const FeesTable: React.FC<Props> = ({ creatorFees, onSelectFee }) => {
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");

  const handleSort = () => {
    setSortOrder((prevOrder) => (prevOrder === "asc" ? "desc" : "asc"));
  };

  const sortedFees = [...creatorFees].sort((a, b) => {
    const amountA = BigInt(a.amount);
    const amountB = BigInt(b.amount);

    if (sortOrder === "asc") return amountA > amountB ? 1 : -1;
    return amountA < amountB ? 1 : -1;
  });

  const row = (fee: CreatorFee) => {
    const {
      id: feeId,
      amount: amountWei,
      token: { symbol, decimals },
    } = fee;
    const amount = convertQuantityFromWei(amountWei, decimals);
    return (
      <tr key={feeId} className="hover:bg-base-200">
        <td>
          <TokenSymbolAndLogo symbol={symbol} />
        </td>
        <td>
          <Tooltip message={numberWithCommas(amount)}>
            {abbreviateAmount(amount, "", 3)}
          </Tooltip>
        </td>
        <td>
          <button
            className="btn btn-primary btn-sm font-semibold"
            onClick={() => onSelectFee(fee)}
            disabled={amountWei <= 0}
          >
            CLAIM {symbol}
          </button>
        </td>
      </tr>
    );
  };

  return (
    <div className="overflow-x-auto">
      <table className="table w-full glass-bg">
        <thead>
          <tr>
            <th>Token</th>
            <th className="cursor-pointer" onClick={handleSort}>
              Amount
              <span className="ml-2">{sortOrder === "asc" ? "↑" : "↓"}</span>
            </th>
            <th></th>
          </tr>
        </thead>
        <tbody>{sortedFees.map((fee) => row(fee))}</tbody>
      </table>
    </div>
  );
};

export default FeesTable;
