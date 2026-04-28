'use client'

import { useCallback, useState } from "react"
import { useQuery } from "@tanstack/react-query"
import DepositModal from "../components/DepositModal"
import CreateOrder from "../components/CreateOrder"
import Chart from "../components/Chart"
import { getUserBalance } from "../hooks/useBalance"
import Orders from "../components/Orders"
import { logout } from "../hooks/useAuth"
import { useAuth } from "../context/AuthProvider"
import { useRouter } from "next/navigation"
import toast from "react-hot-toast"


const balanceFormatter = new Intl.NumberFormat("en-US", {
  maximumFractionDigits: 2,
})

const intervals = ["1m", "5m", "30m", "1h", "6h", "1d", "3d"]
type OrderSide = "long" | "short"

export default function Marketplace() {
  const [interval, setInterval] = useState("1h")
  const [visibleCount, setVisibleCount] = useState(96)
  const [latestBtcPrice, setLatestBtcPrice] = useState<number | null>(null)
  const [mobileOrderSide, setMobileOrderSide] = useState<OrderSide | null>(null)
  const auth = useAuth();
   const router= useRouter();
 
  const {data: balance = 0, isLoading} = useQuery({
    queryKey: ["balance"],
    queryFn: getUserBalance,
    refetchInterval:2000
  })

  const handleLatestPriceChange = useCallback((price: number | null) => {
    setLatestBtcPrice((current) => current === price ? current : price)
  }, [])
  async function handleLogout(){
       const result=await logout();
       if(result){
        auth?.setUser(null);
        toast.success("Logged Out");
        
       router.push("/")
       }
       
  }

  return (
    <main className="min-h-screen px-3 py-3 sm:px-6 lg:px-8 lg:py-5">
      <section className="market-shell mx-auto flex min-h-[calc(100vh-1.5rem)] max-w-7xl flex-col rounded-lg p-3 sm:p-5 lg:min-h-[calc(100vh-2.5rem)]">
        <div className="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between lg:gap-3">
          {/* <div className="flex h-10 items-center justify-center rounded-lg border border-white/20 bg-black/25 px-3 shadow-inner lg:hidden">
            <span className="mono-face truncate text-sm font-black text-white">BTC</span>
          </div> */}

          <div className="hidden min-h-12 flex-1 flex-wrap items-center gap-2 rounded-lg border border-white/20 bg-black/25 p-2 shadow-inner lg:flex">
            {intervals.map((entry) => (
              <button
                key={entry}
                type="button"
                onClick={() => setInterval(entry)}
                className={`h-8 min-w-10 border px-3 text-xs font-black transition ${
                  interval === entry
                    ? "border-[var(--ember)] bg-[var(--ember)] text-black"
                    : "border-white/10 bg-black/20 text-stone-300 hover:border-white/25"
                }`}
              >
                {entry}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-[minmax(0,1fr)_auto_auto] gap-2 lg:flex lg:items-center lg:justify-end lg:gap-3">
            <div className="flex h-10 min-w-0 flex-col justify-center rounded-lg border border-white/15 bg-black/30 px-2 lg:h-12 lg:w-40 lg:px-4">
              <span className="mono-face text-[0.56rem] uppercase tracking-[0.12em] text-stone-500 lg:text-[0.62rem]">Balance</span>
              <span className="mono-face truncate text-xs font-bold text-white lg:text-sm">
                {isLoading ? "..." : balanceFormatter.format(balance)}
                <span className="hidden lg:inline"> USDC</span>
              </span>
            </div>

            <DepositModal />

            <button
              type="button"
              onClick={handleLogout}
              className="h-10 rounded-md border border-[var(--loss)]/45 bg-[var(--loss)]/12 px-3 text-xs font-black uppercase text-[var(--loss)] transition hover:bg-[var(--loss)]/18 lg:h-12 lg:w-28 lg:px-4 lg:text-sm"
            >
              Logout
            </button>
          </div>
        </div>
        

        <div className="mt-3 grid flex-1 gap-4 lg:mt-5 lg:grid-cols-[minmax(0,1fr)_22rem] lg:gap-5 xl:grid-cols-[minmax(0,1fr)_24rem]">
          <Chart
            interval={interval}
            visibleCount={visibleCount}
            onLatestPriceChange={handleLatestPriceChange}
          />

          <div className="hidden lg:block">
            <CreateOrder latestPrice={latestBtcPrice} />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 pt-3 lg:hidden">
          <button
            type="button"
            onClick={() => setMobileOrderSide("long")}
            className="h-12 rounded-md border border-[var(--lime)]/55 bg-[var(--lime)]/12 text-sm font-black uppercase text-[var(--lime)] transition hover:bg-[var(--lime)]/18"
          >
            Long
          </button>
          <button
            type="button"
            onClick={() => setMobileOrderSide("short")}
            className="h-12 rounded-md border border-[var(--loss)]/55 bg-[var(--loss)]/12 text-sm font-black uppercase text-[var(--loss)] transition hover:bg-[var(--loss)]/18"
          >
            Short
          </button>
        </div>
      </section>

      {mobileOrderSide ? (
        <div className="fixed inset-0 z-40 flex items-end bg-black/70 p-3 backdrop-blur-sm lg:hidden">
          <button
            type="button"
            aria-label="Close order sheet"
            className="absolute inset-0"
            onClick={() => setMobileOrderSide(null)}
          />
          <div className="relative z-10 w-full">
            <CreateOrder
              latestPrice={latestBtcPrice}
              initialSide={mobileOrderSide}
              variant="sheet"
              onClose={() => setMobileOrderSide(null)}
            />
          </div>
        </div>
      ) : null}
      <Orders/>
    </main>
  )
}
