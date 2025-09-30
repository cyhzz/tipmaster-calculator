// app/api/debug-schema-detailed/route.js
import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function GET() {
    try {
        // Test if we can insert a test user (simulating NextAuth)
        const testEmail = `test-${Date.now()}@test.com`;

        const { data: userData, error: userError } = await supabase
            .from('users')
            .insert([
                {
                    email: testEmail,
                    name: 'Test User',
                    "emailVerified": new Date().toISOString()
                }
            ])
            .select()
            .single();

        if (userError) {
            return NextResponse.json({
                success: false,
                error: 'User insert failed',
                details: userError
            });
        }

        // Clean up test data
        await supabase
            .from('users')
            .delete()
            .eq('id', userData.id);

        return NextResponse.json({
            success: true,
            message: 'Schema test passed - tables are properly structured',
            test: {
                inserted: userData,
                cleanedUp: true
            }
        });

    } catch (error) {
        return NextResponse.json({
            success: false,
            error: error.message
        }, { status: 500 });
    }
}