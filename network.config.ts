import Env from "dotenv";
import { Network } from "hardhat/types";

Env.config({ path: "./.secrets.env" });

export type SupportedNetwork = "goerli";
export type NetworkConfig = {
  providerURL: string;
  privateKeys?: string[];
  gnosisTxService?: string;
  hdPath?: string;
  multisigAddress?: string;
};
export const getNetworkConfig = (
  network: Network
): NetworkConfig | undefined => {
  let supportedNetwork = network.name as SupportedNetwork;
  return Networks[supportedNetwork];
};
export const Networks: Record<SupportedNetwork, NetworkConfig> = {
  /*   mainnet: {
    providerURL: `https://eth-mainnet.alchemyapi.io/v2/${process.env.ALCHEMY_MAINNET_APIKEY}`,
    privateKeys: process.env.MAINNET_DEPLOYER_PRIVATE_KEY ? [`0x${process.env.MAINNET_DEPLOYER_PRIVATE_KEY}`] : undefined,
    hdPath: process.env.MAINNET_DEPLOYER_HDPATH,
    gnosisTxService: "https://safe-transaction.mainnet.gnosis.io",
    multisigAddress: process.env.MAINNET_DEPLOYER_ADDRESS,
  } */
  goerli: {
    providerURL: `https://eth-goerli.g.alchemy.com/v2/${process.env.GOERLI_ALCHEMY_APIKEY}`,
    privateKeys: process.env.GOERLI_DEPLOYER_PRIVATE_KEY
      ? [process.env.GOERLI_DEPLOYER_PRIVATE_KEY]
      : undefined,
    gnosisTxService: "https://safe-transaction.goerli.gnosis.io",
    multisigAddress: process.env.GOERLI_MULTISIG,
    //hdPath: process.env.GOERLI_DEPLOYER_HDPATH,
  },
};
