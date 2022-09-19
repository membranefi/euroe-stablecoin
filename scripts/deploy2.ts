import { FireblocksSDK, PeerType, TransactionOperation } from "fireblocks-sdk";
import * as fs from "fs";
import hre, { ethers } from "hardhat";
import contractJSON from "../artifacts/contracts/EUROStablecoin.sol/EUROStablecoin.json";
import proxyJSON from "../artifacts/@openzeppelin/contracts/proxy/ERC1967/ERC1967Proxy.sol/ERC1967Proxy.json";
import { Interface } from "ethers/lib/utils";

(async function () {
  const accounts = await ethers.getSigners();

  const tx = (await ethers.provider.getTransaction(
    "0x01d7b1bc3abc04724a91210b695f4be54e31f118d23dec7cbd93571c0e9ca0ab"
  )) as any;
  console.log("tx", tx.creates);

  console.log("Sending transaction for signing to FB");
})().catch((err) => {
  console.log("error", err);
  process.exit(1);
});
