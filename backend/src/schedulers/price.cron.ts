import cron from "node-cron";
import { priceQueue } from "../jobs/price.queue";

/**
 * Scheduled job to scrape market prices every 6 hours.
 * Wrapped in a try-catch to prevent unhandled promise rejections
 * from crashing the production server on Render.
 */
cron.schedule("0 */6 * * *", async () => {
  console.log("--- Starting Scheduled Scraper Job ---");

  try {
    // Attempt to add the job to the Bull/BullMQ queue
    await priceQueue.add("scrape-addis", {
      url: "https://example-ethiopia-market.com", // Placeholder URL
      market: "Addis Ababa",
    });

    console.log("✅ Success: Scraping job queued for Addis Ababa");
  } catch (error: any) {
    // This block catches network errors, DNS failures (ENOTFOUND), 
    // or issues connecting to your Redis/Queue provider.
    console.error("❌ SCRAPER CRON ERROR: Failed to queue job.");
    console.error(`Reason: ${error.message}`);
    
    // The error is handled, so the server remains LIVE.
  }
});
