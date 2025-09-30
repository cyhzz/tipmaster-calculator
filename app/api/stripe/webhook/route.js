import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// Initialize Supabase client
const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY // Use service role key for admin access
);

export async function POST(request) {
    const body = await request.text();
    const signature = request.headers.get('stripe-signature');

    let event;

    try {
        event = stripe.webhooks.constructEvent(
            body,
            signature,
            process.env.STRIPE_WEBHOOK_SECRET
        );
    } catch (err) {
        console.error('Webhook signature verification failed:', err.message);
        return NextResponse.json(
            { error: `Webhook Error: ${err.message}` },
            { status: 400 }
        );
    }

    try {
        switch (event.type) {
            case 'checkout.session.completed':
                const session = event.data.object;

                // Determine plan type from price ID
                const monthlyPriceId = 'price_1SD3bYQsDCoarmvpMlTYQN09';
                const yearlyPriceId = 'price_1SD3c1QsDCoarmvphTX5kVIw';

                const planType = session.metadata?.priceId === yearlyPriceId ? 'yearly' : 'monthly';

                // 1. Save purchase to Supabase
                const { error: purchaseError } = await supabase
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
                    });

                if (purchaseError) {
                    console.error('Error saving purchase:', purchaseError);
                    throw new Error(`Failed to save purchase: ${purchaseError.message}`);
                }

                // 2. Update user to pro status in user_profiles
                if (session.metadata?.userId) {
                    const { error: profileError } = await supabase
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
                        });

                    if (profileError) {
                        console.error('Error updating user profile:', profileError);
                        throw new Error(`Failed to update user profile: ${profileError.message}`);
                    }
                }

                console.log('Purchase saved and user upgraded to pro:', session.customer_email);
                break;

            case 'customer.subscription.deleted':
                const subscription = event.data.object;

                // Update user to remove pro status when subscription is cancelled
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
                    console.log('User downgraded after subscription cancellation:', subscription.customer);
                }
                break;

            default:
                console.log(`Unhandled event type: ${event.type}`);
        }

        return NextResponse.json({ received: true });
    } catch (error) {
        console.error('Webhook processing error:', error);
        return NextResponse.json(
            { error: 'Webhook processing failed' },
            { status: 500 }
        );
    }
}