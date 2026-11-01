import type { Metadata, Viewport } from "next";
import { Fredoka } from "next/font/google";
import { SwRegister } from "@/components/SwRegister";
import "./globals.css";

const fredoka = Fredoka({
  variable: "--font-fredoka",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "triplo",
  description: "Junta 3 números iguales y súbelos de nivel.",
  applicationName: "triplo",
  appleWebApp: { capable: true, title: "triplo", statusBarStyle: "default" },
  icons: { icon: [{ url: "/icon.svg", type: "image/svg+xml" }], apple: "/icons/apple-touch-icon.png" },
};

export const viewport: Viewport = {
  themeColor: "#fff8ef",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="es" className={`${fredoka.variable} h-full antialiased`}>
      <body className="min-h-full font-sans">
        {children}
        <SwRegister />
      </body>
    </html>
  );
}
