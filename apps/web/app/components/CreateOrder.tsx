'use client'

import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { createOrder } from "../hooks/useOrders";

type OrderSide = "long" | "short";

type CreateOrderProps = {
  latestPrice?: number | null;
  initialSide?: OrderSide;
  variant?: "panel" | "sheet";
  onClose?: () => void;
}

const priceFormatter = new Intl.NumberFormat("en-US", {
  maximumFractionDigits: 2,
});

function CreateOrder({
  latestPrice,
  initialSide = "long",
  variant = "panel",
  onClose,
}: CreateOrderProps) {
  const [takeprofit, setTakeprofit] = useState(0);
  const [stoploss, setStoploss] = useState(0);
  const [qty, setQuantity] = useState(0);
  const [leverage, setLeverage] = useState(1);
  const [side, setSide] = useState<OrderSide>(initialSide);
  const [isSubmitting, setIsSubmitting] = useState<OrderSide | null>(null);
  const queryClient = useQueryClient();

  const status = "open";
  const asset = "BTC";
  const isSheet = variant === "sheet";

  useEffect(() => {
    setSide(initialSide);
  }, [initialSide]);

  async function submitOrder(nextSide: OrderSide) {
    if(isSubmitting) return;

    setSide(nextSide);
    setIsSubmitting(nextSide);
    const result = await createOrder(
      asset,
      status,
      Number(leverage),
      nextSide,
      Number(qty),
      Number(takeprofit),
      Number(stoploss)
    );

    if(result?.engineResult?.status === "created") {
      toast.success(`${nextSide} order created`);
      queryClient.invalidateQueries({queryKey: ["balance"]});
      onClose?.();
    }

    setIsSubmitting(null);
  }

  return (
    <section className={`flex flex-col border border-white/15 bg-black/25 p-5 ${
      isSheet
        ? "max-h-[82vh] w-full overflow-y-auto rounded-lg"
        : "h-full min-h-[28rem]"
    }`}>
      <div className="flex items-start justify-between gap-4 border-b border-white/10 pb-4">
        <div>
          <p className="micro-label">Create order</p>
          <h2 className="mt-2 text-xl font-bold text-white">BTC ticket</h2>
          <p className="mono-face mt-2 text-sm text-stone-400">
            Price {latestPrice ? `$${priceFormatter.format(latestPrice)}` : "--"}
          </p>
        </div>

        <div className="flex items-start gap-3">
          <label className="min-w-24 text-right">
            <span className="micro-label block">Token</span>
            <select
              value={asset}
              disabled
              className="input-surface mt-2 h-10 w-full px-3 text-sm font-bold outline-none"
            >
              <option value="BTC">BTC</option>
            </select>
          </label>

          {isSheet ? (
            <button
              type="button"
              onClick={onClose}
              className="secondary-action mt-6 h-10 px-3 text-xs font-bold transition hover:border-white/30"
            >
              Close
            </button>
          ) : null}
        </div>
      </div>

      <form
        onSubmit={(event) => event.preventDefault()}
        className="mt-5 flex flex-1 flex-col gap-4"
      >
        {isSheet ? (
          <div className="grid grid-cols-2 gap-2 border border-white/10 bg-black/20 p-1">
            {(["long", "short"] as OrderSide[]).map((entry) => (
              <button
                key={entry}
                type="button"
                onClick={() => setSide(entry)}
                className={`h-10 text-sm font-black uppercase transition ${
                  side === entry
                    ? entry === "long"
                      ? "bg-[var(--lime)] text-black"
                      : "bg-[var(--loss)] text-black"
                    : "text-stone-300 hover:bg-white/5"
                }`}
              >
                {entry}
              </button>
            ))}
          </div>
        ) : null}

        <label className="block">
          <span className="micro-label">Leverage</span>
          <input
            type="number"
            min="1"
            value={leverage}
            onChange={(e) => setLeverage(Number(e.target.value))}
            className="input-surface mt-2 h-12 w-full px-4 text-lg font-bold outline-none transition focus:border-[var(--ember)]/70"
          />
        </label>

        <label className="block">
          <span className="micro-label">Quantity</span>
          <input
            type="number"
            min="0"
            step="0.01"
            value={qty}
            onChange={(e) => setQuantity(Number(e.target.value))}
            className="input-surface mt-2 h-12 w-full px-4 text-lg font-bold outline-none transition focus:border-[var(--ember)]/70"
          />
        </label>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
          <label className="block">
            <span className="micro-label">Take profit</span>
            <input
              type="number"
              min="0"
              step="0.01"
              value={takeprofit}
              onChange={(e) => setTakeprofit(Number(e.target.value))}
              className="input-surface mt-2 h-12 w-full px-4 font-bold outline-none transition focus:border-[var(--lime)]/70"
            />
          </label>

          <label className="block">
            <span className="micro-label">Stop loss</span>
            <input
              type="number"
              min="0"
              step="0.01"
              value={stoploss}
              onChange={(e) => setStoploss(Number(e.target.value))}
              className="input-surface mt-2 h-12 w-full px-4 font-bold outline-none transition focus:border-[var(--loss)]/70"
            />
          </label>
        </div>

        {isSheet ? (
          <button
            type="button"
            onClick={() => submitOrder(side)}
            disabled={Boolean(isSubmitting)}
            className={`mt-auto h-12 border text-sm font-black uppercase transition disabled:cursor-not-allowed disabled:opacity-60 ${
              side === "long"
                ? "border-[var(--lime)] bg-[var(--lime)] text-black"
                : "border-[var(--loss)] bg-[var(--loss)] text-black"
            }`}
          >
            {isSubmitting ? "Sending" : "Place order"}
          </button>
        ) : (
        <div className="mt-auto grid grid-cols-2 gap-3 pt-3">
          <button
            type="button"
            onClick={() => submitOrder("long")}
            disabled={Boolean(isSubmitting)}
            className={`h-12 border text-sm font-black uppercase transition disabled:cursor-not-allowed disabled:opacity-60 ${
              side === "long"
                ? "border-[var(--lime)] bg-[var(--lime)] text-black"
                : "border-[var(--lime)]/45 bg-[var(--lime)]/10 text-[var(--lime)] hover:bg-[var(--lime)]/18"
            }`}
          >
            {isSubmitting === "long" ? "Sending" : "Long"}
          </button>

          <button
            type="button"
            onClick={() => submitOrder("short")}
            disabled={Boolean(isSubmitting)}
            className={`h-12 border text-sm font-black uppercase transition disabled:cursor-not-allowed disabled:opacity-60 ${
              side === "short"
                ? "border-[var(--loss)] bg-[var(--loss)] text-black"
                : "border-[var(--loss)]/45 bg-[var(--loss)]/10 text-[var(--loss)] hover:bg-[var(--loss)]/18"
            }`}
          >
            {isSubmitting === "short" ? "Sending" : "Short"}
          </button>
        </div>
        )}
      </form>
    </section>
  );
}

export default CreateOrder;
