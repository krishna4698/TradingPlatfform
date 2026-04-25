"use client";

import Link from "next/link";
import { useState } from "react";

const links = [
  { href: "/marketplace", label: "Markets" },
  { href: "/login", label: "Login" },
];

export default function Header() {
  const [isOpen, setIsOpen] = useState(false);
  const closeMenu = () => setIsOpen(false);

  return (
    <header className="sticky top-0 z-40 mx-auto w-full max-w-7xl px-3 py-3 sm:px-5 lg:px-8">
      <div className="market-shell flex items-center justify-between px-3 py-3">
        <Link href="/" className="group flex items-center gap-3" onClick={closeMenu}>
          <span className="grid h-10 w-10 place-items-center bg-[var(--lime)] text-sm font-black text-black">
            TP
          </span>
          <span className="leading-none">
            <span className="mono-face block text-[0.64rem] uppercase tracking-[0.2em] text-stone-500">
              market cockpit
            </span>
            <span className="display-face block text-xl text-white group-hover:text-[var(--lime)]">
              TradingPlatform
            </span>
          </span>
        </Link>

        <nav className="hidden items-center gap-2 sm:flex">
          {links.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="border border-transparent px-4 py-2 text-sm text-stone-300 transition hover:border-white/10 hover:bg-white/5 hover:text-white"
            >
              {item.label}
            </Link>
          ))}
          <Link
            href="/register"
            className="primary-action px-4 py-2 text-sm font-bold transition hover:translate-y-[-1px]"
          >
            Start
          </Link>
        </nav>

        <button
          type="button"
          aria-expanded={isOpen}
          aria-label="Toggle navigation menu"
          className="inline-flex h-10 w-10 items-center justify-center border border-white/10 text-stone-300 transition hover:bg-white/5 hover:text-white sm:hidden"
          onClick={() => setIsOpen((open) => !open)}
        >
          <span className="sr-only">Menu</span>
          <div className="flex flex-col gap-1.5">
            <span className={`block h-px w-4 bg-current transition ${isOpen ? "translate-y-[7px] rotate-45" : ""}`} />
            <span className={`block h-px w-4 bg-current transition ${isOpen ? "opacity-0" : ""}`} />
            <span className={`block h-px w-4 bg-current transition ${isOpen ? "-translate-y-[7px] -rotate-45" : ""}`} />
          </div>
        </button>
      </div>

      {isOpen ? (
        <div className="market-shell mt-3 p-2 sm:hidden">
          <nav className="flex flex-col text-sm">
            {[...links, { href: "/register", label: "Start" }].map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="border border-transparent px-4 py-3 text-stone-300 transition hover:border-white/10 hover:bg-white/5 hover:text-white"
                onClick={closeMenu}
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
      ) : null}
    </header>
  );
}
