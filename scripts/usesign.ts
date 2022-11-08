import { FireblocksSDK, PeerType, TransactionOperation } from "fireblocks-sdk";
import { EthersBridge, Chain } from "fireblocks-defi-sdk";
import { ethers, PopulatedTransaction } from "ethers";
import * as fs from "fs";
import euroJSON from "../artifacts/contracts/EUROe.sol/EUROe.json";
import { EUROe } from "../typechain/euroe";
import { getMintChecksum } from "./tools";
import { network } from "hardhat";
import {
  amount,
  deadline,
  ownerAddress,
  PROXY_ADDRESS,
  spenderAddress,
} from "./fbsign";

// This script is used for manually testing minting

const v = 0;
const r = "6307dd88cf610eb8f1f89032a01e73f750d041534e1e478eb16dd459b95db580";
const s = "1a7fbab3fb0583f36892ee507b084f6e9ba43bdcaa65f400cb8fc568e8f98131";

let api_secret_path: string, api_key: string, vault_account_id: string;

let usedChain: Chain;

if (network.name == "goerliFB") {
  api_secret_path = process.env.GOERLI_FIREBLOCKS_API_SECRET_PATH_PROXYOWNER;
  api_key = process.env.GOERLI_FIREBLOCKS_API_KEY_PROXYOWNER;
  vault_account_id = "1";
  usedChain = Chain.GOERLI;
} else if (network.name == "mainnet") {
  // TODO
  usedChain = Chain.MAINNET;
}

if (!api_secret_path || !api_key || !vault_account_id || !usedChain) {
  throw "Invalid configuration or parameters";
}

async function processTransaction(
  bridge: EthersBridge,
  tx: PopulatedTransaction
) {
  const res = await bridge.sendTransaction(tx);

  console.log("Waiting for the transaction to be signed and mined");

  const txHash = await bridge.waitForTxHash(res.id);

  console.log(`Transaction ${res.id} has been broadcast. TX Hash is ${txHash}`);
}

async function main() {
  const apiSecret = fs.readFileSync(api_secret_path, "utf8");
  const fireblocksApiClient = new FireblocksSDK(apiSecret, api_key);

  const bridge = new EthersBridge({
    fireblocksApiClient,
    vaultAccountId: vault_account_id,
    chain: usedChain,
  });

  const contract = new ethers.Contract(
    PROXY_ADDRESS,
    euroJSON.abi,
    ethers.getDefaultProvider(usedChain)
  ) as EUROe;

  const tx: PopulatedTransaction = await contract.populateTransaction.permit(
    ownerAddress,
    spenderAddress,
    amount,
    deadline,
    v,
    "0x" + r,
    "0x" + s
  );

  console.log("Sending transaction for signing");

  await processTransaction(bridge, tx);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
