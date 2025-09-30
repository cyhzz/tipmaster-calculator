'use client';
import { useState } from 'react';

export default function ShareModal({ isOpen, onClose, shareText }) {
    const [isCopied, setIsCopied] = useState(false);

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(shareText);
            setIsCopied(true);
            setTimeout(() => setIsCopied(false), 2000);
        } catch (err) {
            console.error('Failed to copy:', err);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl p-6 max-w-md w-full">
                <h2 className="text-2xl font-bold mb-4">Share Calculation</h2>

                <div className="mb-6">
                    <p className="text-gray-600 mb-3">Copy this link to share your calculation:</p>
                    <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
                        <p className="text-sm break-words">{shareText}</p>
                    </div>
                </div>

                <div className="flex gap-3">
                    <button
                        onClick={onClose}
                        className="flex-1 py-3 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-all"
                    >
                        Close
                    </button>
                    <button
                        onClick={handleCopy}
                        className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-3 rounded-lg font-semibold hover:from-blue-700 hover:to-indigo-700 transition-all"
                    >
                        {isCopied ? '✅ Copied!' : '📋 Copy Text'}
                    </button>
                </div>

                <p className="text-xs text-center text-gray-500 mt-4">
                    Share with friends to split bills easily!
                </p>
            </div>
        </div>
    );
}