"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import Header from "../components/Header";
import { useAuth } from "../context/AuthProvider";
import { loginUser } from "../hooks/useAuth";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const router = useRouter();
  // const { refreshUser } = useAuth();

  const onSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const result = await loginUser(email, password);
    if (result) {
      // await refreshUser();
      const next = new URLSearchParams(window.location.search).get("next") ?? "/marketplace";
      router.push(next);
    }
  };

  return (
    <main className="min-h-screen">
      <Header />
      <section className="mx-auto grid min-h-[calc(100vh-88px)] w-full max-w-7xl gap-10 px-4 py-12 sm:px-6 lg:grid-cols-[0.88fr_1.12fr] lg:items-center lg:px-8">
        <div className="rise-in">
          <p className="micro-label">Login</p>
          <h1 className="display-face mt-4 text-5xl leading-tight text-white sm:text-6xl">
            Return to the market cockpit.
          </h1>
          <p className="mt-5 max-w-md text-base leading-8 text-stone-300">
            Sign in to continue into the market board and keep the trading surface close.
          </p>
        </div>

        <section className="hard-card rise-in p-6 sm:p-8 [animation-delay:120ms]">
          <div className="max-w-md">
            <p className="micro-label">Credentials</p>
            <h2 className="display-face mt-2 text-3xl text-white">Sign in</h2>
            <p className="mt-2 text-sm leading-6 text-stone-400">Enter your email and password.</p>

            <form className="mt-8 space-y-5" onSubmit={onSubmit}>
              <div className="space-y-2">
                <label htmlFor="email" className="text-sm font-medium text-stone-200">
                  Email address
                </label>
                <input
                  id="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  name="email"
                  type="email"
                  placeholder="you@example.com"
                  className="input-surface h-12 w-full px-4 outline-none transition placeholder:text-stone-600 focus:border-[var(--ember)]/60"
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="password" className="text-sm font-medium text-stone-200">
                  Password
                </label>
                <input
                  id="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  name="password"
                  type="password"
                  placeholder="Enter your password"
                  className="input-surface h-12 w-full px-4 outline-none transition placeholder:text-stone-600 focus:border-[var(--ember)]/60"
                />
              </div>

              <div className="flex flex-col gap-3 text-sm text-stone-500 sm:flex-row sm:items-center sm:justify-between">
                <span>Use the account you registered with.</span>
                <Link href="/register" className="text-stone-300 transition hover:text-white">
                  Create account
                </Link>
              </div>

              <button
                type="submit"
                className="primary-action w-full px-4 py-3 text-base font-bold transition hover:translate-y-[-1px]"
              >
                Sign in
              </button>
            </form>
          </div>
        </section>
      </section>
    </main>
  );
}
