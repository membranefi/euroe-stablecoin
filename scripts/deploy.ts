import { ethers, network, upgrades } from "hardhat";
import Env from "dotenv";
import hre from "hardhat";
import "@openzeppelin/hardhat-upgrades";
import { EUROStablecoin } from "../typechain/euro";

Env.config({ path: "./.secrets.env" });

async function main() {
  const accounts = await ethers.getSigners();
  const proxyOwner = accounts[0],
    admin = proxyOwner,
    blocklister = proxyOwner,
    pauser = proxyOwner,
    unpauser = proxyOwner,
    minter = proxyOwner;

  const Token = await ethers.getContractFactory("EUROStablecoin");
  const deployment = await upgrades.deployProxy(
    Token,
    [
      proxyOwner.address,
      admin.address,
      blocklister.address,
      pauser.address,
      unpauser.address,
      minter.address,
    ],
    {
      kind: "uups",
    }
  );
  const proxy = (await deployment.deployed()) as EUROStablecoin;

  const implementation = await proxy.getImplementation();
  console.log("Token address:", implementation);
  console.log("Proxy address:", proxy.address);

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
