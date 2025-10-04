import { getServerSession } from "next-auth";
import { authOptions } from "../[...nextauth]/route";
import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function POST(req) {
    try {
        const session = await getServerSession(authOptions);

        if (!session) {
            return new Response(JSON.stringify({ error: "Unauthorized" }), {
                status: 401,
            });
        }

        const email = session.user.email;
        console.log("🔄 Syncing user to Supabase:", email);

        let supabaseUserId;

        try {
            // Try to find user by email
            const { data: users, error: listError } =
                await supabaseAdmin.auth.admin.listUsers();

            if (listError) {
                console.error("❌ Error listing users:", listError);
                throw listError;
            }

            const existingUser = users.users.find((user) => user.email === email);

            if (existingUser) {
                supabaseUserId = existingUser.id;
                console.log("✅ User already exists in Supabase:", supabaseUserId);
            } else {
                // Create user if missing
                console.log("👤 Creating new user in Supabase:", email);
                const { data: newUser, error: createError } =
                    await supabaseAdmin.auth.admin.createUser({
                        email,
                        email_confirm: true,
                    });

                if (createError) {
                    console.error("❌ Error creating Supabase user:", createError);
                    throw new Error(`Failed to create user: ${createError.message}`);
                }

                supabaseUserId = newUser.user.id;
                console.log("✅ Created new Supabase user:", supabaseUserId);
            }
        } catch (authError) {
            console.error("❌ Auth API error:", authError);
            throw new Error(`Auth service error: ${authError.message}`);
        }

        // Upsert minimal user profile (only defined fields)
        const { error: profileError } = await supabaseAdmin
            .from("user_profiles")
            .upsert(
                {
                    id: supabaseUserId,
                    email,
                    creem_customer_id: null,
                    plan_type: "monthly", // default placeholder
                    is_pro: false,
                    pro_since: null,
                    updated_at: new Date().toISOString(),
                },
                { onConflict: "id" }
            );

        if (profileError) {
            console.error("❌ Error updating user profile:", profileError);
        } else {
            console.log("✅ User profile synced");
        }

        return new Response(
            JSON.stringify({
                success: true,
                userId: supabaseUserId,
                message: "User synced successfully",
            }),
            { status: 200 }
        );
    } catch (error) {
        console.error("💥 User sync error:", error);
        return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
        });
    }
}
