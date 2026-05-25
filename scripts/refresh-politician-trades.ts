import { refreshPoliticianTrades } from "../src/lib/politician-trade-refresh";

const symbols = process.argv.slice(2).length ? process.argv.slice(2) : undefined;

refreshPoliticianTrades(symbols)
  .then((result) => {
    console.log(JSON.stringify(result, null, 2));
  })
  .catch((error) => {
    console.error("[politician-refresh] fatal error", error);
    process.exit(1);
  });
