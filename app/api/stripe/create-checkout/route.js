import { NextResponse } from 'next/server';
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/route";
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function POST(request) {
    console.log('🔔 Creem create-checkout endpoint called');

    try {
        const session = await getServerSession(authOptions);

        if (!session) {
            return NextResponse.json(
                { error: 'Unauthorized - Please sign in' },
                { status: 401 }
            );
        }

        const { planId, userEmail } = await request.json();

        if (!planId || !userEmail) {
            throw new Error('Missing required fields: planId and userEmail are required');
        }

        // Ensure user exists in Supabase
        console.log('🔄 Ensuring user exists in Supabase...');
        const syncResponse = await fetch(
            new URL('/api/auth/sync-user', process.env.NEXTAUTH_URL),
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Cookie': request.headers.get('cookie') || ''
                },
            }
        );

        const syncData = await syncResponse.json();

        if (!syncResponse.ok) {
            throw new Error(`Failed to sync user: ${syncData.error}`);
        }

        const supabaseUserId = syncData.userId;
        console.log('✅ Using Supabase user ID:', supabaseUserId);

        // 👉 Call Creem API to create a checkout session
        const creemResponse = await fetch("https://api.creem.io/v1/checkout", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${process.env.CREEM_API_KEY}`
            },
            body: JSON.stringify({
                planId,             // The plan the user selected (monthly/yearly)
                userEmail,          // User’s email
                metadata: { userId: supabaseUserId } // optional metadata
            })
        });

        const creemData = await creemResponse.json();

        if (!creemResponse.ok) {
            throw new Error(creemData.error || `Creem checkout failed with status: ${creemResponse.status}`);
        }

        if (!creemData.checkoutUrl) {
            throw new Error("No checkout URL returned from Creem");
        }

        console.log("✅ Creem checkout created:", creemData.checkoutUrl);

        // Return the checkoutUrl to frontend
        return NextResponse.json({ checkoutUrl: creemData.checkoutUrl });

    } catch (error) {
        console.error("💥 Creem create-checkout error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
