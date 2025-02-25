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

  const [selectedSortingOption, setSelectedSortingOption] =
    useState<SortingOption>(sortingOptions[0]);

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
              Options for Crypto
            </h1>
            <h2 className="text-lg sm:text-xl font-semibold text-left text-gray-100">
              🤩 Choose a put or call option
              <br />
              ⏳ Exercise it 1 hour before expiry
              <br />
              😇 ...or don't and stay safe
            </h2>
            <div className="w-full sm:w-fit">
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
