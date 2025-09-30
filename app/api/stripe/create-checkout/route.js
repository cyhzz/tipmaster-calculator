import { NextResponse } from 'next/server';
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/route";
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function POST(request) {
    console.log('🔔 Create-checkout endpoint called');

    try {
        const session = await getServerSession(authOptions);

        if (!session) {
            return NextResponse.json({ error: 'Unauthorized - Please sign in' }, { status: 401 });
        }

        const { priceId, userEmail } = await request.json();

        if (!priceId || !userEmail) {
            throw new Error('Missing required fields: priceId and userEmail are required');
        }

        // First, ensure user exists in Supabase by calling our sync endpoint
        console.log('🔄 Ensuring user exists in Supabase...');
        const syncResponse = await fetch(new URL('/api/auth/sync-user', process.env.NEXTAUTH_URL), {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Cookie': request.headers.get('cookie') || '' // Pass cookies for auth
            },
        });

        const syncData = await syncResponse.json();

        if (!syncResponse.ok) {
            throw new Error(`Failed to sync user: ${syncData.error}`);
        }

        const supabaseUserId = syncData.userId;
        console.log('✅ Using Supabase user ID:', supabaseUserId);

        // Now call your existing checkout route with the Supabase user ID
        const checkoutUrl = new URL('/api/stripe/checkout', process.env.NEXTAUTH_URL);

        const response = await fetch(checkoutUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                priceId: priceId,
                userId: supabaseUserId,
                userEmail: userEmail,
            }),
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || `Checkout failed with status: ${response.status}`);
        }

        if (!data.sessionId) {
            throw new Error('No session ID returned from checkout endpoint');
        }

        console.log('✅ Checkout session created successfully:', data.sessionId);
        return NextResponse.json({ sessionId: data.sessionId });

    } catch (error) {
        console.error('💥 Create checkout error:', error);
        return NextResponse.json(
            { error: error.message },
            { status: 500 }
        );
    }
}