import * as dotenv from "dotenv";

import { HardhatUserConfig, task } from "hardhat/config";
import "@nomiclabs/hardhat-etherscan";
import "@nomiclabs/hardhat-waffle";
import "@typechain/hardhat";
//import "hardhat-gas-reporter";
import "solidity-coverage";

dotenv.config();

const { PRIVATE_KEY } = process.env;

const config: HardhatUserConfig = {
  solidity: {
    version: "0.8.0",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200
      }
    },
  },
  networks: {
    hardhat: {
      // forking: {
      //   url: "https://ropsten.infura.io/v3/18bd4091bfc647b9bef6eb178b0547d7",
      // }
    },
    ropsten: {
      chainId: 3,
      url: `https://ropsten.infura.io/v3/18bd4091bfc647b9bef6eb178b0547d7`,
      accounts: [ `0x${PRIVATE_KEY}` ],
    },
  }
};

export default config;
