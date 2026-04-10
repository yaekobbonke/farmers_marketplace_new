import cron from "node-cron";
import prisma from "../../config/prisma";
import { scrapeMarket } from "../../scrapers/market.scraper"; 

export const startPriceJobs = () => {
  cron.schedule("0 */6 * * *", async () => {
    console.log("🚀 Starting price intelligence update...");
    
    try {
      // 1. Get the raw data from your scraper
      const prices = await scrapeMarket("http://example-market.com", "Central Market");

      if (!prices || !prices.length) {
        console.log("⚠️ No new prices found.");
        return;
      }

      // 2. Process each scraped item individually
      for (const p of prices) {
        // Find the product ID using the name from the scraper
        const product = await prisma.product.findFirst({ 
          where: { name: p.product } 
        });

        if (!product) {
          console.warn(`Skipping: "${p.product}" doesn't exist in our Product table.`);
          continue;
        }

        // 3. Save the price linked to the correct productId
        await prisma.marketPrice.create({
          data: {
            productId: product.id, // Linking to the UUID/ID
            price: p.price,
            unit: "kg",
            market: "Central Market",
            source: "scraper",
          },
        });
      }

      console.log("✅ Price intelligence updated successfully");
    } catch (error) {
      console.error("❌ Failed to update price intelligence:", error);
    }
  });
};