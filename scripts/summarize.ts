import Anthropic from "@anthropic-ai/sdk";
import type { NewsItem } from "../src/types/news.js";

const BATCH_SIZE = 10;

export async function summarizeNews(items: NewsItem[]): Promise<NewsItem[]> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    console.warn("ANTHROPIC_API_KEY not set. Skipping summarization.");
    return items;
  }

  const client = new Anthropic({ apiKey });
  const summarized: NewsItem[] = [];

  for (let i = 0; i < items.length; i += BATCH_SIZE) {
    const batch = items.slice(i, i + BATCH_SIZE);
    console.log(
      `Summarizing batch ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(items.length / BATCH_SIZE)}...`
    );

    const articleList = batch
      .map(
        (item, idx) =>
          `[${idx + 1}] タイトル: ${item.title}\nソース: ${item.source}\nURL: ${item.url}`
      )
      .join("\n\n");

    try {
      const response = await client.messages.create({
        model: "claude-sonnet-4-5-20250929",
        max_tokens: 2048,
        messages: [
          {
            role: "user",
            content: `以下のニュース記事について、それぞれ1〜2文の日本語要約を生成してください。
タイトルから内容を推測して要約してください。

フォーマット:
[番号] 要約文

${articleList}`,
          },
        ],
      });

      const text =
        response.content[0].type === "text" ? response.content[0].text : "";

      const summaries = parseSummaries(text, batch.length);

      for (let j = 0; j < batch.length; j++) {
        summarized.push({
          ...batch[j],
          summary: summaries[j] || batch[j].title,
        });
      }
    } catch (error) {
      console.error("Summarization failed for batch:", error);
      summarized.push(...batch);
    }

    if (i + BATCH_SIZE < items.length) {
      await sleep(1000);
    }
  }

  return summarized;
}

function parseSummaries(text: string, expectedCount: number): string[] {
  const summaries: string[] = [];
  const lines = text.split("\n");

  for (const line of lines) {
    const match = line.match(/^\[(\d+)\]\s*(.+)/);
    if (match) {
      summaries.push(match[2].trim());
    }
  }

  while (summaries.length < expectedCount) {
    summaries.push("");
  }

  return summaries;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
