import hre, { ethers, network } from "hardhat";
import * as fs from "fs";
import { FireblocksSDK, PeerType, TransactionOperation } from "fireblocks-sdk";
import { TransactionResponse } from "@ethersproject/abstract-provider";
import { MockToken } from "../typechain/euro";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { signERC2612Permit } from "eth-permit";

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
export const deploy = async (
  api_secret_path: string,
  api_key: string,
  vault_account_id: string,
  bytecode: string
) => {
  const apiSecret = fs.readFileSync(api_secret_path, "utf8");
  const fireblocksApiClient = new FireblocksSDK(apiSecret, api_key);

  const create = await fireblocksApiClient.createTransaction({
    operation: TransactionOperation.CONTRACT_CALL,
    assetId: "ETH_TEST3",
    source: {
      type: PeerType.VAULT_ACCOUNT,
      id: vault_account_id,
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

export const getRoleBytes = (role: string) => {
  if (role == "DEFAULT_ADMIN_ROLE") {
    return ethers.constants.HashZero;
  }
  const res = ethers.utils.keccak256(ethers.utils.toUtf8Bytes(role));
  return res;
};

export const getRoleError = (address: string, role: string) => {
  const error =
    "AccessControl: account " +
    address.toLowerCase() +
    " is missing role " +
    getRoleBytes(role);
  return error;
};

// Mint to a single address
export const singleMint = (
  erc20: MockToken,
  signer: SignerWithAddress,
  target: string,
  amount: number
) => {
  // Use a dummy id
  const id = 1;
  const hash = getMintChecksum([target], [amount], id);
  return erc20.connect(signer).mintSet([target], [amount], id, hash);
};

// Gets the minting checksum for given parameters
export const getMintChecksum = (
  targets: string[],
  amounts: number[],
  id: number
) => {
  const encoded = ethers.utils.defaultAbiCoder.encode(
    ["address[]", "uint256[]", "uint256"],
    [targets, amounts, id]
  );
  const hash = ethers.utils.keccak256(encoded);
  return hash;
};

// Adds a permit with the given parameters
export const addPermit = async (
  erc20: MockToken,
  owner: SignerWithAddress,
  spender: SignerWithAddress,
  amount: number,
  deadline: number
) => {
  const result = await signERC2612Permit(
    owner,
    erc20.address,
    owner.address,
    spender.address,
    amount,
    deadline
  );

  await erc20
    .connect(owner)
    .permit(
      owner.address,
      spender.address,
      amount,
      deadline,
      result.v,
      result.r,
      result.s
    );
};

// Issues a permit and burns using the permit
export const burnWithPermit = async (
  erc20: MockToken,
  owner: SignerWithAddress,
  spender: SignerWithAddress,
  amount: number,
  deadline: number
) => {
  const result = await signERC2612Permit(
    owner,
    erc20.address,
    owner.address,
    spender.address,
    amount,
    deadline
  );

  await erc20
    .connect(spender)
    .burnFromWithPermit(
      owner.address,
      spender.address,
      amount,
      deadline,
      result.v,
      result.r,
      result.s
    );
};
