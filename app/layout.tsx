import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Dalila Fine Designs | Handmade Jewelry",
  description: "Colorful handmade jewelry designed and made with love by Dalila.",
  icons: { icon: "/images/dalila-logo.png", shortcut: "/images/dalila-logo.png" },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
