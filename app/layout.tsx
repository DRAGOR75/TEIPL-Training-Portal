import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { auth } from "@/auth";
import { SpeedInsights } from "@vercel/speed-insights/next" // Updated: Import auth

const geistSans = Geist({
    variable: "--font-geist-sans",
    subsets: ["latin"],
});

const geistMono = Geist_Mono({
    variable: "--font-geist-mono",
    subsets: ["latin"],
});

export const metadata: Metadata = {
    title: "Thriveni Training Portal",
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
                className={`${geistSans.variable} ${geistMono.variable} antialiased font-sans text-slate-900`}
                suppressHydrationWarning={true}
            >
                {/* Updated: Pass session to Navbar */}
                <Navbar session={session} />
                {children}
            </body>
        </html>
    );
}