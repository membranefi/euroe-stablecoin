/* eslint-disable camelcase */
import { Networks, SupportedNetwork } from "./network.config";
import "@nomiclabs/hardhat-ethers";
import "@nomiclabs/hardhat-waffle";
import "@typechain/hardhat";
import "solidity-coverage";
import "@openzeppelin/hardhat-upgrades";
import { HardhatUserConfig, NetworksUserConfig } from "hardhat/types";
import Env from "dotenv";
import "@nomiclabs/hardhat-etherscan";
import "@fireblocks/hardhat-fireblocks";
import "@openzeppelin/hardhat-upgrades";

Env.config({ path: "./.secrets.env" });

if (
  !process.env.GOERLI_FIREBLOCKS_API_KEY_DEPLOYER ||
  !process.env.GOERLI_FIREBLOCKS_API_SECRET_PATH_DEPLOYER ||
  !process.env.GOERLI_FIREBLOCKS_SOURCE_VAULT_ACCOUNT_ID
) {
  throw "Invalid hardhat config";
}

let networks: NetworksUserConfig = {
  /*   mainnet: {
    url: Networks.mainnet.providerURL,
    accounts: Networks.mainnet.privateKeys,
    live: true,
    gasPrice: 200 * 1_000_000_000,
    chainId: 1,
  }, */
  goerliDirect: {
    url: Networks.goerli.providerURL,
    accounts: Networks.goerli.privateKeys,
    chainId: 5,
  },
  goerliFB: {
    url: "https://rpc.ankr.com/eth_goerli",
    fireblocks: {
      privateKey: process.env.GOERLI_FIREBLOCKS_API_SECRET_PATH_DEPLOYER,
      apiKey: process.env.GOERLI_FIREBLOCKS_API_KEY_DEPLOYER,
      vaultAccountIds: process.env.GOERLI_FIREBLOCKS_SOURCE_VAULT_ACCOUNT_ID,
    },
  },
};
const HARDHAT_NETWORK_ID = 31337;
let isFork = false;
let localChainId = HARDHAT_NETWORK_ID;
let forkingURL;
let forkId = process.env.FORK as SupportedNetwork;
if (forkId) {
  isFork = true;
  forkingURL = Networks[forkId].providerURL;
  localChainId = networks[forkId]?.chainId || HARDHAT_NETWORK_ID;
}
networks.localhost = {
  chainId: localChainId,
};
networks.hardhat = {
  gasPrice: "auto",
  // set this to 0 to work-around https://github.com/sc-forks/solidity-coverage/issues/652
  initialBaseFeePerGas: 0,
  forking: {
    enabled: isFork,
    url: forkingURL || "",
  },
  chainId: localChainId,
};

const hardhatConfig: HardhatUserConfig = {
  etherscan: {
    apiKey: process.env.ETHERSCAN_APIKEY,
  },

  typechain: {
    outDir: "typechain/euroe",
    target: "ethers-v5",
  },
  solidity: {
    version: "0.8.4",
    settings: {
      optimizer: {
        enabled: true,
      },
    },
  },
  defaultNetwork: "hardhat",
  networks,
  mocha: {
    timeout: 0,
  },
};

export default hardhatConfig;
