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

// Used for deploying directly to Goerli
async function main() {
  const accounts = await ethers.getSigners();
  const proxyOwner = accounts[0],
    admin = proxyOwner,
    blocklister = proxyOwner,
    pauser = proxyOwner,
    unpauser = proxyOwner,
    minter = proxyOwner,
    rescuer = proxyOwner,
    burner = proxyOwner;

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

  const deadline = 1967397081;
  const jsonProvider = new ethers.providers.JsonRpcProvider(
    "http://127.0.0.1:8545"
  );
  const nonce = 0;
  const amount = 2;
  const spenderAddress = accounts[1].address;

  const jsonSigner = await jsonProvider.getSigner(0);
  const walletAddress = proxyOwner.address; //await jsonSigner.getAddress();

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
    //nonce: nonce === undefined ? await call(provider, tokenAddress, `${NONCES_FN}${zeros(24)}${vaultAddress.substr(2)}`) : nonce,
    nonce: nonce,
    deadline: deadline,
  };

  const typedData = createTypedERC2612Data(message, domain);
  //console.log("Typed", typedData);
  const json = JSON.stringify(typedData);
  const rpcResult = await jsonProvider.send("eth_signTypedData_v4", [
    walletAddress,
    json,
  ]);
  const rpxSig = splitSignatureToRSV(rpcResult);

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
  console.log("allowances", allBefore.toString(), allAfter.toString());

  if (network.name !== "hardhat" && network.name !== "localhost") {
    console.log("Deployments done, waiting for etherscan verifications");
    // Wait for the contracts to be propagated inside Etherscan
    await new Promise((f) => setTimeout(f, 60000));

    // Verify in scanner
    try {
      await hre.run("verify:verify", {
        address: implementation,
      });
    } catch (ex: unknown) {
      if (String(ex).indexOf("already verified") == -1) {
        // verified probably because it has the same bytecode as some other contract
        throw ex;
      }
    }

    console.log(
      "Contracts verified. You can now go to contract at " +
        proxy.address +
        " and mark it as proxy"
    );
  }
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
