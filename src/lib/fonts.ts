import { Geist, Geist_Mono, Inter } from "next/font/google";

export const geistSans = Geist({
  variable: "--font-sans",
  subsets: ["latin"],
});

export const geistMono = Geist_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
});

export const interHeading = Inter({
  variable: "--font-heading",
  subsets: ["latin"],
  weight: ["500", "600", "700", "800"],
});
