import { FireblocksSDK, PeerType, TransactionOperation } from "fireblocks-sdk";
import { EthersBridge, Chain } from "fireblocks-defi-sdk";
import { PopulatedTransaction } from "ethers";
import * as fs from "fs";
import hre, { ethers } from "hardhat";
import eEureJSON from "../artifacts/contracts/EUROStablecoin.sol/EUROStablecoin.json";
import testJSON from "../artifacts/contracts/Test.sol/Test.json";
import proxyJSON from "../artifacts/@openzeppelin/contracts/proxy/ERC1967/ERC1967Proxy.sol/ERC1967Proxy.json";
import { Interface } from "ethers/lib/utils";

const CHAIN = Chain.GOERLI;

(async function () {
  /* console.log("Start");
  try {
    const Token = await ethers.getContractFactory("Test");
    const deployment = await Token.deploy(7);
    console.log("doneeee");
    const done = await deployment.deployed();
    console.log("HERE", deployment, done);
  } catch (ex: unknown) {
    console.log("some error", ex);
  }

  return; */

  const apiSecret = fs.readFileSync(
    process.env.FIREBLOCKS_API_SECRET_PATH,
    "utf8"
  );
  const fireblocksApiClient = new FireblocksSDK(
    apiSecret,
    process.env.FIREBLOCKS_API_KEY,
    process.env.FIREBLOCKS_API_BASE_URL
  );

  const accounts = await hre.ethers.getSigners();
  const deployer = accounts[0];

  //console.log("JSON", theJson.bytecode);

  //const bytec =
  //  "0x608060405234801561001057600080fd5b50610223806100206000396000f3fe608060405234801561001057600080fd5b50600436106100415760003560e01c80631be7230b1461004657806369404ebd14610076578063b28175c414610092575b600080fd5b610060600480360381019061005b91906100eb565b6100b0565b60405161006d9190610127565b60405180910390f35b610090600480360381019061008b91906100eb565b6100c6565b005b61009a6100d0565b6040516100a79190610127565b60405180910390f35b60006001826100bf9190610142565b9050919050565b8060008190555050565b60005481565b6000813590506100e5816101d6565b92915050565b600060208284031215610101576101006101d1565b5b600061010f848285016100d6565b91505092915050565b61012181610198565b82525050565b600060208201905061013c6000830184610118565b92915050565b600061014d82610198565b915061015883610198565b9250827fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff0382111561018d5761018c6101a2565b5b828201905092915050565b6000819050919050565b7f4e487b7100000000000000000000000000000000000000000000000000000000600052601160045260246000fd5b600080fd5b6101df81610198565b81146101ea57600080fd5b5056fea2646970667358221220fc6b3426e915d626dbae314619eb8dcc6326beb3c5c36a82df92516e9b04943b64736f6c63430008070033";
  const implAddress = "0xc6661739e5698a48a10eca7af3b6f61b49f0a1d0";

  const proxyIFace = new Interface(proxyJSON.abi);
  const implIFace = new Interface(eEureJSON.abi);
  const testIFace = new Interface(testJSON.abi);

  const testDeploy = testIFace.encodeDeploy([6]);

  const encoded = implIFace.encodeFunctionData("initialize", [
    implAddress,
    implAddress,
    implAddress,
    implAddress,
    implAddress,
    implAddress,
  ]);

  //const bytes = ethers.utils.toUtf8Bytes(encoded);

  const proxyDeploy = proxyIFace.encodeDeploy([implAddress, encoded]);
  //console.log("depl", proxyDeploy);

  const testDepl = testJSON.bytecode + testDeploy.replace("0x", "");
  const eureDepl = eEureJSON.bytecode;
  const proxyDepl = proxyJSON.bytecode + proxyDeploy.replace("0x", "");

  console.log("constructor args", proxyDeploy);

  const fullDeployment = proxyDepl;

  /*   const bytec =
    "0x608060405234801561001057600080fd5b50610223806100206000396000f3fe608060405234801561001057600080fd5b50600436106100415760003560e01c80631be7230b1461004657806369404ebd14610076578063b28175c414610092575b600080fd5b610060600480360381019061005b91906100eb565b6100b0565b60405161006d9190610127565b60405180910390f35b610090600480360381019061008b91906100eb565b6100c6565b005b61009a6100d0565b6040516100a79190610127565b60405180910390f35b60006001826100bf9190610142565b9050919050565b8060008190555050565b60005481565b6000813590506100e5816101d6565b92915050565b600060208284031215610101576101006101d1565b5b600061010f848285016100d6565b91505092915050565b61012181610198565b82525050565b600060208201905061013c6000830184610118565b92915050565b600061014d82610198565b915061015883610198565b9250827fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff0382111561018d5761018c6101a2565b5b828201905092915050565b6000819050919050565b7f4e487b7100000000000000000000000000000000000000000000000000000000600052601160045260246000fd5b600080fd5b6101df81610198565b81146101ea57600080fd5b5056fea2646970667358221220fc6b3426e915d626dbae314619eb8dcc6326beb3c5c36a82df92516e9b04943b64736f6c63430008070033";
 */
  /* 
  let transaction = {
    to: null,
    value: "0x0",
    gasLimit: "21000000",
    maxPriorityFeePerGas: ethers.utils.parseUnits("3", "gwei"),
    maxFeePerGas: ethers.utils.parseUnits("5", "gwei"),
    nonce: 17,
    type: 2,
    chainId: 5,
    data: fullDeployment,
  };

  let signed = await deployer.sendTransaction(transaction);
  console.log("signed", signed); */

  //return;
  const create = await fireblocksApiClient.createTransaction({
    operation: TransactionOperation.CONTRACT_CALL,
    assetId: "ETH_TEST3",
    source: {
      type: PeerType.VAULT_ACCOUNT,
      id: process.env.FIREBLOCKS_SOURCE_VAULT_ACCOUNT || "0",
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
      contractCallData: fullDeployment,
    },
  });

  const txData = await fireblocksApiClient.getTransactionById(create.id);
  console.log("txdata", txData);
  console.log("Transaction submitted with hash: ", txData.txHash);
  //console.log("create is ", create);

  console.log("Sending transaction for signing");

  //await processTransaction(bridge, tx);
})().catch((err) => {
  console.log("error", err);
  process.exit(1);
});
