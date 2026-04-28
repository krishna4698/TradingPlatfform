'use client'
import Header from "./components/Header";
import Hero from "./components/Hero";
import { useAuth } from "./context/AuthProvider";

export default function HomePage() {
// const {user}=useAuth();
  return (
    <main className="min-h-screen">

      <Header />
      <Hero />
    </main>
  );
}
