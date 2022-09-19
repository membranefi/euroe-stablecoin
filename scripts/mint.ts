import { FireblocksSDK, PeerType, TransactionOperation } from "fireblocks-sdk";
import { EthersBridge, Chain } from "fireblocks-defi-sdk";
import { ethers, PopulatedTransaction } from "ethers";
import * as fs from "fs";
import eureJSON from "../artifacts/contracts/EUROStablecoin.sol/EUROStablecoin.json";
import { EUROStablecoin } from "../typechain/euro";

//import theJson from "../artifacts/contracts/mock/FBTest.sol/Demo.json";

const CHAIN = Chain.GOERLI;
const CONTRACT_ADDRESS = "0x83FD9bb7ed90ec0A16bbDa7f7d281e49B584B794";
/* const CONTRACT_ABI = [
  {
    inputs: [
      {
        internalType: "uint256",
        name: "number",
        type: "uint256",
      },
    ],
    name: "Store",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "input",
        type: "uint256",
      },
    ],
    name: "GiveBack",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    stateMutability: "pure",
    type: "function",
  },
  {
    inputs: [],
    name: "stor",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
];  */

async function processTransaction(
  bridge: EthersBridge,
  tx: PopulatedTransaction
) {
  const res = await bridge.sendTransaction(tx);

  console.log("Waiting for the transaction to be signed and mined");

  const txHash = await bridge.waitForTxHash(res.id);

  console.log(`Transaction ${res.id} has been broadcast. TX Hash is ${txHash}`);
}

(async function () {
  const apiSecret = fs.readFileSync(
    process.env.FIREBLOCKS_API_SECRET_PATH,
    "utf8"
  );
  const fireblocksApiClient = new FireblocksSDK(
    apiSecret,
    process.env.FIREBLOCKS_API_KEY,
    process.env.FIREBLOCKS_API_BASE_URL
  );

  const bridge = new EthersBridge({
    fireblocksApiClient,
    vaultAccountId: process.env.FIREBLOCKS_SOURCE_VAULT_ACCOUNT || "0",
    externalWalletId: process.env.FIREBLOCKS_EXTERNAL_WALLET,
    chain: CHAIN,
  });

  const contract = new ethers.Contract(
    CONTRACT_ADDRESS,
    eureJSON.abi,
    ethers.getDefaultProvider(CHAIN)
  ) as EUROStablecoin;

  const tx: PopulatedTransaction = await contract.populateTransaction.pause();

  console.log("Sending transaction for signing");

  await processTransaction(bridge, tx);
})().catch((err) => {
  console.log("error", err);
  process.exit(1);
});
