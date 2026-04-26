'use client'

import { useEffect, useMemo, useRef, useState } from "react";
import {
  CandlestickSeries,
  ColorType,
  CrosshairMode,
  createChart,
  type CandlestickData,
  type IChartApi,
  type ISeriesApi,
  type Time,
  type UTCTimestamp,
} from "lightweight-charts";
import { useQuery } from "@tanstack/react-query";
import { CandleResponseRow, candlesService } from "../hooks/useCandle";

type ChartProps = {
  interval: string;
  visibleCount: number;
  onLatestPriceChange?: (price: number | null) => void;
}

type MarketTick = {
  price: number;
  quantity: number;
  timestamp: number;
}

type CandlePoint = CandlestickData<Time> & {
  volume?: number;
}

const intervalSeconds: Record<string, number> = {
  "1m": 60,
  "5m": 5 * 60,
  "30m": 30 * 60,
  "1h": 60 * 60,
  "6h": 6 * 60 * 60,
  "1d": 24 * 60 * 60,
  "3d": 3 * 24 * 60 * 60,
};

const priceFormatter = new Intl.NumberFormat("en-US", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const compactPriceFormatter = new Intl.NumberFormat("en-US", {
  maximumFractionDigits: 2,
});

const toSeconds = (value: string | number | undefined) => {
  if (!value) return Math.floor(Date.now() / 1000);
  const numeric = Number(value);

  if (Number.isFinite(numeric)) {
    if (numeric > 100000000000000) return Math.floor(numeric / 1000000);
    return numeric > 1000000000000 ? Math.floor(numeric / 1000) : Math.floor(numeric);
  }

  return Math.floor(new Date(value).getTime() / 1000);
};

const formatTime = (time: Time | undefined) => {
  if (!time) return "--";
  if (typeof time === "number") {
    return new Date(time * 1000).toLocaleString();
  }
  if (typeof time === "string") {
    return new Date(time).toLocaleString();
  }
  return `${time.year}-${String(time.month).padStart(2, "0")}-${String(time.day).padStart(2, "0")}`;
};

const readNumber = (...values: unknown[]) => {
  for (const value of values) {
    const numeric = Number(value);
    if (Number.isFinite(numeric) && numeric > 0) return numeric;
  }

  return undefined;
};

const extractMarketTick = (message: unknown): MarketTick | null => {
  if (!message || typeof message !== "object") return null;

  const root = message as Record<string, unknown>;
  const data =
    root.data && typeof root.data === "object"
      ? (root.data as Record<string, unknown>)
      : root;
  const stream = typeof root.stream === "string" ? root.stream : "";

  if (stream && !stream.includes("trade") && !stream.includes("bookTicker")) return null;

  const directPrice = readNumber(
    data.price,
    data.p,
    data.P,
    data.lastPrice,
    data.ap,
    data.bp,
  );
  const ask = readNumber(data.ask, data.a);
  const bid = readNumber(data.bid, data.b);
  const price = directPrice ?? (ask && bid ? (ask + bid) / 2 : ask ?? bid);
  const quantity = readNumber(data.quantity, data.qty, data.q, data.size, data.v) ?? 0;
  const timestamp =
    readNumber(data.timestamp, data.time, data.T, data.E, data.t, root.timestamp) ??
    Math.floor(Date.now() / 1000);

  if (!price) return null;

  return {
    price,
    quantity,
    timestamp:
      timestamp > 100000000000000
        ? Math.floor(timestamp / 1000000)
        : timestamp > 1000000000000
          ? Math.floor(timestamp / 1000)
          : Math.floor(timestamp),
  };
};

const normalizeCandles = (rows: CandleResponseRow[]) => {
  const byTime = new Map<number, CandlePoint>();

  for (const row of rows) {
    const open = Number(row.open);
    const high = Number(row.high);
    const low = Number(row.low);
    const close = Number(row.close);
    const time = toSeconds(row.bucket ?? row.time);

    if (![open, high, low, close].every(Number.isFinite)) continue;

    byTime.set(time, {
      time: time as UTCTimestamp,
      open,
      high,
      low,
      close,
      volume: Number(row.volume ?? 0),
    });
  }

  return Array.from(byTime.entries())
    .sort(([left], [right]) => left - right)
    .map(([, candle]) => candle);
};

export default function Chart({
  interval,
  visibleCount,
  onLatestPriceChange,
}: ChartProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const candleSeriesRef = useRef<ISeriesApi<"Candlestick"> | null>(null);
  const [chartData, setChartData] = useState<CandlePoint[]>([]);
  const [selected, setSelected] = useState<CandlePoint | null>(null);
  const [isWsConnected, setIsWsConnected] = useState(false);
  const [lastLiveAt, setLastLiveAt] = useState<number | null>(null);
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const { data, isLoading, isError, refetch, isFetching } = useQuery({
    queryKey: ["marketplace-candles", "BTCUSDC", interval],
    queryFn: () => {
      const now = Math.floor(Date.now() / 1000);
      return candlesService.getCandles(interval, now - 30 * 24 * 60 * 60, now, "BTCUSDC");
    },
  });

  const fetchedCandles = useMemo(
    () => normalizeCandles((data ?? []) as CandleResponseRow[]).slice(-180),
    [data],
  );

  useEffect(() => {
    if (!containerRef.current) return;

    const container = containerRef.current;
    const chart = createChart(container, {
      width: container.clientWidth,
      height: container.clientHeight,
      autoSize: true,
      layout: {
        background: { type: ColorType.Solid, color: "transparent" },
        textColor: "#a79f91",
        fontFamily: "Cascadia Mono, Courier New, monospace",
        attributionLogo: true,
      },
      grid: {
        vertLines: { color: "rgba(255,247,230,0.06)" },
        horzLines: { color: "rgba(255,247,230,0.08)" },
      },
      crosshair: {
        mode: CrosshairMode.Normal,
        vertLine: { color: "rgba(255,247,230,0.24)" },
        horzLine: { color: "rgba(255,247,230,0.24)" },
      },
      rightPriceScale: {
        borderColor: "rgba(255,247,230,0.14)",
        scaleMargins: {
          top: 0.12,
          bottom: 0.16,
        },
      },
      timeScale: {
        borderColor: "rgba(255,247,230,0.14)",
        timeVisible: true,
        secondsVisible: false,
        rightOffset: 8,
        barSpacing: 8,
      },
      handleScroll: true,
      handleScale: true,
    });

    const candleSeries = chart.addSeries(CandlestickSeries, {
      upColor: "#c6ff3d",
      downColor: "#ff5d73",
      borderUpColor: "#c6ff3d",
      borderDownColor: "#ff5d73",
      wickUpColor: "#c6ff3d",
      wickDownColor: "#ff5d73",
      priceLineColor: "#ff9f1c",
      priceLineWidth: 2,
      priceFormat: {
        type: "price",
        precision: 2,
        minMove: 0.01,
      },
    });

    chart.subscribeCrosshairMove((param) => {
      const point = param.seriesData.get(candleSeries) as CandlePoint | undefined;
      setSelected(point ?? null);
    });

    chartRef.current = chart;
    candleSeriesRef.current = candleSeries;

    return () => {
      chart.remove();
      chartRef.current = null;
      candleSeriesRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (!fetchedCandles.length) {
      setChartData([]);
      setSelected(null);
      onLatestPriceChange?.(null);
      return;
    }

    setChartData(fetchedCandles);
    setSelected(fetchedCandles.at(-1) ?? null);
    candleSeriesRef.current?.setData(fetchedCandles);
    onLatestPriceChange?.(fetchedCandles.at(-1)?.close ?? null);
  }, [fetchedCandles, onLatestPriceChange]);

  useEffect(() => {
    if (!chartData.length || !chartRef.current) return;

    const lastIndex = chartData.length - 1;
    chartRef.current.timeScale().setVisibleLogicalRange({
      from: Math.max(0, chartData.length - visibleCount),
      to: lastIndex + 8,
    });
  }, [chartData.length, visibleCount]);

  useEffect(() => {
    let ws: WebSocket | null = null;
    let shouldReconnect = true;

    const connect = () => {
      ws = new WebSocket("wss://ws.backpack.exchange/");

      ws.onopen = () => {
        setIsWsConnected(true);
        ws?.send(
          JSON.stringify({
            method: "SUBSCRIBE",
            params: ["bookTicker.BTC_USDC"],
            id: 1,
          }),
        );
      };

      ws.onmessage = (event) => {
        try {
          const parsed = JSON.parse(event.data as string);
          const tick = extractMarketTick(parsed);
          if (!tick) return;

          const bucketSize = intervalSeconds[interval] ?? 60 * 60;
          const bucket = Math.floor(tick.timestamp / bucketSize) * bucketSize;

          setLastLiveAt(Date.now());
          setChartData((current) => {
            const next = [...current];
            const last = next.at(-1);
            const lastTime = last ? toSeconds(last.time as number) : 0;
            const lastBucket = Math.floor(lastTime / bucketSize) * bucketSize;

            if (!last || bucket > lastBucket) {
              const candle: CandlePoint = {
                time: bucket as UTCTimestamp,
                open: tick.price,
                high: tick.price,
                low: tick.price,
                close: tick.price,
                volume: tick.quantity,
              };
              next.push(candle);
              candleSeriesRef.current?.update(candle);
              setSelected(candle);
              onLatestPriceChange?.(candle.close);

              return next.slice(-180);
            }

            if (bucket === lastBucket) {
              const candle: CandlePoint = {
                ...last,
                high: Math.max(last.high, tick.price),
                low: Math.min(last.low, tick.price),
                close: tick.price,
                volume: Number(last.volume ?? 0) + tick.quantity,
              };
              next[next.length - 1] = candle;
              candleSeriesRef.current?.update(candle);
              setSelected(candle);
              onLatestPriceChange?.(candle.close);
            }

            return next;
          });
        } catch {
          // Ignore non-market exchange messages.
        }
      };

      ws.onclose = () => {
        setIsWsConnected(false);
        if (shouldReconnect) {
          reconnectTimerRef.current = setTimeout(connect, 2500);
        }
      };

      ws.onerror = () => {
        setIsWsConnected(false);
        ws?.close();
      };
    };

    connect();

    return () => {
      shouldReconnect = false;
      if (reconnectTimerRef.current) {
        clearTimeout(reconnectTimerRef.current);
      }
      ws?.close();
    };
  }, [interval, onLatestPriceChange]);

  const latest = chartData.at(-1) ?? null;
  const first = chartData[0] ?? null;
  const active = selected ?? latest;
  const change = latest && first ? latest.close - first.open : 0;
  const changePercent = latest && first ? (change / first.open) * 100 : 0;
  const isPositive = change >= 0;

  return (
    <section className="flex min-h-[calc(100vh-11rem)] flex-col overflow-hidden rounded-lg border border-white/15 bg-black/20 shadow-inner lg:min-h-[31rem]">
      <div className="flex flex-col gap-2 border-b border-white/10 px-3 py-2 sm:flex-row sm:items-center sm:justify-between sm:px-4 sm:py-3">
        <div>
          <p className="micro-label">BTC_USDC chart</p>
          <div className="mt-2 flex flex-wrap items-end gap-x-4 gap-y-1">
            <p className="mono-face text-xl font-black text-white sm:text-2xl">
              {latest ? `$${compactPriceFormatter.format(latest.close)}` : "--"}
            </p>
            <p className={`mono-face text-sm font-bold ${isPositive ? "text-[var(--lime)]" : "text-[var(--loss)]"}`}>
              {latest ? `${isPositive ? "+" : ""}${changePercent.toFixed(2)}%` : "--"}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 sm:gap-3 sm:justify-end">
          <button
            type="button"
            onClick={() => void refetch()}
            className="secondary-action h-9 px-3 text-xs font-bold transition hover:border-white/25"
          >
            {isFetching ? "Refreshing" : "Refresh"}
          </button>
          <div className="text-left sm:text-right">
            <p className={`mono-face text-xs font-bold ${isWsConnected ? "text-[var(--lime)]" : "text-[var(--loss)]"}`}>
              {isWsConnected ? "LIVE" : "OFFLINE"}
            </p>
            <p className="mt-1 text-xs text-stone-500">
              {lastLiveAt ? new Date(lastLiveAt).toLocaleTimeString() : "waiting for tick"}
            </p>
          </div>
        </div>
      </div>

      <div className="relative min-h-[20rem] flex-1 p-2 sm:min-h-[22rem] sm:p-3">
        <div
          ref={containerRef}
          className={`h-full min-h-[20rem] w-full transition-opacity sm:min-h-[22rem] ${
            isLoading || isError ? "opacity-20" : "opacity-100"
          }`}
        />

        {isLoading ? (
          <div className="absolute inset-3 grid place-items-center text-sm text-stone-400">
            Loading BTC candles...
          </div>
        ) : isError ? (
          <div className="absolute inset-3 grid place-items-center text-sm text-[var(--loss)]">
            Could not load candles.
          </div>
        ) : !chartData.length ? (
          <div className="absolute inset-3 grid place-items-center text-sm text-stone-400">
            No candles returned.
          </div>
        ) : null}
      </div>

      <div className="hidden gap-3 border-t border-white/10 p-4 sm:grid sm:grid-cols-5">
        {[
          ["Open", active ? `$${priceFormatter.format(active.open)}` : "--"],
          ["High", active ? `$${priceFormatter.format(active.high)}` : "--"],
          ["Low", active ? `$${priceFormatter.format(active.low)}` : "--"],
          ["Close", active ? `$${priceFormatter.format(active.close)}` : "--"],
          ["Time", formatTime(active?.time)],
        ].map(([label, value]) => (
          <div key={label} className="min-w-0 border border-white/10 bg-black/20 px-3 py-2">
            <p className="mono-face text-[0.62rem] uppercase text-stone-500">{label}</p>
            <p className="mt-1 truncate text-sm font-bold text-white">{value}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
