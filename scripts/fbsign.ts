import {
  FireblocksSDK,
  PeerType,
  TransactionOperation,
  TransactionStatus,
} from "fireblocks-sdk";
import { EthersBridge, Chain } from "fireblocks-defi-sdk";
import { ethers, waffle } from "hardhat";
import * as fs from "fs";
import euroJSON from "../artifacts/contracts/EUROe.sol/EUROe.json";
import { EUROe } from "../typechain/euroe";
import { getMintChecksum } from "./tools";
import { network } from "hardhat";
import {
  createTypedERC2612Data,
  Domain,
  EIP712Domain,
  ERC2612PermitMessage,
  getDomain,
  MAX_INT,
  signERC2612Permit,
} from "./eth-permit/eth-permit";
import { getJsonWalletAddress } from "ethers/lib/utils";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { signData, splitSignatureToRSV } from "./eth-permit/rpc";

// This script is used for manually testing minting

export const PROXY_ADDRESS = "0x8f21060D05DF9BcA475Ba23eA26AcCCab9944a2e"; // Address of the token contract (proxy)
export const ownerAddress = "0x79afEb066057CF42bDA226F132AF771ADc415E40"; // minter
export const vaultAccountId = "4"; // minter
export const spenderAddress = "0x7e3F7C5cBe4F7B1f863b2251Cb801b4dEE902a0f"; // proxyowner
export const deadline = 1967397081;
export const nonce = 0;
export const amount = 2;

let api_secret_path: string, api_key: string, vault_account_id: string;

let usedChain: Chain;

if (network.name == "goerliFB") {
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

async function main() {
  const apiSecret = fs.readFileSync(api_secret_path, "utf8");
  const apiClient = new FireblocksSDK(apiSecret, api_key);

  const domain: Domain = {
    name: "EURO Stablecoin",
    version: "1",
    chainId: 5,
    verifyingContract: PROXY_ADDRESS,
  };

  const message: ERC2612PermitMessage = {
    owner: ownerAddress,
    spender: spenderAddress,
    value: amount,
    //nonce: nonce === undefined ? await call(provider, tokenAddress, `${NONCES_FN}${zeros(24)}${vaultAddress.substr(2)}`) : nonce,
    nonce: nonce,
    deadline: deadline,
  };

  const typedData = createTypedERC2612Data(message, domain);

  const fbTypedData = {
    type: "EIP712",
    index: 0,
    content: typedData,
  };

  const json = JSON.stringify(fbTypedData);

  const { EIP712Domain: _unused, ...types2 } = typedData.types;
  const types: any = types2;

  const encoded = ethers.utils._TypedDataEncoder.encode(
    domain,
    types,
    typedData.message
  );
  const hash = ethers.utils._TypedDataEncoder.hash(
    domain,
    types,
    typedData.message
  );
  /*   console.log("encoded", encoded);
  console.log("hash", hash); */
  console.log("json", json);

  const msgToSend = json;

  const { status, id } = await apiClient.createTransaction({
    operation: TransactionOperation.TYPED_MESSAGE,
    assetId: "ETH_TEST3",
    source: { type: PeerType.VAULT_ACCOUNT, id: vaultAccountId },
    note: `Test Message`,
    amount: "0",
    extraParameters: {
      rawMessageData: {
        messages: [
          {
            content: msgToSend,
            type: "ETH_MESSAGE",
          },
        ],
      },
      /* rawMessageData: {
        messages: [
          {
            content: Buffer.from(msgToSend).toString("hex"),
            //     index: 0,
            type: "ETH_MESSAGE",
          },
        ],
      }, */
    },
  });

  let currentStatus = status;
  let txInfo = await apiClient.getTransactionById(id);

  console.log("curr status", currentStatus);

  while (
    currentStatus != TransactionStatus.COMPLETED &&
    currentStatus != TransactionStatus.FAILED
  ) {
    try {
      console.log("keep polling for tx " + id + "; status: " + currentStatus);
      txInfo = await apiClient.getTransactionById(id);
      currentStatus = txInfo.status;
    } catch (err) {
      console.log("err", err);
    }
    await new Promise((r) => setTimeout(r, 1000));
  }

  if (currentStatus == TransactionStatus.FAILED) {
    throw "Transaction failed. Substatus: " + txInfo.subStatus;
  }

  /*   const walletAddresses = await apiClient.getDepositAddresses(
    vaultAccountId,
    "ETH"
  );

  console.log(walletAddresses);

  console.log("Address: ", walletAddresses[0].address); */
  //console.log("Message: ", message, txInfo);

  const signature = txInfo.signedMessages[0].signature;

  const v = 27 + signature.v;
  console.log("Signature: ", "0x" + signature.r + signature.s + v.toString(16));
  console.log("v:", signature.v, "r:", signature.r, "s:", signature.s);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
