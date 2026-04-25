"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import toast from "react-hot-toast";
import Header from "../components/Header";
import { registerUser } from "../hooks/useAuth";

export default function RegisterPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const router = useRouter();

  const onSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!email || !password || !name) {
      toast.error("Provide all fields");
      return;
    }

    const created = await registerUser(name, email, password);
    if (created) {
      router.push("/login");
    }
  };

  return (
    <main className="min-h-screen">
      <Header />
      <section className="mx-auto grid min-h-[calc(100vh-88px)] w-full max-w-7xl gap-10 px-4 py-12 sm:px-6 lg:grid-cols-[0.88fr_1.12fr] lg:items-center lg:px-8">
        <div className="rise-in">
          <p className="micro-label">Register</p>
          <h1 className="display-face mt-4 text-5xl leading-tight text-white sm:text-6xl">
            Create your operator profile.
          </h1>
          <p className="mt-5 max-w-md text-base leading-8 text-stone-300">
            Start with a clean account, then move straight into the marketplace surface.
          </p>
        </div>

        <section className="hard-card rise-in p-6 sm:p-8 [animation-delay:120ms]">
          <div className="max-w-md">
            <p className="micro-label">Account setup</p>
            <h2 className="display-face mt-2 text-3xl text-white">Account details</h2>
            <p className="mt-2 text-sm leading-6 text-stone-400">
              Use your name, email, and a secure password.
            </p>

            <form className="mt-8 space-y-5" onSubmit={onSubmit}>
              <div className="space-y-2">
                <label htmlFor="name" className="text-sm font-medium text-stone-200">
                  Full name
                </label>
                <input
                  id="name"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  name="name"
                  type="text"
                  placeholder="Krish Sharma"
                  className="input-surface h-12 w-full px-4 outline-none transition placeholder:text-stone-600 focus:border-[var(--ember)]/60"
                />
              </div>

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
                  placeholder="Create password"
                  className="input-surface h-12 w-full px-4 outline-none transition placeholder:text-stone-600 focus:border-[var(--ember)]/60"
                />
              </div>

              <div className="flex flex-col gap-3 text-sm text-stone-500 sm:flex-row sm:items-center sm:justify-between">
                <span>Use at least 8 characters.</span>
                <Link href="/login" className="text-stone-300 transition hover:text-white">
                  Already have an account
                </Link>
              </div>

              <button
                type="submit"
                className="primary-action w-full px-4 py-3 text-base font-bold transition hover:translate-y-[-1px]"
              >
                Create account
              </button>
            </form>
          </div>
        </section>
      </section>
    </main>
  );
}
