import cron from "node-cron";
import { priceQueue } from "../jobs/price.queue";

cron.schedule("0 */6 * * *", async () => {
  await priceQueue.add("scrape-addis", {
    url: "https://example-ethiopia-market.com",
    market: "Addis Ababa",
  });
  console.log("Scraping job queued for Addis Ababa");
});
