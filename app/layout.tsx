import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Genius Imagine — AI Image & Video Generator",
  description: "Generate stunning images and videos with AI, powered by xAI",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Genius Imagine",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
  themeColor: "#1e1f22",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="h-screen overflow-hidden antialiased">
        {children}
      </body>
    </html>
  );
}
