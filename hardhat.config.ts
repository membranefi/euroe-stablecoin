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

const hardhatConfig: HardhatUserConfig = {
  solidity: {
    version: "0.8.4",
    settings: {
      optimizer: {
        enabled: true,
      },
    },
  },
  defaultNetwork: "hardhat",
  networks: {
    hardhat: {},
    goerliDirect: {
      url: `https://eth-goerli.g.alchemy.com/v2/${process.env.GOERLI_ALCHEMY_APIKEY}`,
      accounts: process.env.GOERLI_DEPLOYER_PRIVATE_KEY
        ? [process.env.GOERLI_DEPLOYER_PRIVATE_KEY]
        : undefined,
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
  },
  typechain: {
    outDir: "typechain/euroe",
    target: "ethers-v5",
  },
  etherscan: {
    apiKey: process.env.ETHERSCAN_APIKEY,
  },
  mocha: {
    timeout: 0,
  },
};

export default hardhatConfig;
