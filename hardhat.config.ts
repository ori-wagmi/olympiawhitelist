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
    version: "0.8.7",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200
      }
    },
  },
  networks: {
    hardhat: {
      forking: {
        url: "https://eth-mainnet.alchemyapi.io/v2/hf_xN5Ws2zEY3QZzdPvpk0bYpMfDZNjy",
        blockNumber: 14458594
      }
    },
    eth: {
      chainId: 1,
      url: "https://eth-mainnet.alchemyapi.io/v2/hf_xN5Ws2zEY3QZzdPvpk0bYpMfDZNjy",
      accounts: [ `0x${PRIVATE_KEY}` ]
    },
    ropsten: {
      chainId: 3,
      url: `https://ropsten.infura.io/v3/18bd4091bfc647b9bef6eb178b0547d7`,
      accounts: [ `0x${PRIVATE_KEY}` ],
    },
    rinkeby: {
      chainId: 4,
      url: `https://rinkeby.infura.io/v3/c0a809d606714c29bc1460f8fa798876`,
      accounts: [ `0x${PRIVATE_KEY}` ],
      gas: 60000000,
    }
  }
};

export default config;
