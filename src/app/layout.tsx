import type { Metadata } from "next";

import { FirebaseProvider } from "@/components/firebase-provider";
import { Toaster } from "@/components/ui/sonner";

import "./globals.css";

export const metadata: Metadata = {
  title: "IHA CareFlow",
  description:
    "A care operations dashboard for Integrative Healthcare Alliance.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="flex min-h-full flex-col">
        <FirebaseProvider>{children}</FirebaseProvider>
        <Toaster richColors closeButton position="top-center" />
      </body>
    </html>
  );
}
