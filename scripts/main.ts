import { writeFileSync, mkdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { scrapeAll } from "./scrape.js";
import { summarizeNews } from "./summarize.js";
import { notifyLine } from "./notify.js";
import type { DailyNews } from "../src/types/news.js";

const __dirname = dirname(fileURLToPath(import.meta.url));

async function main() {
  const startTime = Date.now();
  console.log("=== IT News Daily Scraper ===");
  console.log(`Start: ${new Date().toISOString()}`);

  // 1. Scrape RSS feeds
  const items = await scrapeAll();

  if (items.length === 0) {
    console.log("No articles found. Exiting.");
    return;
  }

  // 2. Summarize with AI
  const summarized = await summarizeNews(items);

  // 3. Generate JSON
  const today = new Date().toISOString().split("T")[0];
  const dailyNews: DailyNews = {
    date: today,
    items: summarized,
    generatedAt: new Date().toISOString(),
  };

  const outputDir = join(__dirname, "..", "public", "data");
  mkdirSync(outputDir, { recursive: true });

  const outputPath = join(outputDir, "news.json");
  writeFileSync(outputPath, JSON.stringify(dailyNews, null, 2), "utf-8");
  console.log(`Written ${summarized.length} articles to ${outputPath}`);

  // Also write to archive
  const archivePath = join(outputDir, `news-${today}.json`);
  writeFileSync(archivePath, JSON.stringify(dailyNews, null, 2), "utf-8");

  // 4. Send LINE notification
  const siteUrl = process.env.SITE_URL || "https://your-site.vercel.app";
  await notifyLine(summarized.length, siteUrl);

  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
  console.log(`\nDone in ${elapsed}s`);
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
