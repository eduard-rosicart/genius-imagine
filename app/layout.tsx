import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Genius Imagine — AI Image & Video Generator",
  description: "Generate stunning images and videos with AI, powered by xAI",
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
