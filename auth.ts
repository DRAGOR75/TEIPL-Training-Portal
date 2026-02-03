import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { db } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { authConfig } from "./auth.config";

export const { handlers, auth, signIn, signOut } = NextAuth({
    ...authConfig,
    providers: [
        Credentials({
            name: "Credentials",
            credentials: {
                email: { label: "Email", type: "email" },
                password: { label: "Password", type: "password" },
            },
            async authorize(credentials) {
                if (!credentials?.email || !credentials?.password) return null;

                // 1. Find user in Database
                const user = await db.user.findUnique({
                    where: { email: credentials.email as string }
                });

                // 2. If no user found, return null
                if (!user || !user.password) return null;

                // 3. Compare the typed password with the hashed password in DB
                const passwordsMatch = await bcrypt.compare(
                    credentials.password as string,
                    user.password
                );

                if (passwordsMatch) {
                    // Return the user object (this creates the session)
                    return { id: user.id, name: user.name, email: user.email };
                }

                return null;
            },
        }),
    ],
});