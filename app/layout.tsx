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
    appleWebApp: {
        capable: true,
        statusBarStyle: "default",
        title: "Troubleshooting Library",
    },
    formatDetection: {
        telephone: false,
    },
};

export const viewport = {
    themeColor: "#0a3292",
    width: "device-width",
    initialScale: 1,
    maximumScale: 1,
    userScalable: false,
};

import { headers } from "next/headers";
import Navbar from "@/components/Navbar";

export default async function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    const session = await auth();
    const host = (await headers()).get("host") || "";

    return (
        <html lang="en">
            <body
                className={`${inter.variable} ${geistMono.variable} antialiased font-sans text-slate-900`}
                suppressHydrationWarning={true}
            >
                {/* Updated: Pass session and host to Navbar */}
                <Navbar session={session} hostname={host} />
                {children}
                <SpeedInsights />
            </body>
        </html>
    );
}