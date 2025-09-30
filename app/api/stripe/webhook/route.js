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

                // 1. Save purchase to Supabase
                console.log('💾 Saving purchase to Supabase...');
                const { data: purchaseData, error: purchaseError } = await supabase
                    .from('purchases')
                    .insert({
                        user_id: session.metadata?.userId,
                        user_email: session.customer_email,
                        stripe_session_id: session.id,
                        stripe_customer_id: session.customer,
                        price_id: session.metadata?.priceId,
                        amount: session.amount_total,
                        currency: session.currency,
                        status: 'active',
                        plan_type: planType
                    })
                    .select();

                if (purchaseError) {
                    console.error('❌ Error saving purchase:', purchaseError);
                    throw new Error(`Failed to save purchase: ${purchaseError.message}`);
                }
                console.log('✅ Purchase saved:', purchaseData);

                // 2. Update user to pro status
                if (session.metadata?.userId) {
                    console.log('👤 Updating user profile to pro...');
                    const { data: profileData, error: profileError } = await supabase
                        .from('user_profiles')
                        .upsert({
                            id: session.metadata.userId,
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
                        throw new Error(`Failed to update user profile: ${profileError.message}`);
                    }
                    console.log('✅ User profile updated:', profileData);
                } else {
                    console.log('⚠️ No userId in metadata, skipping user profile update');
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