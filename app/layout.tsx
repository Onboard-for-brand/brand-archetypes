import type { Metadata } from "next";
import { SmoothScroll } from "@/components/SmoothScroll";
import { Noise } from "@/components/Noise";
import "./globals.css";

const languageBootScript = `
try {
  var language = window.localStorage.getItem("brand-archetypes-language");
  if (language === "en") {
    document.documentElement.dataset.language = "en";
    document.documentElement.lang = "en";
  }
} catch (_) {}
`;

export const metadata: Metadata = {
  title: "Onboarding for Brand",
  description:
    "A 42-question excavation of brand archetype, journey stage, and voice.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN" data-language="zh" suppressHydrationWarning>
      <body className="antialiased selection:bg-[#e53935] selection:text-white">
        <script dangerouslySetInnerHTML={{ __html: languageBootScript }} />
        <Noise />
        <SmoothScroll>{children}</SmoothScroll>
      </body>
    </html>
  );
}
