// app/api/auth/[...nextauth]/route.js
import NextAuth from 'next-auth';
import { SupabaseAdapter } from '@auth/supabase-adapter';
import GoogleProvider from 'next-auth/providers/google';

export const authOptions = {
    providers: [
        GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        }),
        // You can add more providers here (Email, GitHub, etc.)
    ],
    debug: true,
    adapter: SupabaseAdapter({
        url: process.env.NEXT_PUBLIC_SUPABASE_URL,
        secret: process.env.SUPABASE_SERVICE_ROLE_KEY,
    }),
    callbacks: {
        async session({ session, user }) {
            session.user.id = user.id;
            return session;
        },
    },
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };