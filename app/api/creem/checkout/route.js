// app/api/creem/checkout/route.js
import { NextResponse } from 'next/server';

export async function POST(request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) {
            return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
        }
        const { product_id, userId, userEmail } = await request.json();

        console.log("Checkout request:", { product_id, userId, userEmail });

        const response = await fetch('https://test-api.creem.io/v1/checkouts', {
            // const response = await fetch('https://api.creem.io/v1/checkouts', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': `${process.env.CREEM_SECRET_KEY}`,
            },
            body: JSON.stringify({
                product_id
                , customer_email: session.user.email,
            }),
        });

        const raw = await response.text();
        console.log("Creem API raw response:", raw);

        let data;
        try {
            data = JSON.parse(raw);
        } catch {
            return NextResponse.json(
                { error: "Creem returned non-JSON", raw },
                { status: response.status }
            );
        }

        return NextResponse.json(data, { status: response.status });
    } catch (error) {
        console.error("Checkout error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
