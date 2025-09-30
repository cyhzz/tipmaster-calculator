import { getServerSession } from "next-auth/next";
import { authOptions } from "./[...nextauth]";
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const session = await getServerSession(req, res, authOptions);

        if (!session) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        // Check if user already exists in Supabase
        const { data: existingUser, error: lookupError } =
            await supabaseAdmin.auth.admin.getUserByEmail(session.user.email);

        if (existingUser) {
            return res.status(200).json({ message: 'User already exists', userId: existingUser.user.id });
        }

        // Create user in Supabase
        const { data: newUser, error: createError } =
            await supabaseAdmin.auth.admin.createUser({
                email: session.user.email,
                email_confirm: true,
                user_metadata: {
                    name: session.user.name,
                    avatar: session.user.image,
                }
            });

        if (createError) {
            throw new Error(`Failed to create user: ${createError.message}`);
        }

        res.status(200).json({ message: 'User created successfully', userId: newUser.user.id });

    } catch (error) {
        console.error('Setup user error:', error);
        res.status(500).json({ error: error.message });
    }
}