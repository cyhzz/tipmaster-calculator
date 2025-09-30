// app/api/test-nextauth-schema/route.js
import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function GET() {
    try {
        // Simulate what NextAuth does - insert a user
        const testEmail = `nextauth-test-${Date.now()}@test.com`;

        const { data: user, error: userError } = await supabase
            .from('users')
            .insert([{
                email: testEmail,
                name: 'NextAuth Test User',
                "emailVerified": new Date().toISOString()
            }])
            .select()
            .single();

        if (userError) throw userError;

        // Simulate account creation (what happens during OAuth)
        const { data: account, error: accountError } = await supabase
            .from('accounts')
            .insert([{
                "userId": user.id,
                type: 'oauth',
                provider: 'google',
                "providerAccountId": 'test-account-id',
                access_token: 'test-token'
            }])
            .select()
            .single();

        if (accountError) throw accountError;

        // Clean up
        await supabase.from('accounts').delete().eq('id', account.id);
        await supabase.from('users').delete().eq('id', user.id);

        return NextResponse.json({
            success: true,
            message: 'NextAuth schema test passed!',
            test: {
                userInsert: '✓',
                accountInsert: '✓',
                cleanup: '✓'
            }
        });

    } catch (error) {
        return NextResponse.json({
            success: false,
            error: error.message,
            details: 'Schema mismatch - tables/columns not as expected by NextAuth'
        }, { status: 500 });
    }
}