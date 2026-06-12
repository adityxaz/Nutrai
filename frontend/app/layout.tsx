import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Sidebar from "@/components/Sidebar";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Gym App",
  description: "Track your workouts seamlessly",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      {/* 1. Added 'w-full min-h-screen bg-black' to body to prevent center-squeezing.
        2. Set up font classes as defaults on the layout body wrapper.
      */}
      <body className="w-full min-h-screen bg-black text-white font-sans">
        
        {/* Main app container layout: 
          Uses flex layout so the Sidebar stays locked to the left, 
          and your main workspace expands smoothly to consume ALL remaining horizontal space.
        */}
        <div className="flex w-full min-h-screen overflow-x-hidden">
          
          <Sidebar />

          {/* flex-1 handles edge-to-edge rendering automatically */}
          <main className="flex-1 w-full min-h-screen">
            {children}
          </main>

        </div>

      </body>
    </html>
  );
}