import { ethers, network, upgrades } from "hardhat";
import { verify } from "./tools";
import { EUROe } from "../typechain/euroe";

// Used for deploying to FireBlocks
async function main() {
  let address_proxyOwner: string,
    address_admin: string,
    address_blocklister: string,
    address_pauser: string,
    address_unpauser: string,
    address_minter: string;

  if (network.name == "goerliFB") {
    address_proxyOwner = process.env.GOERLI_FIREBLOCKS_PROXYOWNER;
    address_admin = process.env.GOERLI_FIREBLOCKS_PROXYOWNER;
    address_blocklister = process.env.GOERLI_FIREBLOCKS_PROXYOWNER;
    address_pauser = process.env.GOERLI_FIREBLOCKS_PROXYOWNER;
    address_unpauser = process.env.GOERLI_FIREBLOCKS_PROXYOWNER;
    address_minter = process.env.GOERLI_FIREBLOCKS_MINTER;
  } else if (network.name == "mainnet") {
    address_proxyOwner = process.env.MAINNET_FIREBLOCKS_PROXYOWNER;
    address_admin = process.env.MAINNET_FIREBLOCKS_PROXYOWNER;
    address_blocklister = process.env.MAINNET_FIREBLOCKS_PROXYOWNER;
    address_pauser = process.env.MAINNET_FIREBLOCKS_PROXYOWNER;
    address_unpauser = process.env.MAINNET_FIREBLOCKS_PROXYOWNER;
    address_minter = process.env.MAINNET_FIREBLOCKS_MINTER;
  }

  if (network.name == "hardhat" || network.name == "localhost") {
    throw "Local deployment not possible";
  }

  if (
    !process.env.ETHERSCAN_APIKEY ||
    !address_proxyOwner ||
    !address_admin ||
    !address_blocklister ||
    !address_pauser ||
    !address_unpauser ||
    !address_minter
  ) {
    throw "Invalid configuration";
  }

  const proxyParameters = [
    address_proxyOwner,
    address_admin,
    address_blocklister,
    address_pauser,
    address_unpauser,
    address_minter,
  ];
  const ImplementationFact = await ethers.getContractFactory("EUROe");
  const proxy = (await upgrades.deployProxy(
    ImplementationFact,
    proxyParameters,
    { kind: "uups" }
  )) as EUROe;
  await proxy.deployed();

  const implAddress = await proxy.getImplementation();

  console.log("Contracts deployed. Waiting for Etherscan verifications");
  // Wait for the contracts to be propagated inside Etherscan
  await new Promise((f) => setTimeout(f, 60000));

  await verify(implAddress, []);
  await verify(proxy.address, []);

  console.log(
    `Contracts deployed and verified. You can now interact with the proxy at: ${proxy.address} , implementation (not needed usually): ${implAddress} `
  );
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
