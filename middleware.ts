import NextAuth from "next-auth";
import { auth } from "@/auth";

export default auth;

export const config = {
    // Apply middleware to all routes EXCEPT static files (images, css) and api
    matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};