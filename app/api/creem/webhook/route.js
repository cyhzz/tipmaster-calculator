// /app/api/creem/webhook/route.js

export async function POST(req) {
    try {
        // Parse JSON body
        const payload = await req.json();

        // Log payload for debugging
        console.log('Creem webhook received:', payload);

        // Respond with JSON
        return new Response(
            JSON.stringify({ status: 'ok' }),
            {
                status: 200,
                headers: { 'Content-Type': 'application/json' },
            }
        );
    } catch (err) {
        console.error('Webhook error:', err);

        return new Response(
            JSON.stringify({ status: 'error', message: err.message }),
            {
                status: 500,
                headers: { 'Content-Type': 'application/json' },
            }
        );
    }
}

// Optional: return 405 for other methods
export async function GET() {
    return new Response(
        JSON.stringify({ error: 'Method GET not allowed' }),
        {
            status: 405,
            headers: { 'Content-Type': 'application/json' },
        }
    );
}
