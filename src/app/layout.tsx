import type { Metadata } from "next";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "The Aster Project — Every life has a story",
    template: "%s | The Aster Project",
  },
  description:
    "An interactive prototype for remembering lives and exploring documented cases. All current records are fictional demonstration content.",
  robots: { index: false, follow: false },
  icons: { icon: "/icon.svg" },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>
        <a className="skip-link" href="#main">
          Skip to content
        </a>
        <div className="demo-banner">
          <span className="demo-dot" /> A work in progress{" "}
          <span className="banner-divider">/</span> Fictional sample stories for
          demonstration
        </div>
        <SiteHeader />
        {children}
        <SiteFooter />
      </body>
    </html>
  );
}
