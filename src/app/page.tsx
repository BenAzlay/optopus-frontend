"use client";

import useStore from "@/store/useStore";
import { Fragment, useMemo, useRef, useState } from "react";
import { useVisibilityIntervalEffect } from "@/utils/customHooks";
import { Option as SubgraphOption } from "@/utils/queries";
import ERC20Token from "./types/ERC20Token";
import { compareEthereumAddresses } from "@/utils/utilFunc";
import TokenSymbolAndLogo from "@/components/TokenSymbolAndLogo";
import { getTokenDetails } from "@/utils/tokenMethods";
import Link from "next/link";
import dynamic from "next/dynamic";
import Option from "./types/Option";
import FiltersDropdown from "@/components/FiltersDropdown";

interface SortingOption {
  id: keyof Option;
  label: string;
  asc: boolean; // ascending or descending
}

const OptionItem = dynamic(() => import("@/components/OptionItem"), {
  loading: () => (
    <div className="option-item min-h-64 items-center justify-center">
      <p>Loading option...</p>
    </div>
  ),
});

function App() {
  const optionsHaveLoaded = useRef(false);
  const { setOptions, options } = useStore();

  // Fetch options every 60s from subgraph
  const fetchOptions = async () => {
    try {
      // Fetch options from subgraph
      const response = await fetch("/api/fetchOptions");
      if (!response.ok) {
        throw new Error("Failed to fetch options");
      }
      const { options: subgraphOptions } = (await response.json()) as {
        options: SubgraphOption[];
      };
      // Isolate the options tokens to convert them to ERC20Token type
      const tokenAddresses = subgraphOptions.flatMap((option) => [
        option.asset,
        option.token0,
        option.token1,
      ]);
      const tokensWithDetails = await getTokenDetails(tokenAddresses);
      const options = subgraphOptions
        .map((option: SubgraphOption) => {
          // Convert tokens into ERC20Token type
          const token0 = tokensWithDetails.find((token) =>
            compareEthereumAddresses(token.address, option.token0)
          )!;
          const token1 = tokensWithDetails.find((token) =>
            compareEthereumAddresses(token.address, option.token1)
          )!;
          const asset = tokensWithDetails.find((token) =>
            compareEthereumAddresses(token.address, option.asset)
          )!;
          return {
            ...option,
            asset,
            token0,
            token1,
          };
        })
        .filter(Boolean);
      setOptions(options);
      optionsHaveLoaded.current = true;
    } catch (e) {
      console.error("fetchOptions ERROR", e);
    }
  };
  useVisibilityIntervalEffect(fetchOptions, 60000, []); // Refetch options every 60s

  const sortingOptions: SortingOption[] = [
    {
      id: "expiry",
      label: "Expiry date",
      asc: true,
    },
    {
      id: "totalSupply",
      label: "Total supply",
      asc: false,
    },
  ];

  const [tokenFilter, setTokenFilter] = useState<ERC20Token | null>(null);
  const [selectedSortingOption, setSelectedSortingOption] =
    useState<SortingOption>(sortingOptions[0]);

  // An array of all tokens (sold & collateral) used in the options
  const optionTokens: ERC20Token[] = useMemo(() => {
    // Flatten the array of tokens and then create a Set to filter unique items
    const tokens: ERC20Token[] = options.flatMap((option) => [
      option.token0,
      option.token1,
    ]);
    return Array.from(new Set(tokens));
  }, [options]);

  const sortedOptions = useMemo(() => {
    return [...options].sort((a, b) => {
      const attributeA = a[selectedSortingOption.id];
      const attributeB = b[selectedSortingOption.id];

      if (attributeA < attributeB) return selectedSortingOption.asc ? -1 : 1;
      if (attributeA > attributeB) return selectedSortingOption.asc ? 1 : -1;
      return 0;
    });
  }, [options, selectedSortingOption]);

  const handleSelectSortingOption = (option: {
    id: string;
    label: string;
    asc: boolean;
  }) => {
    setSelectedSortingOption({
      ...option,
      id: option.id as keyof Option,
    });
  };

  const filterButtons = () => (
    <Fragment>
      {/* Filter Buttons */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center w-full gap-4 mb-6 justify-start">
        {/* Sorting dropdown */}
        <FiltersDropdown
          options={sortingOptions}
          onSelectOption={handleSelectSortingOption}
          selectedOption={selectedSortingOption}
          prefix="Sort Options by:"
        />
        {/* Token Filters */}
        <div className="space-x-2 hidden lg:block">
          {optionTokens.map((token) => (
            <button
              key={token.address}
              className={`btn btn-outline btn-secondary ${
                tokenFilter === token ? "btn-active" : ""
              }`}
              onClick={() =>
                setTokenFilter(tokenFilter === token ? null : token)
              }
            >
              <TokenSymbolAndLogo symbol={token.symbol} />
            </button>
          ))}
        </div>
      </div>
    </Fragment>
  );

  const emptyMessageBox = () => {
    if (options.length > 0) return null;
    if (!optionsHaveLoaded.current) {
      return (
        <div className="justify-center text-center w-full py-8">
          <h6 className="font-semibold text-lg text-center inline-flex gap-2 justify-self-center">
            <span className="loading loading-spinner"></span>
            Loading Options...
          </h6>
        </div>
      );
    }
    return (
      <div className="empty-box">
        <h6 className="text-lg font-semibold">🫥 No options found</h6>
        <p>
          Try changing the filters above, or{" "}
          <Link
            href={"/sell"}
            className="text-primary font-bold cursor-pointer"
          >
            create one yourself
          </Link>
        </p>
      </div>
    );
  };

  return (
    <Fragment>
      <div className="hero glass-bg">
        <div className="hero-content text-center">
          <div className="space-y-6 justify-items-center">
            <h1 className="text-3xl sm:text-5xl font-bold font-nimbus text-primary">
              Invest Risk-Free. Get Money Back.
            </h1>
            <h2 className="text-lg sm:text-xl font-semibold text-left text-gray-100">
              🤩 Choose a token to invest in
              <br />
              😇 Return it if the price drops
              <br />
              🤑 Reclaim your investment safely
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full sm:w-fit">
              <Link
                href="/sell"
                className="btn btn-outline btn-primary font-semibold text-lg"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                  stroke="currentColor"
                  className="size-6"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 4.5v15m7.5-7.5h-15"
                  />
                </svg>
                Create an Option
              </Link>
              <Link
                href="/claim"
                className="btn btn-outline btn-primary font-semibold text-lg"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                  stroke="currentColor"
                  className="size-6"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 3.75v16.5M2.25 12h19.5M6.375 17.25a4.875 4.875 0 0 0 4.875-4.875V12m6.375 5.25a4.875 4.875 0 0 1-4.875-4.875V12m-9 8.25h16.5a1.5 1.5 0 0 0 1.5-1.5V5.25a1.5 1.5 0 0 0-1.5-1.5H3.75a1.5 1.5 0 0 0-1.5 1.5v13.5a1.5 1.5 0 0 0 1.5 1.5Zm12.621-9.44c-1.409 1.41-4.242 1.061-4.242 1.061s-.349-2.833 1.06-4.242a2.25 2.25 0 0 1 3.182 3.182ZM10.773 7.63c1.409 1.409 1.06 4.242 1.06 4.242S9 12.22 7.592 10.811a2.25 2.25 0 1 1 3.182-3.182Z"
                  />
                </svg>
                Claim Rewards
              </Link>
            </div>
          </div>
        </div>
      </div>
      <div className="page-container">
        {filterButtons()}
        <div
          id="options-grid"
          className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3"
        >
          {sortedOptions.map((option, index) => (
            <OptionItem option={option} key={index} />
          ))}
        </div>
        {emptyMessageBox()}
      </div>
    </Fragment>
  );
}

export default App;
