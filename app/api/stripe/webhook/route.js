// app/api/stripe/webhook/route.js
import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { savePurchase, updateUserToPro } from '@/lib/database';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

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
        return NextResponse.json(
            { error: `Webhook Error: ${err.message}` },
            { status: 400 }
        );
    }

    try {
        switch (event.type) {
            case 'checkout.session.completed':
                const session = event.data.object;

                // Extract plan type from price ID
                const planType = session.metadata?.planType || 'monthly';

                // Save purchase to Supabase
                await savePurchase({
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

                // Update user to pro status
                if (session.metadata?.userId) {
                    await updateUserToPro(
                        session.metadata.userId,
                        session.customer_email,
                        planType
                    );
                }

                console.log('Purchase saved and user upgraded to pro:', session.customer_email);
                break;

            case 'customer.subscription.deleted':
                const subscription = event.data.object;
                // Handle subscription cancellation
                // You might want to update user_profiles.is_pro to false
                console.log('Subscription cancelled:', subscription.id);
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