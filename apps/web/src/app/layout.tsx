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
    "Remembering lives and exploring the stories shared by The Aster Project.",
  robots: { index: false, follow: false },
  icons: { icon: "/icon.svg" },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" data-scroll-behavior="smooth">
      <body>
        <a className="skip-link" href="#main">
          Skip to content
        </a>
        <div className="demo-banner">
          <span className="demo-dot" />{" "}
          {process.env.CONTENT_SOURCE === "published"
            ? "The Aster Project · Stories shared with care"
            : "A work in progress / Fictional sample stories for demonstration"}
        </div>
        <SiteHeader />
        {children}
        <SiteFooter />
      </body>
    </html>
  );
}
