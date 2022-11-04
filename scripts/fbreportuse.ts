import { FireblocksSDK, PeerType, TransactionOperation } from "fireblocks-sdk";
import { EthersBridge, Chain } from "fireblocks-defi-sdk";
import { ethers, PopulatedTransaction } from "ethers";
import * as fs from "fs";
import euroJSON from "../artifacts/contracts/EUROe.sol/EUROe.json";
import { EUROe } from "../typechain/euroe";
import { network } from "hardhat";
import {
  amount,
  deadline,
  ownerAddress,
  PROXY_ADDRESS,
  spenderAddress,
} from "./fbreportcreate";

let api_secret_path: string, api_key: string, vault_account_id: string;

let usedChain: Chain;

if (network.name == "goerliFB") {
  api_secret_path = process.env.GOERLI_FIREBLOCKS_API_SECRET_PATH_PROXYOWNER;
  api_key = process.env.GOERLI_FIREBLOCKS_API_KEY_PROXYOWNER;
  vault_account_id = "1";
  usedChain = Chain.GOERLI;
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

  const tx: PopulatedTransaction =
    await contract.populateTransaction.burnFromWithPermit(
      ownerAddress,
      spenderAddress,
      amount,
      deadline,
      0,
      "0x726ff1306491790d31aee148a73fcc027660e2d06cc788b894acf450799b0af9",
      "0x4ca2f7fe618fd9a6f0fe28f00efeb48c51fefde1c7bdccb6e39fe13bfa923f67"
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
