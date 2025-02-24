const CONSTANTS = {
  // The following addresses are deployed on Base (id: 8453)
  OPTOPUS_CONTRACT: "0x025662f089E993f3B51c07C43fc50ea92239A6dA",
  NONFUNGIBLE_POSITION_MANAGER_CONTRACT: "0x03a520b32C04BF3bEEf7BEb72E919cf822Ed34f1",
  UNISWAPV3_FACTORY_CONTRACT: "0x33128a8fC17869897dcE68Ed026d694621f6FDfD",
  TOKENS: [
    // WETH
    {
      address: "0x4200000000000000000000000000000000000006",
      priceFeedAddress: "0x71041dddad3595F9CEd3DcCFBe3D1F4b0a16Bb70",
    },
    // USDC
    {
      address: "0x833589fcd6edb6e08f4c7c32d4f71b54bda02913",
      priceFeedAddress: "0x7e860098F58bBFC8648a4311b374B1D669a2bc6B",
    },
  ],
  OPTOPUS_SUBGRAPH_ENDPOINT:
    "https://api.studio.thegraph.com/query/27003/optopus-base/version/latest",
};

export default CONSTANTS;
