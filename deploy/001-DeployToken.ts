import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";

const func: DeployFunction = async (hre: HardhatRuntimeEnvironment) => {
  const { deployments, getNamedAccounts, network, ethers } = hre;
  const { deploy, getOrNull, catchUnknownSigner } = deployments;
  const { proxyOwner, admin, pauser, unpauser, blocklister, minter, multisig } =
    await getNamedAccounts();

  let contractName = "EUROStablecoin";
  if (!network.live) {
    contractName = "MockToken";
  }

  const results = await deploy(contractName + "_via_UUPS", {
    contract: contractName,
    from: multisig,
    args: [],
    proxy: {
      proxyContract: "ERC1967Proxy",
      proxyArgs: ["{implementation}", "{data}"],
      execute: {
        init: {
          methodName: "initialize",
          args: [proxyOwner, admin, blocklister, pauser, unpauser, minter],
        },
      },
    },
    log: true,
  });

  if (!network.live) {
    // saved by default in live networks
    const artifact = await deployments.getExtendedArtifact(contractName);
    let proxyDeployments = {
      address: results.address,
      ...artifact,
    };
    await deployments.save(contractName, proxyDeployments);
    console.log("Saved local deployment " + contractName);
  }

  console.log("Deployment ready");
};
export default func;
