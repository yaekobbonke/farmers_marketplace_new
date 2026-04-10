import axios from "axios";
import * as cheerio from "cheerio";

export async function scrapeMarket(url: string, market: string, unit = "kg") {
  const { data } = await axios.get(url, { timeout: 15000 });
  const $ = cheerio.load(data);
  const prices: { product: string; price: number }[] = [];

  $(".price-row").each((_, el) => {
    const product = $(el).find(".product").text().trim();
    const rawPrice = $(el).find(".price").text().trim();
    const price = parseFloat(rawPrice.replace(/[^\d.]/g, "")) || 0;

    if (product && price > 0) prices.push({ product, price });
  });

  return prices;
}
