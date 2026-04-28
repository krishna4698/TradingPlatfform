
import type { Metadata } from "next";
import { Toaster } from "react-hot-toast";
import "./globals.css";
import { AuthProvider } from "./context/AuthProvider";
import Providers from "./provider";


export const metadata: Metadata = {
  title: "TradingPlatform | Market Cockpit",
  description: "A sharper trading interface for accounts, markets, and execution.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <Providers>
        <AuthProvider>
          {children}
        </AuthProvider>
        </Providers>
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              background: "#191610",
              color: "#fff7e6",
              border: "1px solid rgba(255,247,230,0.15)",
            },
          }}
        />
      </body>
    </html>
  );
}
