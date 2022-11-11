import * as fs from "fs";
import { FireblocksSDK } from "fireblocks-sdk";

(async function () {
  const apiSecret = fs.readFileSync(
    process.env.GOERLI_FIREBLOCKS_API_SECRET_PATH_PROXYOWNER,
    "utf8"
  );
  const fireblocksApiClient = new FireblocksSDK(
    apiSecret,
    process.env.GOERLI_FIREBLOCKS_API_KEY_PROXYOWNER
  );

  const filt: PagedVaultAccountsRequestFilters = {
    assetId: fbAssetName,
    nameSuffix: input.internalId,
  };

  const vaults = await fireblocksApiClient.getVaultAccountsWithPageInfo(filt);

  console.log("txdata", txData);
})().catch((err) => {
  console.log("error", err);
  process.exit(1);
});
