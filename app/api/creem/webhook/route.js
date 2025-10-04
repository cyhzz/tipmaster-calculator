// app/api/creem/checkout/route.js
import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Verify Creem signature
export async function verifyCreemSignature(query) {
    const webhookSecret = process.env.CREEM_WEBHOOK_SECRET;
    const signature = query.headers.get('creem-signature');

    if (!signature) {
        return new Response('Missing signature', { status: 400 });
    }

    // Retrieve the raw request body
    const rawBody = await query.text();

    // Compute the HMAC-SHA256 hash
    const expectedSignature = crypto
        .createHmac('sha256', webhookSecret)
        .update(rawBody)
        .digest('hex');

    // Compare the computed signature with the provided signature
    // if (computedSignature !== signature) {
    //     return new Response('Invalid signature', { status: 400 });

    return signature === expectedSignature;
}

export async function POST(request) {
    try {
        console.log('🔔 Creem webhook received');

        // Creem sends parameters as query string
        const query = Object.fromEntries(new URL(request.url).searchParams.entries());

        if (!await verifyCreemSignature(query)) {
            console.error('❌ Invalid Creem signature', query);
            return NextResponse.json({ error: 'Invalid signature' }, { status: 403 });
        }

        console.log('✅ Signature verified', query);

        const { checkout_id, order_id, customer_id, subscription_id, product_id, request_id } = query;

        // Retrieve or create user in Supabase based on customer_id/email
        let userId = null;
        let userExists = false;

        const { data: userProfile, error: userError } = await supabase
            .from('user_profiles')
            .select('*')
            .eq('creem_customer_id', customer_id)
            .single();

        if (!userError && userProfile) {
            userId = userProfile.id;
            userExists = true;
            console.log('✅ User found in Supabase:', userId);
        } else {
            console.log('⚠️ User not found, will save purchase without user_id');
        }

        // Determine plan type based on product_id (adjust IDs as needed)
        const monthlyProductId = 'prod_monthly_123';
        const yearlyProductId = 'prod_yearly_456';
        const planType = product_id === yearlyProductId ? 'yearly' : 'monthly';

        // Save purchase
        console.log('💾 Saving purchase to Supabase...');
        const purchaseData = {
            user_id: userExists ? userId : null,
            creem_customer_id: customer_id,
            creem_order_id: order_id,
            creem_checkout_id: checkout_id,
            product_id,
            subscription_id: subscription_id || null,
            status: 'active',
            plan_type: planType,
            request_id: request_id || null,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        };

        const { data: purchaseResult, error: purchaseError } = await supabase
            .from('purchases')
            .insert(purchaseData)
            .select();

        if (purchaseError) {
            console.error('❌ Error saving purchase:', purchaseError);
            throw new Error(`Failed to save purchase: ${purchaseError.message}`);
        }

        console.log('✅ Purchase saved:', purchaseResult);

        // Update user profile if exists
        if (userExists && userId) {
            console.log('👤 Updating user profile to pro...');
            const { data: profileData, error: profileError } = await supabase
                .from('user_profiles')
                .upsert({
                    id: userId,
                    is_pro: true,
                    plan_type: planType,
                    creem_customer_id: customer_id,
                    pro_since: new Date().toISOString(),
                    updated_at: new Date().toISOString()
                }, {
                    onConflict: 'id'
                })
                .select();

            if (profileError) {
                console.error('❌ Error updating user profile:', profileError);
            } else {
                console.log('✅ User profile updated:', profileData);
            }
        }

        console.log('🎉 Creem purchase processed successfully');
        return NextResponse.json({ received: true });
    } catch (error) {
        console.error('💥 Creem webhook processing error:', error);
        return NextResponse.json(
            { error: 'Webhook processing failed: ' + error.message },
            { status: 500 }
        );
    }
}