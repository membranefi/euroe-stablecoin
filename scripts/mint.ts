import { FireblocksSDK, PeerType, TransactionOperation } from "fireblocks-sdk";
import { EthersBridge, Chain } from "fireblocks-defi-sdk";
import { ethers, PopulatedTransaction } from "ethers";
import * as fs from "fs";
import euroJSON from "../artifacts/contracts/EUROStablecoin.sol/EUROStablecoin.json";
import { EUROStablecoin } from "../typechain/euro";
import { getMintChecksum } from "./tools";
import { network } from "hardhat";

const PROXY_ADDRESS = "0xfADabA2a4E604D19388365E4a8486745eeDe8B59";

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
  ) as EUROStablecoin;

  const target = "0xa084ab564149ea4a2113c29Ab1772B2F0F874a66";
  const mintAmount = 8;
  const externalId = 16;
  const checksum = await getMintChecksum([target], [mintAmount], externalId);

  const tx: PopulatedTransaction = await contract.populateTransaction.mintSet(
    [target],
    [mintAmount],
    externalId,
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
