// app/not-found.js
import Link from 'next/link';

export default function NotFound() {
    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center px-4">
            <div className="max-w-md w-full text-center">
                <div className="bg-white rounded-2xl shadow-lg p-8">
                    <div className="text-6xl mb-4">😅</div>
                    <h1 className="text-2xl font-bold text-gray-800 mb-2">Page Not Found</h1>
                    <p className="text-gray-600 mb-6">
                        Oops! The page you&apos;re looking for doesn&apos;t exist.
                    </p>
                    <div className="space-y-3">
                        <Link
                            href="/"
                            className="block w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-3 rounded-lg font-semibold hover:from-blue-700 hover:to-indigo-700 transition-all"
                        >
                            🧮 Go to Calculator
                        </Link>
                        <Link
                            href="/marketing"
                            className="block w-full border border-gray-300 text-gray-700 py-3 rounded-lg font-semibold hover:bg-gray-50 transition-all"
                        >
                            📚 Visit Homepage
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}