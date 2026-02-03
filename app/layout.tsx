import type { Metadata } from "next";
import { Inter, Geist_Mono } from "next/font/google";
import "./globals.css";
import { auth } from "@/auth";
import { SpeedInsights } from "@vercel/speed-insights/next"

const inter = Inter({
    variable: "--font-inter",
    subsets: ["latin"],
    weight: ["400", "500", "600", "700", "900"],
});

const geistMono = Geist_Mono({
    variable: "--font-geist-mono",
    subsets: ["latin"],
});

export const metadata: Metadata = {
    title: "Training Thriveni",
    description: "Training Management System for Thriveni Earthmovers & Infra Pvt. Ltd.",
};

import Navbar from "@/components/Navbar";

export default async function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    const session = await auth(); // Updated: Fetch session

    return (
        <html lang="en">
            <body
                className={`${inter.variable} ${geistMono.variable} antialiased font-sans text-slate-900`}
                suppressHydrationWarning={true}
            >
                {/* Updated: Pass session to Navbar */}
                <Navbar session={session} />
                {children}
                <SpeedInsights />
            </body>
        </html>
    );
}