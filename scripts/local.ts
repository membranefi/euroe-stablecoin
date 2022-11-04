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

  /*   const types = {
    EIP712Domain,
    Permit: [
      { name: "owner", type: "address" },
      { name: "spender", type: "address" },
      { name: "value", type: "uint256" },
      { name: "nonce", type: "uint256" },
      { name: "deadline", type: "uint256" },
    ],
  }; */

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

  //const sig = await signData(wallet, wallet.address, typedData);
  const ownSign = await jsonSigner._signTypedData(domain, types, typedData);

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

  const msgParams = JSON.stringify({
    domain: {
      // Defining the chain aka Rinkeby testnet or Ethereum Main Net
      chainId: 1,
      // Give a user friendly name to the specific contract you are signing for.
      name: "Ether Mail",
      // If name isn't enough add verifying contract to make sure you are establishing contracts with the proper entity
      verifyingContract: "0xCcCCccccCCCCcCCCCCCcCcCccCcCCCcCcccccccC",
      // Just let's you know the latest version. Definitely make sure the field name is correct.
      version: "1",
    },

    // Defining the message signing data content.
    message: {
      /*
       - Anything you want. Just a JSON Blob that encodes the data you want to send
       - No required fields
       - This is DApp Specific
       - Be as explicit as possible when building out the message schema.
      */
      contents: "Hello, Bob!",
      attachedMoneyInEth: 4.2,
      from: {
        name: "Cow",
        wallets: [
          "0xCD2a3d9F938E13CD947Ec05AbC7FE734Df8DD826",
          "0xDeaDbeefdEAdbeefdEadbEEFdeadbeEFdEaDbeeF",
        ],
      },
      to: [
        {
          name: "Bob",
          wallets: [
            "0xbBbBBBBbbBBBbbbBbbBbbbbBBbBbbbbBbBbbBBbB",
            "0xB0BdaBea57B0BDABeA57b0bdABEA57b0BDabEa57",
            "0xB0B0b0b0b0b0B000000000000000000000000000",
          ],
        },
      ],
    },
    // Refers to the keys of the *types* object below.
    primaryType: "Mail",
    types: {
      // TODO: Clarify if EIP712Domain refers to the domain the contract is hosted on
      EIP712Domain: [
        { name: "name", type: "string" },
        { name: "version", type: "string" },
        { name: "chainId", type: "uint256" },
        { name: "verifyingContract", type: "address" },
      ],
      // Not an EIP712Domain definition
      Group: [
        { name: "name", type: "string" },
        { name: "members", type: "Person[]" },
      ],
      // Refer to PrimaryType
      Mail: [
        { name: "from", type: "Person" },
        { name: "to", type: "Person[]" },
        { name: "contents", type: "string" },
      ],
      // Not an EIP712Domain definition
      Person: [
        { name: "name", type: "string" },
        { name: "wallets", type: "address[]" },
      ],
    },
  });

  const rpcResult = await jsonProvider.send("eth_signTypedData_v4", [
    walletAddress,
    json,
  ]);
  console.log("WPC", rpcResult);
  console.log("encoded", encoded);
  console.log("hash", hash);

  //console.log("message", json);
  console.log("own", sig.v, sig.r, sig.s);
  console.log("eth", ethSign.v, ethSign.r, ethSign.s);
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
