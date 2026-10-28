import type { Metadata } from "next";
import { Inter, Source_Serif_4 } from "next/font/google";
import { AmbientField } from "@/components/AmbientField";
import { AppChrome } from "@/components/AppChrome";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
  preload: true,
  adjustFontFallback: true,
});

const sourceSerif = Source_Serif_4({
  subsets: ["latin"],
  weight: ["600", "700"],
  style: ["normal", "italic"],
  variable: "--font-source-serif",
  display: "swap",
  preload: true,
  adjustFontFallback: true,
});

export const metadata: Metadata = {
  title: "Axiom Prep",
  description:
    "One Place For All Your Science Needs. This platform is where you'll discover science from first principles. Explore. Question. Understand.",
  icons: {
    icon: "/logo.png",
    apple: "/logo.png",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${inter.variable} ${sourceSerif.variable}`} data-theme="dark" suppressHydrationWarning>
      <head>
        <link rel="preload" href="/brand-orbit.png" as="image" />
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem('axiom-theme');document.documentElement.setAttribute('data-theme',t==='light'?'light':'dark');}catch(e){document.documentElement.setAttribute('data-theme','dark');}setTimeout(function(){document.documentElement.classList.add('axiom-ready');},6000);})();`,
          }}
        />
      </head>
      <body className="site-bg flex min-h-screen flex-col font-sans text-ink antialiased">
        <div id="axiom-boot" className="axiom-boot" aria-hidden="true">
          <div className="brand-orbit h-16 w-16">
            <span className="brand-orbit-ring" />
            <span className="brand-orbit-glow" />
            <img src="/brand-orbit.png" alt="" className="brand-orbit-mark" width="192" height="192" />
            <span className="brand-orbit-bead" />
          </div>
        </div>
        <AmbientField />
        <div className="relative z-10 flex min-h-screen flex-col">
          <AppChrome>{children}</AppChrome>
        </div>
      </body>
    </html>
  );
}
