"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Clock3,
  ExternalLink,
  Loader2,
  Newspaper,
  RefreshCw,
} from "lucide-react";

interface MoneycontrolArticle {
  title: string;
  description: string;
  url: string;
  publishedAt?: string;
}

interface MoneycontrolResponse {
  source: string;
  sourceUrl: string;
  fetchedAt: string;
  articles: MoneycontrolArticle[];
}

const REFRESH_INTERVAL = 30 * 60 * 1000;

function formatFetchTime(value?: string) {
  if (!value) return "";

  return new Intl.DateTimeFormat("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

const NewsWidget = () => {
  const [data, setData] = useState<MoneycontrolResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const loadNews = useCallback(async (manual = false) => {
    if (manual) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    setError("");

    try {
      const response = await fetch("/api/news/moneycontrol", {
        cache: "no-store",
      });
      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.error || "Could not load market news");
      }

      setData(payload);
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : "Could not load market news",
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadNews();
    const interval = window.setInterval(() => loadNews(true), REFRESH_INTERVAL);

    return () => window.clearInterval(interval);
  }, [loadNews]);

  return (
    <section className="flex h-full min-h-0 flex-col p-5">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <Newspaper className="size-5 text-teal-400" aria-hidden="true" />
            <h3 className="text-xl font-bold text-gray-100">Top Stories</h3>
          </div>
          <p className="mt-1 text-xs text-gray-500">
            Moneycontrol Stocks
            {data?.fetchedAt
              ? ` · Updated ${formatFetchTime(data.fetchedAt)}`
              : ""}
          </p>
        </div>

        <button
          type="button"
          onClick={() => loadNews(true)}
          disabled={refreshing}
          title="Refresh news"
          aria-label="Refresh Moneycontrol news"
          className="flex size-9 shrink-0 items-center justify-center rounded-md border border-gray-700 text-gray-400 transition-colors hover:border-gray-600 hover:text-gray-100 disabled:cursor-wait disabled:opacity-60"
        >
          <RefreshCw
            className={`size-4 ${refreshing ? "animate-spin" : ""}`}
            aria-hidden="true"
          />
        </button>
      </div>

      {loading ? (
        <div className="flex flex-1 items-center justify-center">
          <Loader2 className="size-7 animate-spin text-teal-400" />
        </div>
      ) : error && !data ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-3 text-center">
          <Newspaper className="size-8 text-gray-600" aria-hidden="true" />
          <p className="max-w-xs text-sm text-gray-400">{error}</p>
          <button
            type="button"
            onClick={() => loadNews()}
            className="rounded-md bg-yellow-400 px-3 py-2 text-sm font-semibold text-gray-900"
          >
            Try again
          </button>
        </div>
      ) : (
        <div className="min-h-0 flex-1 overflow-y-auto pr-2">
          <div className="divide-y divide-gray-700">
            {data?.articles.map((article) => (
              <article key={article.url} className="py-4 first:pt-0">
                <a
                  href={article.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group block"
                >
                  <div className="flex items-start gap-2">
                    <h4 className="flex-1 text-sm font-semibold leading-5 text-gray-100 transition-colors group-hover:text-yellow-400">
                      {article.title}
                    </h4>
                    <ExternalLink
                      className="mt-0.5 size-3.5 shrink-0 text-gray-600 transition-colors group-hover:text-yellow-400"
                      aria-hidden="true"
                    />
                  </div>

                  {article.description && (
                    <p className="mt-1.5 line-clamp-2 text-xs leading-5 text-gray-500">
                      {article.description}
                    </p>
                  )}

                  {article.publishedAt && (
                    <span className="mt-2 flex items-center gap-1 text-[11px] text-gray-600">
                      <Clock3 className="size-3" aria-hidden="true" />
                      {article.publishedAt}
                    </span>
                  )}
                </a>
              </article>
            ))}
          </div>
        </div>
      )}

      {error && data && (
        <p className="mt-2 text-xs text-red-500">
          Refresh failed. Showing the last loaded stories.
        </p>
      )}
    </section>
  );
};

export default NewsWidget;
