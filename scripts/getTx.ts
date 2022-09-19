import { FireblocksSDK, PeerType, TransactionOperation } from "fireblocks-sdk";
import * as fs from "fs";

(async function () {
  const apiSecret = fs.readFileSync(
    process.env.FIREBLOCKS_API_SECRET_PATH,
    "utf8"
  );
  const fireblocksApiClient = new FireblocksSDK(
    apiSecret,
    process.env.FIREBLOCKS_API_KEY,
    process.env.FIREBLOCKS_API_BASE_URL
  );

  const txData = await fireblocksApiClient.getTransactionById(
    "474513f6-f9b3-48e1-9bc4-5145ac9abf63"
  );
  console.log("txdata", txData);
})().catch((err) => {
  console.log("error", err);
  process.exit(1);
});
