import type { Metadata } from "next";
import ThemeProvider from "@/components/Providers/ThemeProvider";
import { geistMono, geistSans, interHeading } from "@/lib/fonts";
import { LayoutProps } from "@/lib/types";
import { cn } from "@/lib/utils";
import AppLayout from "@/components/layout/AppLayout";
import "./globals.css";

export const metadata: Metadata = {
  title: "BidFly Enterprise - Commercial Bid & Tender Intelligence",
  description: "Next-generation enterprise tender lifecycle automation and competitor intelligence platform.",
  icons: {
    icon: "/favicon.svg",
  },
};

const RootLayout = ({ children }: LayoutProps) => {
  return (
    <html
      lang="en"
      className={cn(
        "antialiased",
        geistSans.variable,
        geistMono.variable,
        interHeading.variable,
      )}
      suppressHydrationWarning>
      <body className="min-h-screen bg-background text-foreground font-sans">
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem>
          <AppLayout>{children}</AppLayout>
        </ThemeProvider>
      </body>
    </html>
  );
};

export default RootLayout;
