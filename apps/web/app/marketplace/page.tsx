'use client'

import { useQuery } from "@tanstack/react-query"
import DepositModal from "../components/DepositModal"
import CreateOrder from "../components/CreateOrder"
import { getUserBalance } from "../hooks/useBalance"

const balanceFormatter = new Intl.NumberFormat("en-US", {
  maximumFractionDigits: 2,
})

export default function Marketplace() {
  const {data: balance = 0, isLoading} = useQuery({
    queryKey: ["balance"],
    queryFn: getUserBalance
  })

  return (
    <main className="min-h-screen px-4 py-5 sm:px-6 lg:px-8">
      <section className="market-shell mx-auto flex min-h-[calc(100vh-2.5rem)] max-w-7xl flex-col rounded-lg p-4 sm:p-5">
        <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_11rem_11rem]">
          <div
            aria-label="Reserved marketplace toolbar"
            className="h-12 rounded-lg border border-white/20 bg-black/25 shadow-inner"
          />

          <div className="flex h-12 items-center justify-between rounded-lg border border-white/15 bg-black/30 px-4">
            <span className="micro-label text-[0.62rem]">Balance</span>
            <span className="mono-face text-sm font-bold text-white">
              {isLoading ? "..." : `${balanceFormatter.format(balance)} USDC`}
            </span>
          </div>

          <DepositModal />
        </div>

        <div className="mt-5 grid flex-1 gap-5 lg:grid-cols-[minmax(0,1fr)_22rem] xl:grid-cols-[minmax(0,1fr)_24rem]">
          <section
            aria-label="Chart placeholder"
            className="min-h-[24rem] rounded-lg border border-white/15 bg-black/20 shadow-inner lg:min-h-0"
          />

          <CreateOrder />
        </div>
      </section>
    </main>
  )
}
