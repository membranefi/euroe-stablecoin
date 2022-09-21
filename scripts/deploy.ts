import { ethers, network } from "hardhat";
import contractJSON from "../artifacts/contracts/EUROStablecoin.sol/EUROStablecoin.json";
import proxyJSON from "../artifacts/@openzeppelin/contracts/proxy/ERC1967/ERC1967Proxy.sol/ERC1967Proxy.json";
import { Interface } from "ethers/lib/utils";
import { deploy, verify } from "./tools";

// Used for deploying to FireBlocks
async function main() {
  let address_proxyOwner: string,
    address_admin: string,
    address_blocklister: string,
    address_pauser: string,
    address_unpauser: string,
    address_minter: string,
    api_secret_path: string,
    api_key: string,
    vault_account_id: string,
    alchemy_api_key: string;

  if (network.name == "goerli") {
    address_proxyOwner = process.env.GOERLI_FIREBLOCKS_PROXYOWNER;
    address_admin = process.env.GOERLI_FIREBLOCKS_PROXYOWNER;
    address_blocklister = process.env.GOERLI_FIREBLOCKS_PROXYOWNER;
    address_pauser = process.env.GOERLI_FIREBLOCKS_PROXYOWNER;
    address_unpauser = process.env.GOERLI_FIREBLOCKS_PROXYOWNER;
    address_minter = process.env.GOERLI_FIREBLOCKS_PROXYOWNER;
    api_secret_path = process.env.GOERLI_FIREBLOCKS_API_SECRET_PATH_PROXYOWNER;
    api_key = process.env.GOERLI_FIREBLOCKS_API_KEY_PROXYOWNER;
    vault_account_id = process.env.GOERLI_FIREBLOCKS_SOURCE_VAULT_ACCOUNT_ID;
    alchemy_api_key = process.env.GOERLI_ALCHEMY_APIKEY;
  } else if (network.name == "mainnet") {
    address_proxyOwner = process.env.MAINNET_FIREBLOCKS_PROXYOWNER;
    address_admin = process.env.MAINNET_FIREBLOCKS_PROXYOWNER;
    address_blocklister = process.env.MAINNET_FIREBLOCKS_PROXYOWNER;
    address_pauser = process.env.MAINNET_FIREBLOCKS_PROXYOWNER;
    address_unpauser = process.env.MAINNET_FIREBLOCKS_PROXYOWNER;
    address_minter = process.env.MAINNET_FIREBLOCKS_PROXYOWNER;
    api_secret_path = process.env.MAINNET_FIREBLOCKS_API_SECRET_PATH;
    api_key = process.env.MAINNET_FIREBLOCKS_API_KEY;
    vault_account_id = process.env.MAINNET_FIREBLOCKS_SOURCE_VAULT_ACCOUNT_ID;
    alchemy_api_key = process.env.MAINNET_ALCHEMY_APIKEY;
  }

  if (network.name == "hardhat" || network.name == "localhost") {
    throw "Local deployment not possible";
  }

  if (
    !process.env.ETHERSCAN_APIKEY ||
    !api_secret_path ||
    !api_key ||
    !vault_account_id ||
    !alchemy_api_key ||
    !address_proxyOwner ||
    !address_admin ||
    !address_blocklister ||
    !address_pauser ||
    !address_unpauser ||
    !address_minter
  ) {
    throw "Invalid configuration";
  }

  const proxyIFace = new Interface(proxyJSON.abi);
  const implIFace = new Interface(contractJSON.abi);

  const implDeploy = implIFace.encodeDeploy([]);
  const implDeployment = contractJSON.bytecode + implDeploy.replace("0x", "");

  const encoded = implIFace.encodeFunctionData("initialize", [
    address_proxyOwner,
    address_admin,
    address_blocklister,
    address_pauser,
    address_unpauser,
    address_minter,
  ]);

  const implAddress = await deploy(
    api_secret_path,
    api_key,
    vault_account_id,
    implDeployment
  );

  const proxyParameters = [implAddress, encoded];
  const proxyDeploy = proxyIFace.encodeDeploy(proxyParameters);
  const proxyDeployment = proxyJSON.bytecode + proxyDeploy.replace("0x", "");

  const proxyAddress = await deploy(
    api_secret_path,
    api_key,
    vault_account_id,
    proxyDeployment
  );

  // Wait for the contracts to be propagated inside Etherscan
  await new Promise((f) => setTimeout(f, 60000));

  await verify(implAddress, []);
  await verify(proxyAddress, proxyParameters);

  console.log("Proxy address:", proxyAddress);
  console.log("Implementation address (not needed usually):", implAddress);

  console.log(
    "Contracts verified. You can now go to contract at " +
      proxyAddress +
      " and mark it as proxy. That will be your contract to interact with."
  );
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
