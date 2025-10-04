'use client';
import { useState } from 'react';
import { useSession, signIn } from 'next-auth/react';

export default function PaymentModal({ isOpen, onClose, onSuccess }) {
    const { data: session } = useSession();
    const [isProcessing, setIsProcessing] = useState(false);
    const [error, setError] = useState('');
    const [selectedPlan, setSelectedPlan] = useState('monthly');

    const plans = {
        monthly: { price: '$5', id: 'prod_1zpMiQEdT1NRncHu7hbWn3' },
        // monthly: { price: '$5', id: 'prod_2AnhxKDdUE3cRdtCuS6uM7' },
        yearly: { price: '$25', id: 'prod_11q7BxvhA9vU4OR8vYTsiY' }
    };

    const handleCreemPayment = async () => {
        if (!session) {
            signIn('google', { callbackUrl: window.location.href });
            return;
        }

        setIsProcessing(true);
        setError('');

        try {
            // Call your backend API to create a Creem checkout session
            const response = await fetch('/api/creem/checkout', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    product_id: plans[selectedPlan].id,
                    userEmail: session.user.email,
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to create checkout session');
            }

            if (!data.checkout_url) {
                throw new Error('No checkout URL returned from server');
            }

            // Redirect user to Creem checkout
            window.location.href = data.checkout_url;

        } catch (err) {
            setError(err.message || 'Payment failed. Please try again.');
            console.error('Payment error:', err);
        } finally {
            setIsProcessing(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl p-6 max-w-md w-full">
                <h2 className="text-2xl font-bold mb-4">Upgrade to TipMaster Pro</h2>

                {/* Plan Selection */}
                <div className="grid grid-cols-2 gap-4 mb-6">
                    <button
                        onClick={() => setSelectedPlan('monthly')}
                        className={`p-4 border rounded-lg text-center transition-all ${selectedPlan === 'monthly'
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-gray-300 hover:border-gray-400'
                            }`}
                    >
                        <div className="font-bold text-lg">Monthly</div>
                        <div className="text-2xl font-bold text-gray-800">$5</div>
                        <div className="text-sm text-gray-600">per month</div>
                    </button>

                    <button
                        onClick={() => setSelectedPlan('yearly')}
                        className={`p-4 border rounded-lg text-center transition-all ${selectedPlan === 'yearly'
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-gray-300 hover:border-gray-400'
                            }`}
                    >
                        <div className="font-bold text-lg">Yearly</div>
                        <div className="text-2xl font-bold text-gray-800">$25</div>
                        <div className="text-sm text-gray-600">per year</div>
                        <div className="text-xs text-green-600 mt-1">Save 30%</div>
                    </button>
                </div>

                <div className="mb-6">
                    <ul className="text-sm text-gray-600 space-y-2">
                        <li className="flex items-center gap-2">✅ Different tips per person</li>
                        <li className="flex items-center gap-2">✅ Tax calculations</li>
                        <li className="flex items-center gap-2">✅ Save calculation history</li>
                        <li className="flex items-center gap-2">✅ Export results</li>
                        <li className="flex items-center gap-2">✅ No ads</li>
                    </ul>
                </div>

                {!session && (
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
                        <p className="text-sm text-yellow-800">
                            You&apos;ll need to create an account to subscribe.
                        </p>
                    </div>
                )}

                {error && (
                    <div className="text-red-600 text-sm mb-4 p-2 bg-red-50 rounded">
                        {error}
                    </div>
                )}

                <div className="flex gap-3">
                    <button
                        onClick={onClose}
                        className="flex-1 py-3 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-all"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleCreemPayment}
                        disabled={isProcessing}
                        className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-3 rounded-lg font-semibold hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 transition-all"
                    >
                        {isProcessing ? 'Processing...' : `Subscribe - ${plans[selectedPlan].price}`}
                    </button>
                </div>

                <p className="text-xs text-center text-gray-500 mt-4">
                    🔒 Secure payment powered by Creem • Cancel anytime
                </p>
            </div>
        </div>
    );
}
