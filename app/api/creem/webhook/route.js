import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

// ✅ Signature verification (optional but recommended)
async function verifyCreemSignature(request, rawBody) {
    const signature = request.headers.get('creem-signature');
    const secret = process.env.CREEM_WEBHOOK_SECRET;
    if (!signature || !secret) return false;

    const expected = crypto
        .createHmac('sha256', secret)
        .update(rawBody)
        .digest('hex');

    return expected === signature;
}

export async function POST(request) {
    try {
        const rawBody = await request.text();
        const body = JSON.parse(rawBody);

        // 🔒 Verify signature if enabled
        const valid = await verifyCreemSignature(request, rawBody);
        if (!valid) {
            console.error('❌ Invalid Creem signature');
            return NextResponse.json({ error: 'Invalid signature' }, { status: 403 });
        }

        const eventType = body.eventType;
        console.log('📦 Creem event received:', eventType);

        // 🚫 Skip unrelated events
        if (eventType !== 'checkout.completed') {
            console.log('⏩ Ignored event:', eventType);
            return NextResponse.json({ skipped: true });
        }

        // ✅ Extract fields from your structure
        const checkout = body.object;
        const customer = checkout.customer;
        const order = checkout.order;
        const subscription = checkout.subscription;
        const product = checkout.product;

        const customer_id = customer.id;
        const customer_email = customer.email;
        const subscription_id = subscription?.id || null;
        const checkout_id = checkout.id;
        const order_id = order.id;
        const product_id = product.id;
        const status = checkout.status; // completed
        const plan_type = product.name?.toLowerCase() || null;
        const request_id = body.id;
        const current_period_start = subscription?.current_period_start_date || null;
        const current_period_end = subscription?.current_period_end_date || null;

        console.log('🧾 Parsed checkout info:', {
            customer_email,
            customer_id,
            subscription_id,
            plan_type,
            status
        });

        // ✅ 1. Upsert user profile
        const { data: existingProfile } = await supabase
            .from('user_profiles')
            .select('*')
            .eq('creem_customer_id', customer_id)
            .single();

        let userId;

        if (!existingProfile) {
            console.log('👤 Creating new user profile');
            const { data: newProfile, error: insertError } = await supabase
                .from('user_profiles')
                .insert({
                    email: customer_email,
                    creem_customer_id: customer_id,
                    plan_type,
                    is_pro: true,
                    pro_since: new Date().toISOString(),
                    updated_at: new Date().toISOString()
                })
                .select()
                .single();

            if (insertError) {
                console.error('❌ Failed to insert profile:', insertError);
                throw insertError;
            }

            userId = newProfile.id;
        } else {
            console.log('🔄 Updating existing profile');
            const { data: updatedProfile, error: updateError } = await supabase
                .from('user_profiles')
                .update({
                    plan_type,
                    is_pro: true,
                    pro_since: existingProfile.pro_since || new Date().toISOString(),
                    updated_at: new Date().toISOString()
                })
                .eq('id', existingProfile.id)
                .select()
                .single();

            if (updateError) {
                console.error('❌ Failed to update profile:', updateError);
                throw updateError;
            }

            userId = updatedProfile.id;
        }

        // ✅ 2. Insert purchase record
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
                updated_at: new Date().toISOString()
            });

        if (purchaseError) {
            console.error('❌ Error saving purchase:', purchaseError);
            throw purchaseError;
        }

        console.log('✅ Purchase recorded successfully');
        return NextResponse.json({ success: true });

    } catch (error) {
        console.error('💥 Webhook error:', error);
        return NextResponse.json(
            { error: 'Webhook failed: ' + error.message },
            { status: 500 }
        );
    }
}
