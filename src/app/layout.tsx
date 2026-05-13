import type { Metadata } from "next";
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
      <body className="flex min-h-full flex-col">{children}</body>
    </html>
  );
}
