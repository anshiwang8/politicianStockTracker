import { refreshPoliticianTrades } from "../src/lib/politician-trade-refresh";

refreshPoliticianTrades()
  .then((result) => {
    console.log(JSON.stringify(result, null, 2));
  })
  .catch((error) => {
    console.error("[politician-refresh] fatal error", error);
    process.exit(1);
  });
