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
import { JsonRpcSigner, Network } from "@ethersproject/providers";

// This script is used for manually testing minting

const PROXY_ADDRESS = "0x8f21060D05DF9BcA475Ba23eA26AcCCab9944a2e"; // Address of the token contract (proxy)

const ownerAddress = "0x79afEb066057CF42bDA226F132AF771ADc415E40"; // minter
const vaultAccountId = "4"; // minter
const spenderAddress = "0x7e3F7C5cBe4F7B1f863b2251Cb801b4dEE902a0f"; // proxyowner
const deadline = 1967397081;

async function main() {
  const provider = ethers.getDefaultProvider();

  //const netw = ethers.providers.getNetwork(31337);

  const jsonProvider = new ethers.providers.JsonRpcProvider(
    "http://127.0.0.1:8545"
  );

  const pk =
    "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80"; // hardhat's 1st wallet
  const nonce = 0;
  //const wallet = new ethers.Wallet(pk, jsonProvider);
  //console.log("wallets");
  const jsonSigner = await jsonProvider.getSigner(0);
  const walletAddress = await jsonSigner.getAddress();

  const domain: Domain = {
    name: "EURO Stablecoin",
    version: "1",
    chainId: 5,
    verifyingContract: PROXY_ADDRESS,
  };

  const message: ERC2612PermitMessage = {
    owner: walletAddress,
    spender: spenderAddress,
    value: 2,
    //nonce: nonce === undefined ? await call(provider, tokenAddress, `${NONCES_FN}${zeros(24)}${vaultAddress.substr(2)}`) : nonce,
    nonce: 0,
    deadline: deadline,
  };

  const typedData = createTypedERC2612Data(message, domain);
  //console.log("Typed", typedData);
  const json = JSON.stringify(typedData);

  const { EIP712Domain: _unused, ...types2 } = typedData.types;
  const types: any = types2;
  //console.log("I'm trying", typedData.domain, types, typedData.message);

  const sig2 = await jsonSigner._signTypedData(
    typedData.domain,
    types,
    typedData.message
  );

  //console.log("sig2", sig2);
  const sig = splitSignatureToRSV(sig2);
  console.log("done2");
  //const sig = await signData(wallet, wallet.address, typedData);
  //const ownSign = await jsonSigner._signTypedData(domain, types, typedData);
  console.log("done3");
  const ethSign = await signERC2612Permit(
    jsonSigner,
    PROXY_ADDRESS,
    walletAddress,
    spenderAddress,
    2,
    deadline,
    nonce
  );

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

  const rpcResult = await jsonProvider.send("eth_signTypedData_v4", [
    walletAddress,
    json,
  ]);
  console.log("json", json);
  const rpxSig = splitSignatureToRSV(rpcResult);
  /*   console.log("WPC", rpcResult);
  console.log("encoded", encoded);
  console.log("hash", hash); */

  //console.log("message", json);
  console.log("own", sig.v, sig.r, sig.s);
  console.log("eth", ethSign.v, ethSign.r, ethSign.s);
  console.log("rpx", rpxSig.v, rpxSig.r, rpxSig.s);
  return;
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
function zeros(arg0: number) {
  throw new Error("Function not implemented.");
}
