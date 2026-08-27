import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Command Center — Growth Factor AI",
  description:
    "One screen for every business: live metrics, one terminal, and every app the agent can open.",
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#e9eef5" },
    { media: "(prefers-color-scheme: dark)", color: "#0a1120" },
  ],
  // The phone is a first-class target: it has to survive a notch and a keyboard.
  viewportFit: "cover",
};

/*
  Applies the saved theme before first paint. Without this the page renders in
  light, then snaps to dark a frame later — which is worse at night than either
  theme on its own. Storage can throw in a locked-down browser, so it can't be
  allowed to take the page down with it.
*/
const THEME_BOOTSTRAP = `try{var t=localStorage.getItem("cc-theme");if(t==="dark"||(t===null&&matchMedia("(prefers-color-scheme: dark)").matches))document.documentElement.classList.add("dark")}catch(e){}`;

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_BOOTSTRAP }} />
      </head>
      {/* h-dvh layout owns its own scrolling; the body must not add another. */}
      <body className="h-full overflow-hidden">{children}</body>
    </html>
  );
}
