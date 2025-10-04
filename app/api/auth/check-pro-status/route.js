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
            return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
        }

        const email = session.user.email;
        console.log('🔍 Checking Pro status for:', email);

        // Get user profile from Supabase
        const { data: profile, error } = await supabase
            .from('user_profiles')
            .select('is_pro, plan_type, pro_since')
            .eq('email', email)
            .single();

        if (error) {
            console.warn('⚠️ User profile not found or error fetching:', error);
            return new Response(JSON.stringify({
                isPro: false,
                planType: null,
                proSince: null,
                message: 'User profile not found'
            }), { status: 200 });
        }

        return new Response(JSON.stringify({
            isPro: profile?.is_pro || false,
            planType: profile?.plan_type || null,
            proSince: profile?.pro_since || null,
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
