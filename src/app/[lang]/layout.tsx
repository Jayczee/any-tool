import type { Metadata } from "next";
import "../../app/globals.css";
import { hasLocale, getDictionary } from "./dictionaries";

interface RootLayoutProps {
  children: React.ReactNode;
  params: Promise<{ lang: string }>;
}

export async function generateMetadata({ params }: RootLayoutProps): Promise<Metadata> {
  const { lang } = await params;
  if (!hasLocale(lang)) return {};
  const dict = await getDictionary(lang);
  return {
    title: dict.meta.title,
    description: dict.meta.description,
  };
}

export async function generateStaticParams() {
  return [{ lang: 'en' }, { lang: 'zh' }];
}

export default async function RootLayout({ children, params }: RootLayoutProps) {
  const { lang } = await params;
  if (!hasLocale(lang)) {
    return (
      <html lang="en">
        <body style={{
          "--font-header": '"Arial Black", "Arial", sans-serif',
          "--font-body": 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
          "--font-mono": 'ui-monospace, "SF Mono", Monaco, "Courier New", monospace'
        } as React.CSSProperties}>
          <div className="grid-bg" />
          {children}
        </body>
      </html>
    );
  }

  return (
    <html lang={lang}>
      <body style={{
        "--font-header": '"Arial Black", "Arial", sans-serif',
        "--font-body": 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
        "--font-mono": 'ui-monospace, "SF Mono", Monaco, "Courier New", monospace'
      } as React.CSSProperties}>
        <div className="grid-bg" />
        {children}
      </body>
    </html>
  );
}
