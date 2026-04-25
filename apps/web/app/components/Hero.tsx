import Link from "next/link";

const stats = [
  ["Wallet base", "USDC"],
  ["Order path", "API ready"],
  ["Desk mode", "Focused"],
];

export default function Hero() {
  return (
    <section className="mx-auto grid min-h-[calc(100vh-88px)] w-full max-w-7xl gap-8 px-4 py-12 sm:px-6 lg:grid-cols-[0.92fr_1.08fr] lg:px-8">
      <div className="rise-in flex flex-col justify-center">
        <p className="micro-label">TradingPlatform / execution interface</p>
        <h1 className="display-face mt-5 max-w-3xl text-5xl leading-[0.92] text-white sm:text-6xl lg:text-[6.8rem]">
          Built for decisive market moves.
        </h1>
        <p className="mt-7 max-w-xl text-base leading-8 text-stone-300">
          A tighter frontend for account access, market discovery, and the next layer of trading
          workflows. Dense enough for operators, polished enough to feel alive.
        </p>

        <div className="mt-10 flex flex-col gap-3 sm:flex-row">
          <Link
            href="/register"
            className="primary-action inline-flex items-center justify-center px-6 py-3 text-sm font-bold transition hover:translate-y-[-1px]"
          >
            Create account
          </Link>
          <Link
            href="/marketplace"
            className="secondary-action inline-flex items-center justify-center px-6 py-3 text-sm font-semibold transition hover:border-white/25"
          >
            View markets
          </Link>
        </div>
      </div>

      <div className="rise-in grid content-center gap-4 [animation-delay:120ms]">
        <div className="hard-card overflow-hidden p-5 sm:p-6">
          <div className="flex items-center justify-between gap-4 border-b border-white/10 pb-4">
            <div>
              <p className="micro-label">Cockpit preview</p>
              <h2 className="display-face mt-2 text-3xl text-white">Market pressure</h2>
            </div>
            <span className="mono-face border border-[var(--sea)]/40 px-3 py-2 text-xs text-[var(--sea)]">
              ONLINE
            </span>
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            {stats.map(([label, value]) => (
              <div key={label} className="border border-white/10 bg-black/25 p-4">
                <p className="mono-face text-[0.68rem] uppercase tracking-[0.16em] text-stone-500">
                  {label}
                </p>
                <p className="mt-3 text-xl font-semibold text-white">{value}</p>
              </div>
            ))}
          </div>

          <div className="mt-5 border border-white/10 bg-black/25 p-4">
            <div className="flex h-72 items-end gap-2">
              {[42, 58, 47, 64, 71, 63, 78, 88, 74, 91, 82, 96].map((height, index) => (
                <span
                  key={index}
                  className="block flex-1 bg-[var(--ember)] shadow-[0_0_24px_rgba(255,159,28,0.22)]"
                  style={{ height: `${height}%`, opacity: 0.45 + index * 0.04 }}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
