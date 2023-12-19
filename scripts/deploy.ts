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
    address_minter: string,
    address_rescuer: string,
    address_burner: string;

  if (network.name == "goerliFB") {
    address_proxyOwner = process.env.GOERLI_FIREBLOCKS_PROXYOWNER;
    address_admin = process.env.GOERLI_FIREBLOCKS_ADMIN;
    address_blocklister = process.env.GOERLI_FIREBLOCKS_BLOCKLISTER;
    address_pauser = process.env.GOERLI_FIREBLOCKS_PAUSER;
    address_unpauser = process.env.GOERLI_FIREBLOCKS_UNPAUSER;
    address_minter = process.env.GOERLI_FIREBLOCKS_MINTER;
    address_rescuer = process.env.GOERLI_FIREBLOCKS_RESCUER;
    address_burner = process.env.GOERLI_FIREBLOCKS_BURNER;
  } else if (network.name == "mainnetFB") {
    address_proxyOwner = process.env.MAINNET_FIREBLOCKS_PROXYOWNER;
    address_admin = process.env.MAINNET_FIREBLOCKS_ADMIN;
    address_blocklister = process.env.MAINNET_FIREBLOCKS_BLOCKLISTER;
    address_pauser = process.env.MAINNET_FIREBLOCKS_PAUSER;
    address_unpauser = process.env.MAINNET_FIREBLOCKS_UNPAUSER;
    address_minter = process.env.MAINNET_FIREBLOCKS_MINTER;
    address_rescuer = process.env.MAINNET_FIREBLOCKS_RESCUER;
    address_burner = process.env.MAINNET_FIREBLOCKS_BURNER;
  } else if (network.name == "mumbaiFB") {
    address_proxyOwner = process.env.MUMBAI_FIREBLOCKS_PROXYOWNER;
    address_admin = process.env.MUMBAI_FIREBLOCKS_ADMIN;
    address_blocklister = process.env.MUMBAI_FIREBLOCKS_BLOCKLISTER;
    address_pauser = process.env.MUMBAI_FIREBLOCKS_PAUSER;
    address_unpauser = process.env.MUMBAI_FIREBLOCKS_UNPAUSER;
    address_minter = process.env.MUMBAI_FIREBLOCKS_MINTER;
    address_rescuer = process.env.MUMBAI_FIREBLOCKS_RESCUER;
    address_burner = process.env.MUMBAI_FIREBLOCKS_BURNER;
  }else if (network.name =="polyMainnetFB") {
    address_proxyOwner = process.env.POLY_FIREBLOCKS_PROXYOWNER;
    address_admin = process.env.POLY_FIREBLOCKS_ADMIN;
    address_blocklister = process.env.POLY_FIREBLOCKS_BLOCKLISTER;
    address_pauser = process.env.POLY_FIREBLOCKS_PAUSER;
    address_unpauser = process.env.POLY_FIREBLOCKS_UNPAUSER;
    address_minter = process.env.POLY_FIREBLOCKS_MINTER;
    address_rescuer = process.env.POLY_FIREBLOCKS_RESCUER;
    address_burner = process.env.POLY_FIREBLOCKS_BURNER;
  }else if (network.name =="avalancheTestNetFB"){
    address_proxyOwner = process.env.FUJI_FIREBLOCKS_PROXYOWNER;
    address_admin = process.env.FUJI_FIREBLOCKS_ADMIN;
    address_blocklister = process.env.FUJI_FIREBLOCKS_BLOCKLISTER;
    address_pauser = process.env.FUJI_FIREBLOCKS_PAUSER;
    address_unpauser = process.env.FUJI_FIREBLOCKS_UNPAUSER;
    address_minter = process.env.FUJI_FIREBLOCKS_MINTER;
    address_rescuer = process.env.FUJI_FIREBLOCKS_RESCUER;
    address_burner = process.env.FUJI_FIREBLOCKS_BURNER;
  }else if (network.name =="avalancheFB"){
    address_proxyOwner = process.env.AVAX_FIREBLOCKS_PROXYOWNER;
    address_admin = process.env.AVAX_FIREBLOCKS_ADMIN;
    address_blocklister = process.env.AVAX_FIREBLOCKS_BLOCKLISTER;
    address_pauser = process.env.AVAX_FIREBLOCKS_PAUSER;
    address_unpauser = process.env.AVAX_FIREBLOCKS_UNPAUSER;
    address_minter = process.env.AVAX_FIREBLOCKS_MINTER;
    address_rescuer = process.env.AVAX_FIREBLOCKS_RESCUER;
    address_burner = process.env.AVAX_FIREBLOCKS_BURNER;
  }else if (network.name =="gaiaxDirect"){
    address_proxyOwner = process.env.GAIAX_TESTNET_DEVELOPER_ADDRESS;
    address_admin = process.env.GAIAX_TESTNET_DEVELOPER_ADDRESS; 
    address_blocklister = process.env.GAIAX_TESTNET_DEVELOPER_ADDRESS;
    address_pauser = process.env.GAIAX_TESTNET_DEVELOPER_ADDRESS;
    address_unpauser = process.env.GAIAX_TESTNET_DEVELOPER_ADDRESS;
    address_minter = process.env.GAIAX_TESTNET_DEVELOPER_ADDRESS;
    address_rescuer = process.env.GAIAX_TESTNET_DEVELOPER_ADDRESS;
    address_burner = process.env.GAIAX_TESTNET_DEVELOPER_ADDRESS;
  }else if (network.name =="arbitrumGoerliDirect"){
  address_proxyOwner = process.env.ARBI_GOERLI_DEVELOPER_ADDRESS;
  address_admin = process.env.ARBI_GOERLI_DEVELOPER_ADDRESS; 
  address_blocklister = process.env.ARBI_GOERLI_DEVELOPER_ADDRESS;
  address_pauser = process.env.ARBI_GOERLI_DEVELOPER_ADDRESS;
  address_unpauser = process.env.ARBI_GOERLI_DEVELOPER_ADDRESS;
  address_minter = process.env.ARBI_GOERLI_DEVELOPER_ADDRESS;
  address_rescuer = process.env.ARBI_GOERLI_DEVELOPER_ADDRESS;
  address_burner = process.env.ARBI_GOERLI_DEVELOPER_ADDRESS;
}else if (network.name =="arbitrumOneFB"){
  address_proxyOwner = process.env.ARB_FIREBLOCKS_PROXYOWNER;
    address_admin = process.env.ARB_FIREBLOCKS_ADMIN;
    address_blocklister = process.env.ARB_FIREBLOCKS_BLOCKLISTER;
    address_pauser = process.env.ARB_FIREBLOCKS_PAUSER;
    address_unpauser = process.env.ARB_FIREBLOCKS_UNPAUSER;
    address_minter = process.env.ARB_FIREBLOCKS_MINTER;
    address_rescuer = process.env.ARB_FIREBLOCKS_RESCUER;
    address_burner = process.env.ARB_FIREBLOCKS_BURNER;
}else if (network.name == "sepoliaFB") {
  address_proxyOwner = process.env.SEPOLI_FIREBLOCKS_PROXYOWNER;
  address_admin = process.env.SEPOLI_FIREBLOCKS_ADMIN;
  address_blocklister = process.env.SEPOLI_FIREBLOCKS_BLOCKLISTER;
  address_pauser = process.env.SEPOLI_FIREBLOCKS_PAUSER;
  address_unpauser = process.env.SEPOLI_FIREBLOCKS_UNPAUSER;
  address_minter = process.env.SEPOLI_FIREBLOCKS_MINTER;
  address_rescuer = process.env.SEPOLI_FIREBLOCKS_RESCUER;
  address_burner = process.env.SEPOLI_FIREBLOCKS_BURNER;
}else if (network.name =="opFB")
{
  address_proxyOwner = process.env.OP_FIREBLOCKS_PROXYOWNER;
  address_admin = process.env.OP_FIREBLOCKS_ADMIN;
  address_blocklister = process.env.OP_FIREBLOCKS_BLOCKLISTER;
  address_pauser = process.env.OP_FIREBLOCKS_PAUSER;
  address_unpauser = process.env.OP_FIREBLOCKS_UNPAUSER;
  address_minter = process.env.OP_FIREBLOCKS_MINTER;
  address_rescuer = process.env.OP_FIREBLOCKS_RESCUER;
  address_burner = process.env.OP_FIREBLOCKS_BURNER;
}

  if (network.name == "hardhat" || network.name == "localhost") {
    throw "Local deployment not possible";
  }

  if (
    !address_proxyOwner ||
    !address_admin ||
    !address_blocklister ||
    !address_pauser ||
    !address_unpauser ||
    !address_minter ||
    !address_rescuer ||
    !address_burner
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
    address_rescuer,
    address_burner,
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
