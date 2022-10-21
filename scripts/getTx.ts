import { FireblocksSDK, PeerType, TransactionOperation } from "fireblocks-sdk";
import * as fs from "fs";

(async function () {
  const apiSecret = fs.readFileSync(
    process.env.GOERLI_FIREBLOCKS_API_SECRET_PATH_PROXYOWNER,
    "utf8"
  );
  const fireblocksApiClient = new FireblocksSDK(
    apiSecret,
    process.env.GOERLI_FIREBLOCKS_API_KEY_PROXYOWNER
  );

  const txData = await fireblocksApiClient.getTransactionById(
    "3077426a-7c43-4c86-a2e8-6ff5e45a8aac"
  );
  console.log("txdata", txData);
})().catch((err) => {
  console.log("error", err);
  process.exit(1);
});
