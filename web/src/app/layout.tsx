import "./globals.css";

import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "RSS articles",
  description: "Articles returned by the RSS API.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>): React.JSX.Element {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
