import type { Metadata } from "next";
import "./globals.css";
export const metadata: Metadata = {
  title: "Owner Workspace | The Aster Project",
  description: "Private review and publishing workspace for The Aster Project.",
  robots: { index: false, follow: false },
};
export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <a className="skip-link" href="#main">
          Skip to content
        </a>
        {children}
      </body>
    </html>
  );
}
