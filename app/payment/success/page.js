// app/payment/success/page.js
'use client';
import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';

export default function PaymentSuccess() {
    const searchParams = useSearchParams();
    const sessionId = searchParams.get('session_id');
    const [isLoading, setIsLoading] = useState(true);
    const [isPro, setIsPro] = useState(false);

    useEffect(() => {
        // Verify payment and activate pro features
        const verifyPayment = async () => {
            try {
                // In a real app, you'd verify with your backend
                // For now, we'll simulate success
                await new Promise(resolve => setTimeout(resolve, 2000));

                // Activate pro features
                localStorage.setItem('tipmaster-user', JSON.stringify({
                    id: 'user_' + Date.now(),
                    email: 'user@example.com',
                    isPro: true,
                    joined: new Date().toISOString(),
                    subscription: 'active'
                }));

                setIsPro(true);
            } catch (error) {
                console.error('Payment verification failed:', error);
            } finally {
                setIsLoading(false);
            }
        };

        if (sessionId) {
            verifyPayment();
        }
    }, [sessionId]);

    if (isLoading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
                <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <h2 className="text-xl font-bold text-gray-800 mb-2">Activating Your Pro Account</h2>
                    <p className="text-gray-600">Please wait while we set up your premium features...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
            <div className="max-w-md w-full">
                <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
                    <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <span className="text-2xl">🎉</span>
                    </div>

                    <h1 className="text-3xl font-bold text-gray-800 mb-2">Welcome to TipMaster Pro!</h1>
                    <p className="text-gray-600 mb-6">
                        Your payment was successful and all premium features are now unlocked.
                    </p>

                    <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6 text-left">
                        <h3 className="font-semibold text-green-800 mb-2">What's unlocked:</h3>
                        <ul className="text-sm text-green-700 space-y-1">
                            <li>✅ Different tips per person</li>
                            <li>✅ Advanced tax calculations</li>
                            <li>✅ Save calculation history</li>
                            <li>✅ Export to CSV</li>
                            <li>✅ No ads</li>
                        </ul>
                    </div>

                    <div className="space-y-3">
                        <Link
                            href="/"
                            className="block w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-3 rounded-lg font-semibold hover:from-blue-700 hover:to-indigo-700 transition-all"
                        >
                            🧮 Start Using Pro Features
                        </Link>
                        <Link
                            href="/marketing"
                            className="block w-full border border-gray-300 text-gray-700 py-3 rounded-lg font-semibold hover:bg-gray-50 transition-all"
                        >
                            📚 Back to Homepage
                        </Link>
                    </div>

                    <p className="text-xs text-gray-500 mt-6">
                        Need help? Contact support@tipmaster.com
                    </p>
                </div>
            </div>
        </div>
    );
}