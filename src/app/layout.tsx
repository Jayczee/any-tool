import type { Metadata } from "next";
import "./globals.css";

// Using system fonts to ensure build stability in all environments
// while maintaining the brutalist aesthetic.

export const metadata: Metadata = {
  title: "ANY-TOOL | Bold Utilities",
  description: "A collection of high-impact tools for high-performance humans.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body style={{
        // Define font variables locally since we're using system fonts
        //@ts-ignore
        "--font-header": '"Arial Black", "Arial", sans-serif',
        "--font-body": 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
        "--font-mono": 'ui-monospace, "SF Mono", Monaco, "Courier New", monospace'
      }}>
        <div className="grid-bg" />
        {children}
      </body>
    </html>
  );
}
