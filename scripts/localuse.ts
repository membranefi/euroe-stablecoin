import { ethers, network, upgrades } from "hardhat";
import Env from "dotenv";
import hre from "hardhat";
import "@openzeppelin/hardhat-upgrades";
import { EUROe } from "../typechain/euroe";
import {
  createTypedERC2612Data,
  Domain,
  ERC2612PermitMessage,
} from "./eth-permit/eth-permit";
import { splitSignatureToRSV } from "./eth-permit/rpc";

Env.config({ path: "./.secrets.env" });

async function main() {
  // SET PARAMETERS

  const accounts = await ethers.getSigners();
  const proxyOwner = accounts[0],
    admin = proxyOwner,
    blocklister = proxyOwner,
    pauser = proxyOwner,
    unpauser = proxyOwner,
    minter = proxyOwner,
    rescuer = proxyOwner,
    burner = proxyOwner;

  const deadline = 1967397081;
  const jsonProvider = new ethers.providers.JsonRpcProvider(
    "http://127.0.0.1:8545"
  );
  const nonce = 0;
  const amount = 2;
  const spenderAddress = accounts[1].address;
  const walletAddress = proxyOwner.address;

  // DEPLOY
  const Token = await ethers.getContractFactory("EUROe");
  const deployment = await upgrades.deployProxy(
    Token,
    [
      proxyOwner.address,
      admin.address,
      blocklister.address,
      pauser.address,
      unpauser.address,
      minter.address,
      rescuer.address,
      burner.address,
    ],
    {
      kind: "uups",
    }
  );
  const proxy = (await deployment.deployed()) as EUROe;

  const implementation = await proxy.getImplementation();
  console.log("Token address:", implementation);
  console.log("Proxy address:", proxy.address);

  // FORM DATA TO SIGN

  const domain: Domain = {
    name: "EURO Stablecoin",
    version: "1",
    chainId: 31337,
    verifyingContract: proxy.address,
  };

  const message: ERC2612PermitMessage = {
    owner: walletAddress,
    spender: spenderAddress,
    value: amount,
    nonce: nonce,
    deadline: deadline,
  };

  const typedData = createTypedERC2612Data(message, domain);

  const json = JSON.stringify(typedData);

  // SIGN DATA

  const rpcResult = await jsonProvider.send("eth_signTypedData_v4", [
    walletAddress,
    json,
  ]);
  const rpxSig = splitSignatureToRSV(rpcResult);

  // USE SIGNATURE TO CREATE ALLOWANCE AND CHECK THAT IT WORKS

  const allBefore = await proxy.allowance(walletAddress, spenderAddress);
  await proxy.permit(
    walletAddress,
    spenderAddress,
    amount,
    deadline,
    rpxSig.v,
    rpxSig.r,
    rpxSig.s
  );
  const allAfter = await proxy.allowance(walletAddress, spenderAddress);
  // Should output '0 2'
  console.log("allowances", allBefore.toString(), allAfter.toString());
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
