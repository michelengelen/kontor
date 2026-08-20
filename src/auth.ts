import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { redirect } from "next/navigation";
import { verifyPassword } from "@/lib/password";

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Credentials({
      credentials: {
        password: { label: "Password", type: "password" },
      },
      authorize(credentials) {
        const stored = process.env.AUTH_PASSWORD_HASH;
        const password = credentials?.password;
        if (!stored || typeof password !== "string") return null;
        if (!verifyPassword(password, stored)) return null;
        return { id: "owner", name: "Owner" };
      },
    }),
  ],
  pages: { signIn: "/login" },
  session: { strategy: "jwt", maxAge: 60 * 60 * 24 * 30 },
});

// Server actions must not rely on the proxy alone.
export async function requireAuth() {
  const session = await auth();
  if (!session) redirect("/login");
}
