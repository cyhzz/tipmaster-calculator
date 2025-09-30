import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function POST(request) {
    console.log('🔔 Webhook received');

    const body = await request.text();
    const signature = request.headers.get('stripe-signature');

    let event;
    try {
        event = stripe.webhooks.constructEvent(
            body,
            signature,
            process.env.STRIPE_WEBHOOK_SECRET
        );
        console.log('✅ Webhook signature verified, event type:', event.type);
    } catch (err) {
        console.error('❌ Webhook signature verification failed:', err.message);
        return NextResponse.json(
            { error: `Webhook Error: ${err.message}` },
            { status: 400 }
        );
    }

    try {
        console.log('🔄 Processing event:', event.type);

        switch (event.type) {
            case 'checkout.session.completed':
                const session = event.data.object;
                console.log('💰 Checkout session completed:', session.id);
                console.log('Session metadata:', session.metadata);
                console.log('Customer email:', session.customer_email);

                // Determine plan type
                const monthlyPriceId = 'price_1SD3bYQsDCoarmvpMlTYQN09';
                const yearlyPriceId = 'price_1SD3c1QsDCoarmvphTX5kVIw';
                const planType = session.metadata?.priceId === yearlyPriceId ? 'yearly' : 'monthly';

                console.log('📋 Plan type:', planType);

                // Check if user exists in auth.users before proceeding
                let userId = session.metadata?.userId;
                let userExists = false;

                if (userId) {
                    console.log('🔍 Checking if user exists in Supabase Auth:', userId);
                    const { data: authUser, error: authError } = await supabase.auth.admin.getUserById(userId);

                    if (authError || !authUser) {
                        console.log('⚠️ User not found in Supabase Auth, will proceed without user_id');
                        userId = null; // Don't use the user_id if it doesn't exist in auth
                    } else {
                        userExists = true;
                        console.log('✅ User found in Supabase Auth:', authUser.user.email);
                    }
                }

                // 1. Save purchase to Supabase (with or without user_id)
                console.log('💾 Saving purchase to Supabase...');
                const purchaseData = {
                    user_id: userExists ? userId : null, // Only set user_id if user exists in auth
                    user_email: session.customer_email,
                    stripe_session_id: session.id,
                    stripe_customer_id: session.customer,
                    price_id: session.metadata?.priceId,
                    amount: session.amount_total,
                    currency: session.currency,
                    status: 'active',
                    plan_type: planType
                };

                console.log('Purchase data to insert:', purchaseData);

                const { data: purchaseResult, error: purchaseError } = await supabase
                    .from('purchases')
                    .insert(purchaseData)
                    .select();

                if (purchaseError) {
                    console.error('❌ Error saving purchase:', purchaseError);
                    throw new Error(`Failed to save purchase: ${purchaseError.message}`);
                }
                console.log('✅ Purchase saved:', purchaseResult);

                // 2. Update user profile if user exists
                if (userExists && userId) {
                    console.log('👤 Updating user profile to pro...');
                    const { data: profileData, error: profileError } = await supabase
                        .from('user_profiles')
                        .upsert({
                            id: userId,
                            email: session.customer_email,
                            is_pro: true,
                            plan_type: planType,
                            stripe_customer_id: session.customer,
                            pro_since: new Date().toISOString(),
                            updated_at: new Date().toISOString()
                        }, {
                            onConflict: 'id'
                        })
                        .select();

                    if (profileError) {
                        console.error('❌ Error updating user profile:', profileError);
                        // Don't throw error here - purchase was successful
                        console.log('⚠️ Continuing without user profile update');
                    } else {
                        console.log('✅ User profile updated:', profileData);
                    }
                } else {
                    console.log('⚠️ No valid userId, skipping user profile update');
                }

                console.log('🎉 Purchase processed successfully for:', session.customer_email);
                break;

            case 'customer.subscription.deleted':
                const subscription = event.data.object;
                console.log('❌ Subscription deleted:', subscription.id);

                const { error: updateError } = await supabase
                    .from('user_profiles')
                    .update({
                        is_pro: false,
                        plan_type: null,
                        updated_at: new Date().toISOString()
                    })
                    .eq('stripe_customer_id', subscription.customer);

                if (updateError) {
                    console.error('Error updating user after subscription cancellation:', updateError);
                } else {
                    console.log('User downgraded after subscription cancellation');
                }
                break;

            default:
                console.log(`🤷 Unhandled event type: ${event.type}`);
        }

        console.log('✅ Webhook processing completed successfully');
        return NextResponse.json({ received: true });
    } catch (error) {
        console.error('💥 Webhook processing error:', error);
        console.error('Error stack:', error.stack);
        return NextResponse.json(
            { error: 'Webhook processing failed: ' + error.message },
            { status: 500 }
        );
    }
}