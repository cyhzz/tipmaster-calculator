import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Verify Creem signature
async function verifyCreemSignature(request, rawBody) {
    const signature = request.headers.get('creem-signature');
    const webhookSecret = process.env.CREEM_WEBHOOK_SECRET;

    if (!signature) return false;

    const expectedSignature = crypto
        .createHmac('sha256', webhookSecret)
        .update(rawBody)
        .digest('hex');

    return signature === expectedSignature;
}

export async function POST(request) {
    try {
        console.log('🔔 Creem webhook received');

        const rawBody = await request.text();
        const body = JSON.parse(rawBody);

        if (!await verifyCreemSignature(request, rawBody)) {
            console.error('❌ Invalid Creem signature');
            return NextResponse.json({ error: 'Invalid signature' }, { status: 403 });
        }

        console.log('✅ Signature verified');

        // Extract relevant fields from webhook payload
        const customer_id = body.object.customer.id;
        const subscription_id = body.object.id;
        const checkout_id = subscription_id; // if no separate checkout_id
        const order_id = body.object.last_transaction?.order || null;
        const product_id = body.object.items?.[0]?.product_id || null;
        const status = body.object.status; // 'active', 'canceled', etc.
        const plan_type = body.object.product.name.toLowerCase(); // e.g., 'monthly'
        const request_id = body.id;

        // Check if user exists by creem_customer_id
        let { data: userProfile, error: userError } = await supabase
            .from('user_profiles')
            .select('*')
            .eq('creem_customer_id', customer_id)
            .single();

        let userId;

        if (userError || !userProfile) {
            // User doesn't exist, create profile
            const { data: newUserProfile, error: createError } = await supabase
                .from('user_profiles')
                .insert({
                    email: body.object.customer.email,
                    creem_customer_id: customer_id,
                    subscription_id,
                    plan_type,
                    is_pro: status === 'active',
                    pro_since: status === 'active' ? new Date().toISOString() : null,
                    updated_at: new Date().toISOString()
                })
                .select()
                .single();

            if (createError) {
                console.error('❌ Error creating user profile:', createError);
                throw new Error(createError.message);
            }

            userProfile = newUserProfile;
            userId = userProfile.id;
            console.log('✅ Created new user profile:', userId);
        } else {
            // User exists, update profile
            const { data: updatedProfile, error: updateError } = await supabase
                .from('user_profiles')
                .update({
                    subscription_id,
                    plan_type,
                    is_pro: status === 'active',
                    pro_since: status === 'active' ? (userProfile.pro_since || new Date().toISOString()) : userProfile.pro_since,
                    updated_at: new Date().toISOString()
                })
                .eq('id', userProfile.id)
                .select()
                .single();

            if (updateError) {
                console.error('❌ Error updating user profile:', updateError);
                throw new Error(updateError.message);
            }

            userProfile = updatedProfile;
            userId = userProfile.id;
            console.log('✅ Updated existing user profile:', userId);
        }

        // Save purchase record
        const { data: purchaseResult, error: purchaseError } = await supabase
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
            })
            .select();

        if (purchaseError) {
            console.error('❌ Error saving purchase:', purchaseError);
            throw new Error(purchaseError.message);
        }

        console.log('✅ Purchase saved:', purchaseResult);

        return NextResponse.json({ received: true });

    } catch (error) {
        console.error('💥 Creem webhook processing error:', error);
        return NextResponse.json({ error: 'Webhook processing failed: ' + error.message }, { status: 500 });
    }
}
