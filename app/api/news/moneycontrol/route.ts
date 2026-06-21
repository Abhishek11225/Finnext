import { load } from "cheerio";
import { NextResponse } from "next/server";

const MONEYCONTROL_STOCKS_URL =
  "https://www.moneycontrol.com/news/business/stocks/";
const CACHE_SECONDS = 60 * 60;
const MAX_ARTICLES = 15;

export const runtime = "nodejs";

interface MoneycontrolArticle {
  title: string;
  description: string;
  url: string;
  imageUrl?: string;
  publishedAt?: string;
}

function cleanText(value: string) {
  return value.replace(/\s+/g, " ").trim();
}

function toAbsoluteMoneycontrolUrl(value?: string) {
  if (!value) return undefined;

  try {
    const url = new URL(value, MONEYCONTROL_STOCKS_URL);
    if (
      url.hostname !== "moneycontrol.com" &&
      !url.hostname.endsWith(".moneycontrol.com")
    ) {
      return undefined;
    }

    return url.toString();
  } catch {
    return undefined;
  }
}

function parseArticles(html: string): MoneycontrolArticle[] {
  const $ = load(html);
  const articles: MoneycontrolArticle[] = [];
  const seenUrls = new Set<string>();

  const selectors = [
    "#cagetory li > a[href]",
    "#category li > a[href]",
    ".news_list li > a[href]",
    "main article a[href]:has(h2)",
    "a[href*='/news/']:has(h2)",
  ];

  $(selectors.join(", ")).each((_, element) => {
    if (articles.length >= MAX_ARTICLES) return false;

    const anchor = $(element);
    const title = cleanText(
      anchor.find("h2").first().text() || anchor.attr("title") || "",
    );
    const url = toAbsoluteMoneycontrolUrl(anchor.attr("href"));

    if (!url || seenUrls.has(url) || title.length < 20) return;

    const container = anchor.closest("li, article");
    const description = cleanText(container.find("p").first().text());
    const image = container.find("img").first();
    const imageUrl = toAbsoluteMoneycontrolUrl(
      image.attr("data-src") ||
        image.attr("data-original") ||
        image.attr("src"),
    );
    const publishedAt = cleanText(
      container
        .find(
          "time, [class*='date'], [class*='time'], [class*='ago'], [class*='timestamp']",
        )
        .first()
        .text(),
    );

    seenUrls.add(url);
    articles.push({
      title,
      description,
      url,
      imageUrl,
      publishedAt: publishedAt || undefined,
    });
  });

  return articles;
}

export async function GET() {
  try {
    const response = await fetch(MONEYCONTROL_STOCKS_URL, {
      headers: {
        Accept: "text/html,application/xhtml+xml",
        "Accept-Language": "en-IN,en;q=0.9",
        Referer: "https://www.google.com/",
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 " +
          "(KHTML, like Gecko) Chrome/137.0.0.0 Safari/537.36",
      },
      next: { revalidate: CACHE_SECONDS },
    });

    if (!response.ok) {
      throw new Error(`Moneycontrol responded with ${response.status}`);
    }

    const articles = parseArticles(await response.text());

    if (articles.length === 0) {
      throw new Error("No stock articles were found on the Moneycontrol page");
    }

    return NextResponse.json(
      {
        source: "Moneycontrol",
        sourceUrl: MONEYCONTROL_STOCKS_URL,
        fetchedAt: new Date().toISOString(),
        articles,
      },
      {
        headers: {
          "Cache-Control": `public, s-maxage=${CACHE_SECONDS}, stale-while-revalidate=86400`,
        },
      },
    );
  } catch (error) {
    console.error("Moneycontrol news fetch failed:", error);

    return NextResponse.json(
      {
        error: "Moneycontrol news is temporarily unavailable.",
        sourceUrl: MONEYCONTROL_STOCKS_URL,
      },
      { status: 502 },
    );
  }
}
