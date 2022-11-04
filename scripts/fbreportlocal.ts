import { ethers, waffle } from "hardhat";
import {
  createTypedERC2612Data,
  Domain,
  EIP712Domain,
  ERC2612PermitMessage,
  getDomain,
  MAX_INT,
  signERC2612Permit,
} from "./eth-permit/eth-permit";
import { splitSignatureToRSV } from "./eth-permit/rpc";

const PROXY_ADDRESS = "0x8f21060D05DF9BcA475Ba23eA26AcCCab9944a2e"; // Address of the token contract (proxy)
const spenderAddress = "0x7e3F7C5cBe4F7B1f863b2251Cb801b4dEE902a0f"; // proxyowner
const deadline = 1967397081;

async function main() {
  const pk =
    "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80"; // hardhat's first wallet
  const nonce = 0;
  const wallet = new ethers.Wallet(pk);

  const domain: Domain = {
    name: "EURO Stablecoin",
    version: "1",
    chainId: 5,
    verifyingContract: PROXY_ADDRESS,
  };

  const message: ERC2612PermitMessage = {
    owner: wallet.address,
    spender: spenderAddress,
    value: 2,
    nonce: 0,
    deadline: deadline,
  };

  const typedData = createTypedERC2612Data(message, domain);

  const { EIP712Domain: _unused, ...types2 } = typedData.types;
  const types: any = types2;

  const sig2 = await wallet._signTypedData(
    typedData.domain,
    types,
    typedData.message
  );

  const sig = splitSignatureToRSV(sig2);

  const ethSign = await signERC2612Permit(
    wallet,
    PROXY_ADDRESS,
    wallet.address,
    spenderAddress,
    2,
    deadline,
    nonce
  );

  console.log("way1", sig.v, sig.r, sig.s);
  console.log("way2", ethSign.v, ethSign.r, ethSign.s);
  return;
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
function zeros(arg0: number) {
  throw new Error("Function not implemented.");
}
