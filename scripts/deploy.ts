import { FireblocksSDK, PeerType, TransactionOperation } from "fireblocks-sdk";
import * as fs from "fs";
import hre, { ethers } from "hardhat";
import contractJSON from "../artifacts/contracts/EUROStablecoin.sol/EUROStablecoin.json";
import proxyJSON from "../artifacts/@openzeppelin/contracts/proxy/ERC1967/ERC1967Proxy.sol/ERC1967Proxy.json";
import { Interface } from "ethers/lib/utils";

(async function () {
  const accounts = await ethers.getSigners();

  // CONFIGURE addresses
  const proxyOwner = accounts[0],
    admin = "0x46D76B07c96aB45e4d794a7bcFAF6C06F6f6fd13",
    blocklister = "0x46D76B07c96aB45e4d794a7bcFAF6C06F6f6fd13",
    pauser = "0x46D76B07c96aB45e4d794a7bcFAF6C06F6f6fd13",
    unpauser = "0x46D76B07c96aB45e4d794a7bcFAF6C06F6f6fd13",
    minter = "0x46D76B07c96aB45e4d794a7bcFAF6C06F6f6fd13";

  const apiSecret = fs.readFileSync(
    process.env.FIREBLOCKS_API_SECRET_PATH,
    "utf8"
  );
  const fireblocksApiClient = new FireblocksSDK(
    apiSecret,
    process.env.FIREBLOCKS_API_KEY
  );

  //const implAddress = "0xc6661739e5698a48a10eca7af3b6f61b49f0a1d0";

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

  const deploy = async (bytecode: string) => {
    const create = await fireblocksApiClient.createTransaction({
      operation: TransactionOperation.CONTRACT_CALL,
      assetId: "ETH_TEST3",
      source: {
        type: PeerType.VAULT_ACCOUNT,
        id: process.env.FIREBLOCKS_SOURCE_VAULT_ACCOUNT_INDEX || "0",
      },
      destination: {
        type: PeerType.ONE_TIME_ADDRESS,
        oneTimeAddress: {
          address: "0x0",
        },
      },
      note: "Contract deployment transaction",
      amount: "0",
      extraParameters: {
        contractCallData: bytecode,
      },
    });

    console.log("Sending transaction for signing to FB");

    // https://dev.to/jakubkoci/polling-with-async-await-25p4
    async function poll(fn, fnCondition, ms) {
      let result = await fn();
      while (fnCondition(result)) {
        await wait(ms);
        result = await fn();
      }
      return result;
    }

    function wait(ms) {
      return new Promise((resolve) => {
        console.log(`waiting ${ms} ms...`);
        setTimeout(resolve, ms);
      });
    }

    const checkit = async () => {
      if (!create || !create.id) {
        return "";
      }

      const txData = await fireblocksApiClient.getTransactionById(create.id);

      if (!txData.txHash) {
        return "";
      }

      const tx = (await ethers.provider.getTransaction(txData.txHash)) as any;
      return tx.creates;
    };

    const result = await poll(checkit, (val) => !val, 5000);

    return result;
  };

  const implAddress = await deploy(implDeployment);

  const proxyDeploy = proxyIFace.encodeDeploy([implAddress, encoded]);
  const proxyDeployment = proxyJSON.bytecode + proxyDeploy.replace("0x", "");

  const proxyAddress = await deploy(proxyDeployment);

  console.log("Token address:", implAddress);
  console.log("Proxy address:", proxyAddress);
})().catch((err) => {
  console.log("error", err);
  process.exit(1);
});
