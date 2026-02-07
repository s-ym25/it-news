import Parser from "rss-parser";
import type { NewsItem } from "../src/types/news.js";

const parser = new Parser({
  headers: {
    "User-Agent": "IT-News-Aggregator/1.0",
  },
  timeout: 10000,
});

interface FeedSource {
  name: string;
  url: string;
  category: string;
}

const FEED_SOURCES: FeedSource[] = [
  {
    name: "Gigazine",
    url: "https://gigazine.net/news/rss_2.0/",
    category: "IT",
  },
  {
    name: "ITmedia NEWS",
    url: "https://rss.itmedia.co.jp/rss/2.0/news_bursts.xml",
    category: "IT",
  },
  {
    name: "Publickey",
    url: "https://www.publickey1.jp/atom.xml",
    category: "プログラミング",
  },
  {
    name: "GIZMODO Japan",
    url: "https://www.gizmodo.jp/index.xml",
    category: "ガジェット",
  },
  {
    name: "Zenn",
    url: "https://zenn.dev/feed",
    category: "プログラミング",
  },
  {
    name: "はてなブックマーク テクノロジー",
    url: "https://b.hatena.ne.jp/hotentry/it.rss",
    category: "IT",
  },
];

function generateId(source: string, title: string): string {
  const str = `${source}-${title}`;
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0;
  }
  return Math.abs(hash).toString(36);
}

async function fetchFeed(source: FeedSource): Promise<NewsItem[]> {
  try {
    const feed = await parser.parseURL(source.url);
    const now = new Date();
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    return (feed.items || [])
      .filter((item) => {
        const pubDate = item.pubDate ? new Date(item.pubDate) : now;
        return pubDate >= oneDayAgo;
      })
      .slice(0, 10)
      .map((item) => ({
        id: generateId(source.name, item.title || ""),
        title: item.title || "No title",
        url: item.link || "",
        source: source.name,
        category: source.category,
        summary: "",
        publishedAt: item.pubDate || now.toISOString(),
        scrapedAt: now.toISOString(),
      }));
  } catch (error) {
    console.error(`Failed to fetch ${source.name}:`, error);
    return [];
  }
}

export async function scrapeAll(): Promise<NewsItem[]> {
  console.log("Fetching RSS feeds...");

  const results = await Promise.allSettled(
    FEED_SOURCES.map((source) => fetchFeed(source))
  );

  const allItems: NewsItem[] = [];
  for (const result of results) {
    if (result.status === "fulfilled") {
      allItems.push(...result.value);
    }
  }

  allItems.sort(
    (a, b) =>
      new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
  );

  console.log(`Fetched ${allItems.length} articles from ${FEED_SOURCES.length} sources`);
  return allItems;
}
