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
                if (!credentials?.email || !credentials?.password) {
                    console.log("Auth Error: Missing credentials");
                    return null;
                }

                try {
                    // 1. Find user in Database
                    console.log(`Auth Attempt: ${credentials.email}`);
                    const user = await db.user.findUnique({
                        where: { email: credentials.email as string }
                    });

                    // 2. If no user found, return null
                    if (!user || !user.password) {
                        console.log(`Auth Error: User not found or no password for ${credentials.email}`);
                        return null;
                    }

                    // 3. Compare the typed password with the hashed password in DB
                    const passwordsMatch = await bcrypt.compare(
                        credentials.password as string,
                        user.password
                    );

                    console.log(`Auth Match Result for ${credentials.email}: ${passwordsMatch}`);

                    if (passwordsMatch) {
                        // Return the user object (this creates the session)
                        const sessionUser = {
                            id: user.id,
                            name: user.name,
                            email: user.email,
                            role: (user as any).role
                        };
                        console.log("Auth Success:", { ...sessionUser, email: "REDACTED" });
                        return sessionUser;
                    }

                    console.log(`Auth Error: Password mismatch for ${credentials.email}`);
                    return null;
                } catch (error) {
                    console.error("Auth Exception:", error);
                    return null;
                }
            },
        }),
    ],
});