import { getServerSession } from "next-auth";
import { authOptions } from "../[...nextauth]/route";
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function POST(req) {
    try {
        const session = await getServerSession(authOptions);

        if (!session) {
            return new Response(JSON.stringify({ error: 'Unauthorized' }), {
                status: 401
            });
        }

        console.log('🔄 Syncing user to Supabase:', session.user.email);

        let supabaseUserId;

        try {
            // Method 1: Try to get user by email using listUsers
            const { data: users, error: listError } = await supabaseAdmin.auth.admin.listUsers();

            if (listError) {
                console.error('❌ Error listing users:', listError);
                throw listError;
            }

            // Find user by email
            const existingUser = users.users.find(user => user.email === session.user.email);

            if (existingUser) {
                supabaseUserId = existingUser.id;
                console.log('✅ User already exists in Supabase:', supabaseUserId);
            } else {
                // Create user in Supabase if doesn't exist
                console.log('👤 Creating new user in Supabase:', session.user.email);
                const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
                    email: session.user.email,
                    email_confirm: true,
                    user_metadata: {
                        name: session.user.name,
                        avatar: session.user.image,
                    }
                });

                if (createError) {
                    console.error('❌ Error creating Supabase user:', createError);
                    throw new Error(`Failed to create user: ${createError.message}`);
                }

                supabaseUserId = newUser.user.id;
                console.log('✅ Created new Supabase user:', supabaseUserId);
            }
        } catch (authError) {
            console.error('❌ Auth API error:', authError);
            throw new Error(`Auth service error: ${authError.message}`);
        }

        // Also ensure user profile exists
        const { error: profileError } = await supabaseAdmin
            .from('user_profiles')
            .upsert({
                id: supabaseUserId,
                email,
                creem_customer_id: null,
                plan_type: 'monthly',   // default
                is_pro: false,
                pro_since: null,
                updated_at: new Date().toISOString()
            }, {
                onConflict: 'id'
            });

        if (profileError) {
            console.error('❌ Error updating user profile:', profileError);
        } else {
            console.log('✅ User profile updated');
        }

        return new Response(
            JSON.stringify({
                success: true,
                userId: supabaseUserId,
                message: 'User synced successfully'
            }),
            { status: 200 }
        );

    } catch (error) {
        console.error('💥 User sync error:', error);
        return new Response(JSON.stringify({ error: error.message }), {
            status: 500
        });
    }
}