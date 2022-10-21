import hre, { ethers, network } from "hardhat";
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
