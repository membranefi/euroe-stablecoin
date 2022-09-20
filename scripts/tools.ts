import hre, { ethers, network } from "hardhat";
import * as fs from "fs";
import { FireblocksSDK, PeerType, TransactionOperation } from "fireblocks-sdk";
import { TransactionResponse } from "@ethersproject/abstract-provider";

// Verify in scanner
export const verify = async (addr, constructorArguments: string[]) => {
  try {
    await hre.run("verify:verify", {
      address: addr,
      constructorArguments: constructorArguments,
    });
  } catch (ex: unknown) {
    if (String(ex).toLowerCase().indexOf("already verified") == -1) {
      // sometimes with lower case, sometimes upper
      // already verified probably because it has the same bytecode as some other contract
      throw ex;
    }
  }
};

// Deploy to FireBlocks. Returns the contract address
export const deploy = async (bytecode: string) => {
  const apiSecret = fs.readFileSync(
    process.env.GOERLI_FIREBLOCKS_API_SECRET_PATH,
    "utf8"
  );
  const fireblocksApiClient = new FireblocksSDK(
    apiSecret,
    process.env.GOERLI_FIREBLOCKS_API_KEY
  );

  const create = await fireblocksApiClient.createTransaction({
    operation: TransactionOperation.CONTRACT_CALL,
    assetId: "ETH_TEST3",
    source: {
      type: PeerType.VAULT_ACCOUNT,
      id: process.env.GOERLI_FIREBLOCKS_SOURCE_VAULT_ACCOUNT_INDEX,
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
    function wait(ms) {
      return new Promise((resolve) => {
        console.log(`waiting ${ms} ms for contract to be deployed...`);
        setTimeout(resolve, ms);
      });
    }

    let result = await fn();
    while (fnCondition(result)) {
      await wait(ms);
      result = await fn();
    }
    return result;
  }

  const checkContrAddress = async () => {
    if (!create || !create.id) {
      return "";
    }

    const txData = await fireblocksApiClient.getTransactionById(create.id);

    if (!txData.txHash) {
      return "";
    }

    interface TransactionResponseExtended {
      creates: string;
    }

    const tx = (await ethers.provider.getTransaction(
      txData.txHash
    )) as TransactionResponse & TransactionResponseExtended;
    return tx.creates;
  };

  const addr = await poll(checkContrAddress, (val) => !val, 5000);

  return addr;
};
