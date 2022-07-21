/* eslint-disable camelcase */
import { Networks, SupportedNetwork } from "./network.config";
import "@nomiclabs/hardhat-ethers";
import "@nomiclabs/hardhat-waffle";
import "hardhat-deploy";
import "@typechain/hardhat";
import "solidity-coverage";
import "@openzeppelin/hardhat-upgrades";
import { HardhatUserConfig, NetworksUserConfig } from "hardhat/types";
import { setupSafeDeployer } from "hardhat-safe-deployer";
import { Wallet } from "ethers";
import Env from "dotenv";

Env.config({ path: "./.secrets.env" });

// FIXME: make network-dependent somehow
const multisig = process.env.GOERLI_MULTISIG;
const safeService = process.env.GOERLI_SAFE_SERVICE_URL;
const privateKey = process.env.GOERLI_DEPLOYER_PRIVATE_KEY;

if (!multisig || !safeService || !privateKey) {
  throw "Missing configuration values";
}

setupSafeDeployer(new Wallet(privateKey), multisig, safeService);

let networks: NetworksUserConfig = {
  /*   mainnet: {
    url: Networks.mainnet.providerURL,
    accounts: Networks.mainnet.privateKeys,
    live: true,
    gasPrice: 200 * 1_000_000_000,
    chainId: 1,
  }, */
  goerli: {
    url: Networks.goerli.providerURL,
    accounts: Networks.goerli.privateKeys,
    live: true,
    saveDeployments: true,
    chainId: 5,
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
  live: false,
  saveDeployments: true,
  tags: ["local"],
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
  live: false,
  saveDeployments: true,
  tags: ["test", "local"],
};

const hardhatConfig: HardhatUserConfig = {
  verify: {
    etherscan: {
      apiKey: process.env.ETHERSCAN_APIKEY,
    },
  },
  typechain: {
    outDir: "typechain/euro",
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
  namedAccounts: {
    proxyOwner: {
      default: 0, // the first account for mnemonic/specific private key
      goerli: 0,
    },
    admin: {
      default: 1, // the second account for mnemonic
      goerli: 0,
    },
    blocklister: {
      default: 2,
      goerli: 0,
    },
    pauser: {
      default: 3,
      goerli: 0,
    },
    unpauser: {
      default: 4,
      goerli: 0,
    },
    minter: {
      default: 5,
      goerli: 0,
    },
    multisig: {
      default: 6,
      goerli: multisig,
    },
  },
  mocha: {
    timeout: 0,
  },
};

export default hardhatConfig;
