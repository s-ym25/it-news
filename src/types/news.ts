export interface NewsItem {
  id: string;
  title: string;
  url: string;
  source: string;
  category: string;
  summary: string;
  publishedAt: string;
  scrapedAt: string;
}

export interface DailyNews {
  date: string;
  items: NewsItem[];
  generatedAt: string;
}
