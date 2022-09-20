import { ethers, network } from "hardhat";
import contractJSON from "../artifacts/contracts/EUROStablecoin.sol/EUROStablecoin.json";
import proxyJSON from "../artifacts/@openzeppelin/contracts/proxy/ERC1967/ERC1967Proxy.sol/ERC1967Proxy.json";
import { Interface } from "ethers/lib/utils";
import { deploy, verify } from "./tools";

// Used for deploying to FireBlocks
async function main() {
  const accounts = await ethers.getSigners();

  // CONFIGURE addresses
  const proxyOwner = accounts[0],
    admin = "0x46D76B07c96aB45e4d794a7bcFAF6C06F6f6fd13",
    blocklister = "0x46D76B07c96aB45e4d794a7bcFAF6C06F6f6fd13",
    pauser = "0x46D76B07c96aB45e4d794a7bcFAF6C06F6f6fd13",
    unpauser = "0x46D76B07c96aB45e4d794a7bcFAF6C06F6f6fd13",
    minter = "0x46D76B07c96aB45e4d794a7bcFAF6C06F6f6fd13";

  if (network.name == "hardhat" || network.name == "localhost") {
    throw "Local deployment not possible";
  }

  if (
    !process.env.GOERLI_FIREBLOCKS_API_SECRET_PATH ||
    !process.env.GOERLI_FIREBLOCKS_API_KEY ||
    !process.env.GOERLI_FIREBLOCKS_SOURCE_VAULT_ACCOUNT_INDEX ||
    !process.env.ETHERSCAN_APIKEY ||
    !process.env.GOERLI_ALCHEMY_APIKEY
  ) {
    throw "Invalid configuration";
  }

  const proxyIFace = new Interface(proxyJSON.abi);
  const implIFace = new Interface(contractJSON.abi);

  const implDeploy = implIFace.encodeDeploy([]);
  const implDeployment = contractJSON.bytecode + implDeploy.replace("0x", "");

  const encoded = implIFace.encodeFunctionData("initialize", [
    proxyOwner.address,
    admin,
    blocklister,
    pauser,
    unpauser,
    minter,
  ]);

  const implAddress = await deploy(implDeployment);

  const proxyParameters = [implAddress, encoded];
  const proxyDeploy = proxyIFace.encodeDeploy(proxyParameters);
  const proxyDeployment = proxyJSON.bytecode + proxyDeploy.replace("0x", "");

  const proxyAddress = await deploy(proxyDeployment);

  // Wait for the contracts to be propagated inside Etherscan
  await new Promise((f) => setTimeout(f, 60000));

  await verify(implAddress, []);
  await verify(proxyAddress, proxyParameters);

  console.log("Token address:", implAddress);
  console.log("Proxy address:", proxyAddress);

  console.log(
    "Contracts verified. You can now go to contract at " +
      proxyAddress +
      " and mark it as proxy"
  );
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
