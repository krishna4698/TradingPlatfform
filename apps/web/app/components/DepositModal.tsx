'use client'

import { type FormEvent, useState } from "react"
import { useQueryClient } from "@tanstack/react-query"
import { Deposit } from "../hooks/useBalance";

export default function DepositModal() {
   const [balance, setBalance] = useState(0);
   const [isOpen, setIsOpen] = useState(false);
   const [isSubmitting, setIsSubmitting] = useState(false);
   const queryClient = useQueryClient();

   const onDeposit= async(event: FormEvent<HTMLFormElement>)=>{
      event.preventDefault();
      setIsSubmitting(true);
      const didDeposit = await Deposit(balance);
      setIsSubmitting(false);

      if(didDeposit){
        setBalance(0);
        setIsOpen(false);
        queryClient.invalidateQueries({queryKey: ["balance"]});
      }
   }

  return (
    <div className="relative min-w-0">
      <button
        type="button"
        onClick={() => setIsOpen((current) => !current)}
        className="h-10 w-full border border-[var(--ember)]/45 bg-[var(--ember)] px-2 text-xs font-black text-black transition hover:bg-[#ffd166] sm:h-12 sm:px-4 sm:text-sm lg:w-36"
      >
        Deposit
      </button>

      {isOpen ? (
        <form
          onSubmit={onDeposit}
          className="absolute right-0 top-12 z-20 w-[min(18rem,calc(100vw-2rem))] border border-white/15 bg-[#11100d] p-4 shadow-2xl sm:top-14"
        >
          <label className="micro-label" htmlFor="deposit-amount">
            USDC amount
          </label>
          <input
            id="deposit-amount"
            type="number"
            min="0"
            step="1"
            value={balance}
            onChange={(e)=>setBalance(Number(e.target.value))}
            className="input-surface mt-3 h-11 w-full px-3 outline-none transition focus:border-[var(--ember)]/70"
          />

          <div className="mt-4 grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="secondary-action h-10 text-sm font-semibold transition hover:border-white/30"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="primary-action h-10 text-sm font-bold transition disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSubmitting ? "Adding" : "Add"}
            </button>
          </div>
        </form>
      ) : null}
    </div>
  )
}
