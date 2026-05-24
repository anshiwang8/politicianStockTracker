import cron from "node-cron";
import { refreshDisclosuresAndScores } from "../src/lib/refresh";

const cadence = process.env.DISCLOSURE_REFRESH_CRON ?? "*/15 * * * *";

async function runOnce() {
  const result = await refreshDisclosuresAndScores();
  console.log(`Refreshed ${result.disclosureCount} disclosures at ${result.refreshedAt.toISOString()}`);
}

runOnce().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

cron.schedule(cadence, () => {
  runOnce().catch((error) => console.error("Scheduled refresh failed", error));
});
