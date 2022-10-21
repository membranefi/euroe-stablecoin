import { FireblocksSDK, PeerType, TransactionOperation } from "fireblocks-sdk";
import * as fs from "fs";

(async function () {
  const apiSecret = fs.readFileSync(
    process.env.GOERLI_FIREBLOCKS_API_SECRET_PATH_MINTER,
    "utf8"
  );
  const fireblocksApiClient = new FireblocksSDK(
    apiSecret,
    process.env.GOERLI_FIREBLOCKS_API_KEY_MINTER
  );

  const txData = await fireblocksApiClient.getTransactionById(
    "6f562702-be0d-490a-b7bd-dcae1e489c5b"
  );
  console.log("txdata", txData);
})().catch((err) => {
  console.log("error", err);
  process.exit(1);
});
