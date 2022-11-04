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
    "8e59eada-2481-4669-90a9-11067dda7401"
  );
  console.log("txdata", txData);

  if (txData?.extraParameters?.rawMessageData?.messages) {
    for (
      let i = 0;
      i < txData?.extraParameters?.rawMessageData?.messages.length;
      i++
    ) {
      console.log(
        "message " + i,
        txData?.extraParameters?.rawMessageData?.messages[i].content
      );
    }
  }
})().catch((err) => {
  console.log("error", err);
  process.exit(1);
});
