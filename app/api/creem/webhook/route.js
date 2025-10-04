// /app/api/creem/checkout/route.js
import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Verify Creem signature
export function verifyCreemSignature(headers, rawBody) {
    const webhookSecret = process.env.CREEM_WEBHOOK_SECRET;
    const signature = headers.get('creem-signature');

    if (!signature) {
        return false;
    }

    const expectedSignature = crypto
        .createHmac('sha256', webhookSecret)
        .update(rawBody)
        .digest('hex');

    return signature === expectedSignature;
}

export async function POST(request) {
    try {
        console.log('🔔 Creem webhook received');

        // Read body once
        const rawBody = await request.text();
        let body;
        try {
            body = JSON.parse(rawBody);
        } catch {
            return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
        }

        // Verify signature
        if (!verifyCreemSignature(request.headers, rawBody)) {
            console.error('❌ Invalid Creem signature', body.id);
            return NextResponse.json({ error: 'Invalid signature' }, { status: 403 });
        }

        console.log('✅ Signature verified:', body.id);

        // Extract nested fields from Creem payload
        const customer_id = body.object.customer?.id;
        const subscription_id = body.object.id;
        const checkout_id = subscription_id; // fallback
        const order_id = body.object.last_transaction?.order || null;
        const product_id = body.object.items?.[0]?.product_id || body.object.product?.id || null;
        const status = body.object.status;
        const plan_type = body.object.product?.name?.toLowerCase() || 'monthly';
        const request_id = body.id;

        if (!customer_id || !product_id) {
            throw new Error('Missing required customer_id or product_id');
        }

        // Check user in Supabase
        let userId = null;
        let userExists = false;
        const { data: userProfile } = await supabase
            .from('user_profiles')
            .select('*')
            .eq('creem_customer_id', customer_id)
            .single();

        if (userProfile) {
            userId = userProfile.id;
            userExists = true;
            console.log('✅ User found in Supabase:', userId);
        } else {
            console.log('⚠️ User not found, saving purchase without user_id');
        }

        // Save purchase
        const { error: purchaseError } = await supabase
            .from('purchases')
            .insert({
                user_id: userId,
                creem_customer_id: customer_id,
                creem_order_id: order_id,
                creem_checkout_id: checkout_id,
                product_id,
                subscription_id,
                status,
                plan_type,
                request_id,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
            });

        if (purchaseError) {
            throw new Error(`Failed to save purchase: ${purchaseError.message}`);
        }

        console.log('✅ Purchase saved for customer_id:', customer_id);

        // Update or create user profile
        if (userExists && userId) {
            const { error: profileError } = await supabase
                .from('user_profiles')
                .upsert(
                    {
                        id: userId,
                        is_pro: true,
                        plan_type,
                        creem_customer_id: customer_id,
                        pro_since: new Date().toISOString(),
                        updated_at: new Date().toISOString(),
                    },
                    { onConflict: 'id' }
                );

            if (profileError) {
                console.error('❌ Error updating user profile:', profileError);
            } else {
                console.log('✅ User profile updated:', userId);
            }
        }

        console.log('🎉 Creem webhook processed successfully');
        return NextResponse.json({ received: true });
    } catch (error) {
        console.error('💥 Creem webhook processing error:', error);
        return NextResponse.json(
            { error: 'Webhook processing failed: ' + error.message },
            { status: 500 }
        );
    }
}
