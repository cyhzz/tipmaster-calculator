import { getServerSession } from "next-auth";
import { authOptions } from "../[...nextauth]/route";
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function GET(req) {
    try {
        const session = await getServerSession(authOptions);

        if (!session) {
            return new Response(JSON.stringify({ error: 'Unauthorized' }), {
                status: 401
            });
        }

        console.log('🔍 Checking Pro status for:', session.user.email);

        // Get user profile from Supabase
        const { data: profile, error } = await supabase
            .from('user_profiles')
            .select('is_pro, plan_type, pro_since, stripe_customer_id')
            .eq('email', session.user.email)
            .single();

        console.log('📊 Profile data from Supabase:', profile);
        console.log('❌ Error from Supabase:', error);

        if (error) {
            console.error('❌ Error fetching user profile:', error);
            // User might not exist yet, return not pro
            return new Response(JSON.stringify({
                isPro: false,
                planType: null,
                proSince: null,
                message: 'User profile not found'
            }), { status: 200 });
        }

        const isProUser = profile?.is_pro || false;
        console.log('✅ Final Pro status:', isProUser);

        return new Response(JSON.stringify({
            isPro: isProUser,
            planType: profile?.plan_type || null,
            proSince: profile?.pro_since || null,
            stripeCustomerId: profile?.stripe_customer_id || null,
            message: 'Pro status checked successfully'
        }), { status: 200 });

    } catch (error) {
        console.error('💥 Check Pro status error:', error);
        return new Response(JSON.stringify({
            isPro: false,
            planType: null,
            proSince: null,
            message: 'Error checking Pro status'
        }), { status: 200 });
    }
}