// app/api/creem/webhook/route.js
import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Verify Creem signature for webhook events
function verifyWebhookSignature(payload, signature) {
    const expectedSignature = crypto
        .createHmac('sha256', process.env.CREEM_WEBHOOK_SECRET)
        .update(JSON.stringify(payload))
        .digest('hex');

    return signature === expectedSignature;
}

export async function POST(request) {
    try {
        console.log('🔔 Creem webhook received');

        const payload = await request.json();
        const signature = request.headers.get('x-creem-signature');

        if (!verifyWebhookSignature(payload, signature)) {
            console.error('❌ Invalid webhook signature');
            return NextResponse.json({ error: 'Invalid signature' }, { status: 403 });
        }

        console.log('✅ Webhook signature verified');
        console.log('📦 Webhook event:', payload.event);
        console.log('📝 Webhook data:', payload.data);

        // Route to appropriate handler based on event type
        switch (payload.event) {
            case 'checkout.completed':
                await handleCheckoutCompleted(payload.data);
                break;

            case 'payment.succeeded':
                await handlePaymentSucceeded(payload.data);
                break;

            case 'payment.failed':
                await handlePaymentFailed(payload.data);
                break;

            case 'subscription.created':
                await handleSubscriptionCreated(payload.data);
                break;

            case 'subscription.cancelled':
                await handleSubscriptionCancelled(payload.data);
                break;

            case 'subscription.renewed':
                await handleSubscriptionRenewed(payload.data);
                break;

            case 'invoice.paid':
                await handleInvoicePaid(payload.data);
                break;

            case 'invoice.payment_failed':
                await handleInvoicePaymentFailed(payload.data);
                break;

            case 'payment.refunded':
                await handlePaymentRefunded(payload.data);
                break;

            default:
                console.log(`⚠️ Unhandled event type: ${payload.event}`);
        }

        console.log('🎉 Webhook processed successfully');
        return NextResponse.json({ received: true });

    } catch (error) {
        console.error('💥 Webhook processing error:', error);
        return NextResponse.json(
            { error: 'Webhook processing failed: ' + error.message },
            { status: 500 }
        );
    }
}

// Event Handlers
async function handleCheckoutCompleted(data) {
    console.log('🛒 Handling checkout completed:', data);

    const { checkout_id, order_id, customer_id, subscription_id, product_id, request_id } = data;

    // Your existing checkout processing logic
    await processCreemPurchase(data);
}

async function handlePaymentSucceeded(data) {
    console.log('💳 Handling payment succeeded:', data);

    const { payment_id, order_id, amount, currency, customer_id } = data;

    // Update purchase status to 'paid'
    const { error } = await supabase
        .from('purchases')
        .update({
            status: 'paid',
            payment_id: payment_id,
            updated_at: new Date().toISOString()
        })
        .eq('creem_order_id', order_id);

    if (error) {
        console.error('❌ Error updating payment status:', error);
        throw error;
    }

    console.log('✅ Payment status updated to paid');
}

async function handlePaymentFailed(data) {
    console.log('❌ Handling payment failed:', data);

    const { payment_id, order_id, error_message } = data;

    // Update purchase status to 'failed'
    const { error } = await supabase
        .from('purchases')
        .update({
            status: 'failed',
            failure_reason: error_message,
            updated_at: new Date().toISOString()
        })
        .eq('creem_order_id', order_id);

    if (error) {
        console.error('❌ Error updating failed payment:', error);
        throw error;
    }

    console.log('✅ Payment status updated to failed');
}

async function handleSubscriptionCreated(data) {
    console.log('📝 Handling subscription created:', data);

    const { subscription_id, customer_id, product_id, status, current_period_start, current_period_end } = data;

    // Create or update subscription record
    const { error } = await supabase
        .from('subscriptions')
        .upsert({
            creem_subscription_id: subscription_id,
            creem_customer_id: customer_id,
            product_id: product_id,
            status: status,
            current_period_start: new Date(current_period_start * 1000).toISOString(),
            current_period_end: new Date(current_period_end * 1000).toISOString(),
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        }, {
            onConflict: 'creem_subscription_id'
        });

    if (error) {
        console.error('❌ Error creating subscription:', error);
        throw error;
    }

    console.log('✅ Subscription created/updated');
}

async function handleSubscriptionCancelled(data) {
    console.log('🚫 Handling subscription cancelled:', data);

    const { subscription_id, cancelled_at } = data;

    // Update subscription status to cancelled
    const { error } = await supabase
        .from('subscriptions')
        .update({
            status: 'cancelled',
            cancelled_at: new Date(cancelled_at * 1000).toISOString(),
            updated_at: new Date().toISOString()
        })
        .eq('creem_subscription_id', subscription_id);

    if (error) {
        console.error('❌ Error cancelling subscription:', error);
        throw error;
    }

    // Also update user's pro status if needed
    await updateUserProStatus(subscription_id, false);

    console.log('✅ Subscription cancelled');
}

async function handleSubscriptionRenewed(data) {
    console.log('🔄 Handling subscription renewed:', data);

    const { subscription_id, current_period_start, current_period_end } = data;

    // Update subscription period
    const { error } = await supabase
        .from('subscriptions')
        .update({
            current_period_start: new Date(current_period_start * 1000).toISOString(),
            current_period_end: new Date(current_period_end * 1000).toISOString(),
            updated_at: new Date().toISOString()
        })
        .eq('creem_subscription_id', subscription_id);

    if (error) {
        console.error('❌ Error renewing subscription:', error);
        throw error;
    }

    console.log('✅ Subscription renewed');
}

async function handleInvoicePaid(data) {
    console.log('🧾 Handling invoice paid:', data);

    const { invoice_id, subscription_id, amount_paid, currency } = data;

    // Record invoice payment
    const { error } = await supabase
        .from('invoices')
        .upsert({
            creem_invoice_id: invoice_id,
            creem_subscription_id: subscription_id,
            amount_paid: amount_paid,
            currency: currency,
            status: 'paid',
            paid_at: new Date().toISOString(),
            created_at: new Date().toISOString()
        }, {
            onConflict: 'creem_invoice_id'
        });

    if (error) {
        console.error('❌ Error recording invoice payment:', error);
        throw error;
    }

    console.log('✅ Invoice payment recorded');
}

async function handleInvoicePaymentFailed(data) {
    console.log('💥 Handling invoice payment failed:', data);

    const { invoice_id, subscription_id, attempt_count, next_payment_attempt } = data;

    // Update invoice status
    const { error } = await supabase
        .from('invoices')
        .update({
            status: 'payment_failed',
            attempt_count: attempt_count,
            next_payment_attempt: next_payment_attempt ? new Date(next_payment_attempt * 1000).toISOString() : null,
            updated_at: new Date().toISOString()
        })
        .eq('creem_invoice_id', invoice_id);

    if (error) {
        console.error('❌ Error updating failed invoice:', error);
        throw error;
    }

    console.log('✅ Invoice payment failure recorded');
}

async function handlePaymentRefunded(data) {
    console.log('💸 Handling payment refunded:', data);

    const { payment_id, order_id, refund_amount, reason } = data;

    // Update purchase status to refunded
    const { error } = await supabase
        .from('purchases')
        .update({
            status: 'refunded',
            refund_amount: refund_amount,
            refund_reason: reason,
            refunded_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        })
        .eq('creem_order_id', order_id);

    if (error) {
        console.error('❌ Error updating refund:', error);
        throw error;
    }

    // Update user's pro status if full refund
    await updateUserProStatusByOrder(order_id, false);

    console.log('✅ Payment refund processed');
}

// Helper functions
async function processCreemPurchase(data) {
    // Your existing purchase processing logic
    console.log('Processing purchase:', data);

    // Implementation from your previous code...
}

async function updateUserProStatus(subscription_id, isPro) {
    // Update user's pro status based on subscription
    const { data: subscription } = await supabase
        .from('subscriptions')
        .select('creem_customer_id')
        .eq('creem_subscription_id', subscription_id)
        .single();

    if (subscription) {
        await supabase
            .from('user_profiles')
            .update({
                is_pro: isPro,
                updated_at: new Date().toISOString()
            })
            .eq('creem_customer_id', subscription.creem_customer_id);
    }
}

async function updateUserProStatusByOrder(order_id, isPro) {
    // Update user's pro status based on order
    const { data: purchase } = await supabase
        .from('purchases')
        .select('creem_customer_id')
        .eq('creem_order_id', order_id)
        .single();

    if (purchase) {
        await supabase
            .from('user_profiles')
            .update({
                is_pro: isPro,
                updated_at: new Date().toISOString()
            })
            .eq('creem_customer_id', purchase.creem_customer_id);
    }
}