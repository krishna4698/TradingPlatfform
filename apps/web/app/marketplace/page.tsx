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
import Link from "next/link"


const balanceFormatter = new Intl.NumberFormat("en-US", {
  maximumFractionDigits: 2,
})

const intervals = ["1m", "5m", "30m", "1h", "6h", "1d", "3d"]
type OrderSide = "long" | "short"

export default function Marketplace() {
  const [interval, setInterval] = useState("1h")
  const [visibleCount] = useState(96)
  const [latestBtcPrice, setLatestBtcPrice] = useState<number | null>(null)
  const [mobileOrderSide, setMobileOrderSide] = useState<OrderSide | null>(null)
  const auth = useAuth()
  const user = auth?.user
  const isAuthLoading = auth?.isAuthLoading ?? false
  const isLoggedIn = Boolean(user)
  const router = useRouter()
 
  const {data: balance = 0, isLoading} = useQuery({
    queryKey: ["balance"],
    queryFn: getUserBalance,
    enabled: isLoggedIn,
    refetchInterval: isLoggedIn ? 2000 : false,
  })

  const handleLatestPriceChange = useCallback((price: number | null) => {
    setLatestBtcPrice((current) => current === price ? current : price)
  }, [])
  async function handleLogout() {
    const result = await logout()
    if (result) {
      auth?.setUser(null)
      toast.success("Logged Out")
      router.push("/")
    }
  }

  return (
    <main className="min-h-screen w-full overflow-x-hidden">
      <div className="flex min-h-screen w-full flex-col">
        <header className="grid grid-cols-[auto_minmax(0,1fr)] items-center gap-2 border-b border-white/10 bg-[rgba(9,8,6,0.86)] px-2 py-2 shadow-[0_18px_60px_rgba(0,0,0,0.28)] backdrop-blur-xl sm:px-5 sm:py-4 lg:flex lg:justify-between lg:px-6">
          <Link
            href="/"
            aria-label="Go to home page"
            className="group flex h-11 min-w-0 items-center gap-3 rounded-lg border border-white/20 bg-black/30 px-2 shadow-inner transition hover:border-[var(--lime)]/55 hover:bg-black/40 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--lime)] sm:h-14 sm:w-auto sm:min-w-64 sm:px-3"
          >
            <span className="mono-face grid h-8 w-[4.45rem] shrink-0 place-items-center rounded-md bg-[var(--lime)] text-[0.68rem] font-black tracking-[0.08em] text-black shadow-[0_0_24px_rgba(198,255,61,0.16)] transition group-hover:scale-[1.03] sm:h-10 sm:w-[4.75rem] sm:text-[0.74rem]">
              1000X
            </span>
            <span className="hidden min-w-0 leading-none sm:block">
  
              <span className="display-face block truncate text-xl text-white transition group-hover:text-[var(--lime)] sm:text-2xl">
                Trading
              </span>
            </span>
          </Link>

          <div className={isLoggedIn ? "grid min-w-0 grid-cols-[minmax(0,1fr)_auto_auto] items-center gap-1.5 sm:w-auto sm:gap-2 lg:flex lg:items-center lg:justify-end lg:gap-3" : "flex min-w-0 items-center justify-end"}>
            {isAuthLoading ? (
              <div className="h-10 w-24 rounded-lg border border-white/10 bg-black/25 sm:h-12 sm:w-28" />
            ) : isLoggedIn ? (
              <>
                <div className="flex h-10 min-w-0 flex-col justify-center rounded-md border border-white/15 bg-black/30 px-2 sm:h-12 lg:w-40 lg:px-4">
                  <span className="mono-face text-[0.5rem] uppercase tracking-[0.1em] text-stone-500 lg:text-[0.62rem]">Balance</span>
                  <span className="mono-face truncate text-[0.68rem] font-bold text-white sm:text-xs lg:text-sm">
                    {isLoading ? "..." : balanceFormatter.format(balance)}
                    <span className="hidden lg:inline"> USDC</span>
                  </span>
                </div>

                <DepositModal />
                <button
                  type="button"
                  onClick={handleLogout}
                  className="h-10 rounded-md border border-[var(--loss)]/45 bg-[var(--loss)]/12 px-2 text-[0.66rem] font-black uppercase text-[var(--loss)] transition hover:bg-[var(--loss)]/18 sm:px-3 sm:text-xs lg:h-12 lg:w-28 lg:px-4 lg:text-sm"
                >
                  Logout
                </button>
              </>
            ) : (
              <Link
                href="/login"
                className="primary-action grid h-11 min-w-28 place-items-center rounded-md px-4 text-xs font-black uppercase transition hover:translate-y-[-1px] sm:h-12 sm:text-sm"
              >
                Login
              </Link>
            )}
          </div>
        </header>

        <section className="flex flex-1 flex-col bg-[rgba(9,8,6,0.54)] p-2 sm:p-4 lg:p-5">
          <div className="hidden min-h-12 flex-wrap items-center gap-2 rounded-lg border border-white/20 bg-black/25 p-2 shadow-inner lg:flex">
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

          <div className={`mt-3 grid flex-1 gap-4 lg:mt-5 lg:gap-5 ${isLoggedIn ? "lg:grid-cols-[minmax(0,1fr)_22rem] xl:grid-cols-[minmax(0,1fr)_24rem]" : ""}`}>
            <Chart
              interval={interval}
              visibleCount={visibleCount}
              onLatestPriceChange={handleLatestPriceChange}
            />

            {isLoggedIn ? (
              <div className="hidden lg:block">
                <CreateOrder latestPrice={latestBtcPrice} />
              </div>
            ) : null}
          </div>

          {isLoggedIn ? (
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
          ) : null}
        </section>

        {isLoggedIn && mobileOrderSide ? (
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
        {isLoggedIn ? <Orders/> : null}
      </div>
    </main>
  )
}
