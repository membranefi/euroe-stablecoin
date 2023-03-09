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
    gaiaxTestNet: {
      chainId: 100,
      url: "https://rpc.genx.minimal-gaia-x.eu",
      accounts:[process.env.EDGE_DEPLOYER_PRIVATE_KEY]
    },
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
        vaultAccountIds:
          process.env.GOERLI_FIREBLOCKS_VAULT_ACCOUNT_ID_DEPLOYER,
      },
    },
    mumbaiFB: {
      url: "https://rpc.ankr.com/polygon_mumbai",
      fireblocks: {
        privateKey: process.env.MUMBAI_FIREBLOCKS_API_SECRET_PATH_DEPLOYER,
        apiKey: process.env.MUMBAI_FIREBLOCKS_API_KEY_DEPLOYER,
        vaultAccountIds:
          process.env.MUMBAI_FIREBLOCKS_VAULT_ACCOUNT_ID_DEPLOYER,
      },
    },
    polyMainnetFB: {
      url: "https://rpc.ankr.com/polygon",
      fireblocks: {
        privateKey: process.env.POLY_FIREBLOCKS_API_SECRET_PATH_DEPLOYER,
        apiKey: process.env.POLY_FIREBLOCKS_API_KEY_DEPLOYER,
        vaultAccountIds:
          process.env.POLY_FIREBLOCKS_VAULT_ACCOUNT_ID_DEPLOYER,
      },
    },
    mainnetFB: {
      url: "https://rpc.ankr.com/eth",
      fireblocks: {
        privateKey: process.env.MAINNET_FIREBLOCKS_API_SECRET_PATH_DEPLOYER,
        apiKey: process.env.MAINNET_FIREBLOCKS_API_KEY_DEPLOYER,
        vaultAccountIds:
          process.env.MAINNET_FIREBLOCKS_VAULT_ACCOUNT_ID_DEPLOYER,
      },
    },
    avalancheTestNetFB: {
      url: `https://avalanche-fuji.infura.io/v3/${process.env.INFURA_API_KEY}`,
      fireblocks: {
        privateKey: process.env.FUJI_FIREBLOCKS_API_SECRET_PATH_DEPLOYER,
        apiKey: process.env.FUJI_FIREBLOCKS_API_KEY_DEPLOYER,
        vaultAccountIds:
          process.env.FUJI_FIREBLOCKS_VAULT_ACCOUNT_ID_DEPLOYER,
      },
    },
    avalancheFB: {
      url: `https://avalanche-mainnet.infura.io/v3/${process.env.INFURA_API_KEY}`,
      fireblocks: {
        privateKey: process.env.AVAX_FIREBLOCKS_API_SECRET_PATH_DEPLOYER,
        apiKey: process.env.AVAX_FIREBLOCKS_API_KEY_DEPLOYER,
        vaultAccountIds:
          process.env.AVAX_FIREBLOCKS_VAULT_ACCOUNT_ID_DEPLOYER,
      },
    },
  },
  typechain: {
    outDir: "typechain/euroe",
    target: "ethers-v5",
  },
  etherscan: {
    apiKey: {
      mainnet: process.env.ETHERSCAN_APIKEY,
      goerli: process.env.ETHERSCAN_APIKEY,
      polygonMumbai: process.env.POLYGONSCAN_APIKEY,
      polygon: process.env.POLYGONSCAN_APIKEY,
      avalancheFujiTestnet: process.env.SNOWTRACE_API_KEY,
      avalanche: process.env.SNOWTRACE_API_KEY,
      gaiaxTestNet: process.env.GAIAX_API_KEY
    },
    customChains: [
      {
        network: "gaiaxTestNet",
        chainId: 100,
        urls: {
          apiURL: "https://explorer.genx.minimal-gaia-x.eu/api",
          browserURL: "https://explorer.genx.minimal-gaia-x.eu/"
        }
      }
    ]
  },
  mocha: {
    timeout: 0,
  },
};

export default hardhatConfig;
