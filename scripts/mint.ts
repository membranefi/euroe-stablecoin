import { FireblocksSDK, PeerType, TransactionOperation } from "fireblocks-sdk";
import { EthersBridge, Chain } from "fireblocks-defi-sdk";
import { ethers, PopulatedTransaction } from "ethers";
import * as fs from "fs";
import euroJSON from "../artifacts/contracts/EUROe.sol/EUROe.json";
import { EUROe } from "../typechain/euroe";
import { getMintChecksum } from "./tools";
import { network } from "hardhat";

// This script is used for manually testing minting

const PROXY_ADDRESS = "0x8f21060D05DF9BcA475Ba23eA26AcCCab9944a2e"; // Address of the token contract (proxy)
const MINT_TARGET = "0xa084ab564149ea4a2113c29Ab1772B2F0F874a66"; // Who gets the tokens
const MINT_AMOUNT = 8; // How much to mint
const EXTERNAL_MINT_ID = 16; // ID that probably comes from database

let api_secret_path: string, api_key: string, vault_account_id: string;

let usedChain: Chain;

if (network.name == "goerli") {
  api_secret_path = process.env.GOERLI_FIREBLOCKS_API_SECRET_PATH_MINTER;
  api_key = process.env.GOERLI_FIREBLOCKS_API_KEY_MINTER;
  vault_account_id = process.env.GOERLI_FIREBLOCKS_SOURCE_VAULT_ACCOUNT_ID;
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

  const checksum = await getMintChecksum(
    [MINT_TARGET],
    [MINT_AMOUNT],
    EXTERNAL_MINT_ID
  );

  const tx: PopulatedTransaction = await contract.populateTransaction.mintSet(
    [MINT_TARGET],
    [MINT_AMOUNT],
    EXTERNAL_MINT_ID,
    checksum
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
