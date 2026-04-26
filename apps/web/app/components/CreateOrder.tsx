'use client'

import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { createOrder } from "../hooks/useOrders";

type OrderSide = "long" | "short";

function CreateOrder() {
  const [takeprofit, setTakeprofit] = useState(0);
  const [stoploss, setStoploss] = useState(0);
  const [qty, setQuantity] = useState(0);
  const [leverage, setLeverage] = useState(1);
  const [side, setSide] = useState<OrderSide>("long");
  const [isSubmitting, setIsSubmitting] = useState<OrderSide | null>(null);
  const queryClient = useQueryClient();

  const status = "open";
  const asset = "BTC";

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
    }

    setIsSubmitting(null);
  }

  return (
    <section className="flex h-full min-h-[28rem] flex-col border border-white/15 bg-black/25 p-5">
      <div className="flex items-start justify-between gap-4 border-b border-white/10 pb-4">
        <div>
          <p className="micro-label">Create order</p>
          <h2 className="mt-2 text-xl font-bold text-white">BTC ticket</h2>
        </div>

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
      </div>

      <form
        onSubmit={(event) => event.preventDefault()}
        className="mt-5 flex flex-1 flex-col gap-4"
      >
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
      </form>
    </section>
  );
}

export default CreateOrder;
