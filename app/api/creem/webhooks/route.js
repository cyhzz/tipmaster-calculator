// app/api/creem/checkout/route.js
import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Verify Creem signature
function verifyCreemSignature(query) {
    const { checkout_id, order_id, customer_id, subscription_id, product_id, request_id, signature } = query;

    const params = { checkout_id, customer_id, order_id, product_id, request_id, subscription_id };
    const sortedKeys = Object.keys(params).sort();
    const payload = sortedKeys.map(key => `${key}=${params[key] || ''}`).join('&');

    const expectedSignature = crypto
        .createHmac('sha256', process.env.CREEM_WEBHOOK_SECRET)
        .update(payload)
        .digest('hex');

    return signature === expectedSignature;
}

// Process the purchase (common function for both GET and POST)
async function processCreemPurchase(query) {
    const { checkout_id, order_id, customer_id, subscription_id, product_id, request_id } = query;

    console.log('💾 Processing Creem purchase...', query);

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

    return { success: true, purchase: purchaseResult };
}

// Handle GET requests (Creem callback after successful payment)
export async function GET(request) {
    try {
        console.log('🔔 Creem GET webhook received');

        // Creem sends parameters as query string in GET requests
        const query = Object.fromEntries(new URL(request.url).searchParams.entries());

        if (!verifyCreemSignature(query)) {
            console.error('❌ Invalid Creem signature', query);
            return NextResponse.json({ error: 'Invalid signature' }, { status: 403 });
        }

        console.log('✅ Signature verified', query);

        // Process the purchase
        await processCreemPurchase(query);

        console.log('🎉 Creem purchase processed successfully via GET');

        // Redirect to success page or return JSON
        const acceptHeader = request.headers.get('accept');

        if (acceptHeader && acceptHeader.includes('text/html')) {
            // If it's a browser request, redirect to success page
            return NextResponse.redirect(new URL('/payment/success', request.url));
        } else {
            // If it's an API call, return JSON
            return NextResponse.json({
                success: true,
                message: 'Payment processed successfully'
            });
        }

    } catch (error) {
        console.error('💥 Creem GET webhook processing error:', error);

        // Redirect to error page or return JSON error
        const acceptHeader = request.headers.get('accept');

        if (acceptHeader && acceptHeader.includes('text/html')) {
            return NextResponse.redirect(new URL('/payment/error', request.url));
        } else {
            return NextResponse.json(
                { error: 'Webhook processing failed: ' + error.message },
                { status: 500 }
            );
        }
    }
}

// Handle POST requests (optional - for other webhook types or testing)
export async function POST(request) {
    try {
        console.log('🔔 Creem POST webhook received');

        // For POST requests, Creem might send data in body OR query string
        const url = new URL(request.url);
        const queryParams = Object.fromEntries(url.searchParams.entries());

        let query = queryParams;

        // If no query params, check if data is in body
        if (Object.keys(queryParams).length === 0) {
            try {
                const body = await request.json();
                query = body;
            } catch (bodyError) {
                console.log('⚠️ No JSON body found, using query parameters');
            }
        }

        if (!verifyCreemSignature(query)) {
            console.error('❌ Invalid Creem signature', query);
            return NextResponse.json({ error: 'Invalid signature' }, { status: 403 });
        }

        console.log('✅ Signature verified', query);

        // Process the purchase
        await processCreemPurchase(query);

        console.log('🎉 Creem purchase processed successfully via POST');
        return NextResponse.json({ received: true });

    } catch (error) {
        console.error('💥 Creem POST webhook processing error:', error);
        return NextResponse.json(
            { error: 'Webhook processing failed: ' + error.message },
            { status: 500 }
        );
    }
}

// Optional: Add other HTTP methods if needed
export async function PUT(request) {
    return NextResponse.json({ error: 'Method not allowed' }, { status: 405 });
}

export async function DELETE(request) {
    return NextResponse.json({ error: 'Method not allowed' }, { status: 405 });
}