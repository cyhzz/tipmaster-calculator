// pages/api/creem/webhook.js

// ... all your imports and functions ...

// New configuration to disable the built-in body parser
export const config = {
    api: {
        bodyParser: false,
    },
};

export default async function handler(req, res) {
    if (req.method === 'POST') {
        try {
            console.log('🔔 Creem webhook received');
            return res.status(200).json({ received: true });
            // 1. Manually read the raw body stream
            const rawBody = await getRawBody(req);
            const signature = req.headers['x-creem-signature'];

            // 2. The payload is the parsed JSON data
            const payload = JSON.parse(rawBody.toString());

            // 3. Update the signature verification to use the raw body
            if (!verifyWebhookSignature(rawBody.toString(), signature)) {
                console.error('❌ Invalid webhook signature');
                return res.status(403).json({ error: 'Invalid signature' });
            }

            // ... rest of your original logic using 'payload' and 'res'
            console.log('✅ Webhook signature verified');
            // ... (switch case) ...

            console.log('🎉 Webhook processed successfully');
            return res.status(200).json({ received: true });

        } catch (error) {
            // ...
        }
    } else {
        // ... (405 error handling)
    }
}

// You'll need a helper function to read the raw body stream
// You can install 'raw-body' or use a simple implementation like this:
function getRawBody(req) {
    return new Promise((resolve, reject) => {
        let body = '';
        req.on('data', chunk => body += chunk.toString());
        req.on('end', () => resolve(body));
        req.on('error', reject);
    });
}

// Update your verification function
function verifyWebhookSignature(rawBody, signature) {
    const expectedSignature = crypto
        .createHmac('sha256', process.env.CREEM_WEBHOOK_SECRET)
        .update(rawBody) // Use rawBody string here
        .digest('hex');

    return signature === expectedSignature;
}