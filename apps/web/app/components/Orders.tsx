'use client'

import { QueryClient, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { closeOrder, getOrders, type Order } from "../hooks/useOrders";



const moneyFormatter = new Intl.NumberFormat("en-US", {
  maximumFractionDigits: 2,
  minimumFractionDigits: 2,
});

const quantityFormatter = new Intl.NumberFormat("en-US", {
  maximumFractionDigits: 4,
});

function formatMoney(value?: number) {
  if (typeof value !== "number" || !Number.isFinite(value)) return "--";

  return `$${moneyFormatter.format(value)}`;
}

function formatDate(value?: string) {
  if (!value) return "--";

  return new Date(value).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function OrderCard({ order }: { order: Order }) {
    
 const queryclient = useQueryClient();

   const closeMutation = useMutation({
    mutationFn:closeOrder,
    onSuccess:()=>{
        queryclient.invalidateQueries({queryKey:["orders"]})
        queryclient.invalidateQueries({queryKey:["balance"]})
    }
  })
  const isLong = order.orderType === "long";
  const isOpen = order.status === "open";
  const pnlIsPositive = order.pnl >= 0;

  return (
    <article className="group relative overflow-hidden rounded-lg border border-white/15 bg-[linear-gradient(145deg,rgba(255,247,230,0.105),rgba(255,247,230,0.035)_42%,rgba(0,0,0,0.24))] p-4 shadow-[0_18px_50px_rgba(0,0,0,0.24)] transition hover:border-white/25 sm:p-5">
      <div className={`absolute left-0 top-0 h-full w-1 ${isLong ? "bg-[var(--lime)]" : "bg-[var(--loss)]"}`} />

      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="micro-label">{order.symbol}</p>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <h3 className="mono-face text-2xl font-black text-white">
              {/* {formatMoney(order.price)} */}
            </h3>
            <span className={`mono-face border px-2 py-1 text-[0.68rem] font-black uppercase ${
              isLong
                ? "border-[var(--lime)]/45 bg-[var(--lime)]/10 text-[var(--lime)]"
                : "border-[var(--loss)]/45 bg-[var(--loss)]/10 text-[var(--loss)]"
            }`}>
              {order.orderType}
            </span>
          </div>
        </div>

        <div className="shrink-0 text-right">
          <p className="micro-label">PnL</p>
          <p className={`mono-face mt-2 text-xl font-black ${
            pnlIsPositive ? "text-[var(--lime)]" : "text-[var(--loss)]"
          }`}>
            {pnlIsPositive ? "+" : ""}{formatMoney(order.pnl)}
          </p>
        </div>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-4">
        {[
          ["Open price", formatMoney(order.price)],
          ["Leverage", `${order.leverage}x`],
          ["Take profit", formatMoney(order.takeProfit)],
          ["Stop loss", formatMoney(order.stopLoss)],
        ].map(([label, value]) => (
          <div key={label} className="min-w-0 border border-white/10 bg-black/24 px-3 py-2">
            <p className="mono-face text-[0.62rem] uppercase text-stone-500">{label}</p>
            <p className="mt-1 truncate text-sm font-bold text-white">{value}</p>
          </div>
        ))}
      </div>

      <div className="mt-4 flex flex-col gap-3 border-t border-white/10 pt-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-stone-400">
          <span className="mono-face">Qty {quantityFormatter.format(order.quantity)}</span>
          <span className="mono-face">{formatDate(order.createdAt)}</span>
          <span className={`mono-face font-bold uppercase ${isOpen ? "text-[var(--sea)]" : "text-stone-500"}`}>
            {order.status}
          </span>
        </div>

        <button
          type="button"
          disabled={!isOpen}
          onClick={() =>closeMutation.mutate(order.id)}
          className="h-11 min-w-32 rounded-md border border-white/15 bg-black/30 px-5 text-sm font-black uppercase text-white transition hover:border-[var(--ember)]/70 hover:text-[var(--ember)] disabled:cursor-not-allowed disabled:border-white/10 disabled:text-stone-600"
        >
          Close
        </button>
      </div>
    </article>
  );
}

export function Orders() {
  const {
    data: orders = [],
    isLoading,
    isError,
    refetch,
    isFetching,
  } = useQuery({
    queryKey: ["orders"],
    queryFn: getOrders,
    refetchInterval:2000
  });
 

  return (
    <section className="market-shell overflow-hidden rounded-lg p-4 sm:p-5">
      <div className="flex flex-col gap-4 border-b border-white/10 pb-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="micro-label">Get orders</p>
          <h2 className="display-face mt-2 text-3xl text-white">Orders</h2>
        </div>
      </div>

      <div className="mt-5 grid gap-4">
        {isLoading ? (
          <div className="rounded-lg border border-white/10 bg-black/20 p-8 text-center text-sm text-stone-400">
            Loading orders...
          </div>
        ) : isError ? (
          <div className="rounded-lg border border-[var(--loss)]/30 bg-[var(--loss)]/10 p-8 text-center text-sm text-[var(--loss)]">
            Could not load orders.
          </div>
        ) : orders.length ? (
          orders.map((order) => <OrderCard key={order.id} order={order} />)
        ) : (
          <div className="rounded-lg border border-white/10 bg-black/20 p-8 text-center">
            <p className="font-bold text-white">No orders yet</p>
            <p className="mt-2 text-sm text-stone-400">Created orders will appear here.</p>
          </div>
        )}
      </div>
    </section>
  );
}

export default Orders
