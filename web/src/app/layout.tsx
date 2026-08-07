import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "RSS articles",
  description: "Articles returned by the RSS API.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
