// app/marketing/page.js
import Link from 'next/link';

export default function MarketingPage() {
    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
            {/* Navigation */}
            <nav className="bg-white shadow-sm">
                <div className="max-w-6xl mx-auto px-4 py-4 flex justify-between items-center">
                    <div className="flex items-center gap-2">
                        <span className="text-2xl">🧮</span>
                        <span className="text-xl font-bold text-gray-800">TipMaster</span>
                    </div>
                    <div className="flex gap-4">
                        <Link href="/" className="text-gray-600 hover:text-gray-900">Open App</Link>
                        <a href="#features" className="text-gray-600 hover:text-gray-900">Features</a>
                        <a href="#pricing" className="text-gray-600 hover:text-gray-900">Pricing</a>
                    </div>
                </div>
            </nav>

            {/* Hero Section */}
            <section className="max-w-6xl mx-auto px-4 py-16 text-center">
                <h1 className="text-5xl md:text-6xl font-bold text-gray-800 mb-6">
                    Split Bills Fairly,
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600"> Without the Awkward Math</span>
                </h1>
                <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
                    TipMaster calculates tips, splits bills, and handles complex dining scenarios so you can focus on enjoying time with friends.
                </p>
                <div className="flex gap-4 justify-center flex-wrap">
                    <Link
                        href="/"
                        className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-8 py-4 rounded-lg font-semibold text-lg hover:from-blue-700 hover:to-indigo-700 transition-all shadow-lg"
                    >
                        🚀 Start Calculating Free
                    </Link>
                    <a
                        href="#features"
                        className="border border-gray-300 text-gray-700 px-8 py-4 rounded-lg font-semibold text-lg hover:bg-gray-50 transition-all"
                    >
                        📚 Learn More
                    </a>
                </div>


                {/* App Preview */}
                <div className="mt-16 max-w-4xl mx-auto bg-white rounded-2xl shadow-2xl p-2">
                    <div className="bg-gray-800 rounded-lg p-4 flex gap-2 justify-start">
                        <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                        <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                        <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                    </div>
                    <div className="p-8">
                        <div className="grid md:grid-cols-2 gap-8 items-center">
                            <div className="text-left">
                                <h3 className="text-2xl font-bold text-gray-800 mb-4">Live Calculator Preview</h3>
                                <div className="space-y-3 text-gray-600">
                                    <div className="flex items-center gap-2">
                                        <span className="text-green-500">✓</span>
                                        <span>Calculate tips and tax instantly</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="text-green-500">✓</span>
                                        <span>Split between any number of people</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="text-green-500">✓</span>
                                        <span>Different tips for each person</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="text-green-500">✓</span>
                                        <span>Save and share calculations</span>
                                    </div>
                                </div>
                            </div>
                            <div className="bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl p-6 text-white">
                                <div className="text-center">
                                    <div className="text-3xl font-bold mb-2">$24.75</div>
                                    <div className="text-sm opacity-90">per person</div>
                                </div>
                                <div className="mt-4 text-sm space-y-2">
                                    <div className="flex justify-between">
                                        <span>Bill: $100.00</span>
                                        <span>4 people</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span>Tax: $8.00</span>
                                        <span>Tip: 18%</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Features Section */}
            <section id="features" className="max-w-6xl mx-auto px-4 py-16 bg-white">
                <div className="text-center mb-12">
                    <h2 className="text-3xl md:text-4xl font-bold text-gray-800 mb-4">
                        Why Choose TipMaster?
                    </h2>
                    <p className="text-gray-600 max-w-2xl mx-auto">
                        Built for real-world dining scenarios that other calculators miss.
                    </p>
                </div>

                <div className="grid md:grid-cols-3 gap-8">
                    <div className="text-center p-6">
                        <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <span className="text-2xl">👥</span>
                        </div>
                        <h3 className="text-xl font-bold text-gray-800 mb-2">Group-Friendly</h3>
                        <p className="text-gray-600">
                            Split bills between any number of people. Handle different tip percentages for each person.
                        </p>
                    </div>

                    <div className="text-center p-6">
                        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <span className="text-2xl">💸</span>
                        </div>
                        <h3 className="text-xl font-bold text-gray-800 mb-2">Tax Smart</h3>
                        <p className="text-gray-600">
                            Handle tax-inclusive and tax-exclusive bills. Customize tax rates for any location.
                        </p>
                    </div>

                    <div className="text-center p-6">
                        <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <span className="text-2xl">📊</span>
                        </div>
                        <h3 className="text-xl font-bold text-gray-800 mb-2">Save & Share</h3>
                        <p className="text-gray-600">
                            Keep calculation history and share results with friends via link or export to CSV.
                        </p>
                    </div>
                </div>
            </section>

            {/* Pricing Section */}
            <section id="pricing" className="max-w-6xl mx-auto px-4 py-16">
                <div className="text-center mb-12">
                    <h2 className="text-3xl md:text-4xl font-bold text-gray-800 mb-4">
                        Simple, Transparent Pricing
                    </h2>
                    <p className="text-gray-600">
                        Start free forever. Upgrade only if you need advanced features.
                    </p>
                </div>

                <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
                    {/* Free Plan */}
                    <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-200">
                        <h3 className="text-2xl font-bold text-gray-800 mb-2">Free</h3>
                        <div className="text-3xl font-bold text-gray-800 mb-4">$0<span className="text-lg text-gray-600">/forever</span></div>
                        <ul className="space-y-3 mb-6">
                            <li className="flex items-center gap-2 text-gray-600">
                                <span className="text-green-500">✓</span>
                                Basic tip calculation
                            </li>
                            <li className="flex items-center gap-2 text-gray-600">
                                <span className="text-green-500">✓</span>
                                Split between people
                            </li>
                            <li className="flex items-center gap-2 text-gray-600">
                                <span className="text-green-500">✓</span>
                                Standard tip percentages
                            </li>
                            <li className="flex items-center gap-2 text-gray-400">
                                <span>○</span>
                                Different tips per person
                            </li>
                            <li className="flex items-center gap-2 text-gray-400">
                                <span>○</span>
                                Tax calculations
                            </li>
                            <li className="flex items-center gap-2 text-gray-400">
                                <span>○</span>
                                Save history
                            </li>
                        </ul>
                        <Link
                            href="/"
                            className="block w-full bg-gray-100 text-gray-800 text-center py-3 rounded-lg font-semibold hover:bg-gray-200 transition-all"
                        >
                            Get Started Free
                        </Link>
                    </div>

                    {/* Pro Plan */}
                    <div className="bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl shadow-lg p-8 text-white relative">
                        <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                            <span className="bg-yellow-500 text-white text-sm px-4 py-1 rounded-full font-semibold">
                                MOST POPULAR
                            </span>
                        </div>
                        <h3 className="text-2xl font-bold mb-2">Pro</h3>
                        <div className="text-3xl font-bold mb-4">$3<span className="text-lg opacity-90">/month</span></div>
                        <ul className="space-y-3 mb-6">
                            <li className="flex items-center gap-2">
                                <span>✓</span>
                                Everything in Free
                            </li>
                            <li className="flex items-center gap-2">
                                <span>✓</span>
                                Different tips per person
                            </li>
                            <li className="flex items-center gap-2">
                                <span>✓</span>
                                Advanced tax settings
                            </li>
                            <li className="flex items-center gap-2">
                                <span>✓</span>
                                Save calculation history
                            </li>
                            <li className="flex items-center gap-2">
                                <span>✓</span>
                                Export to CSV
                            </li>
                            <li className="flex items-center gap-2">
                                <span>✓</span>
                                No ads
                            </li>
                        </ul>
                        <Link
                            href="/"
                            className="block w-full bg-white text-purple-600 text-center py-3 rounded-lg font-semibold hover:bg-gray-100 transition-all"
                        >
                            Start 7-Day Free Trial
                        </Link>
                        <p className="text-center text-sm opacity-90 mt-2">No credit card required</p>
                    </div>
                </div>
            </section>

            {/* FAQ Section */}
            <section className="max-w-4xl mx-auto px-4 py-16 bg-white">
                <div className="text-center mb-12">
                    <h2 className="text-3xl font-bold text-gray-800 mb-4">
                        Frequently Asked Questions
                    </h2>
                </div>

                <div className="space-y-6">
                    <div className="border border-gray-200 rounded-lg p-6">
                        <h3 className="text-lg font-semibold text-gray-800 mb-2">Is it really free to start?</h3>
                        <p className="text-gray-600">
                            Yes! The basic calculator is completely free forever. You only pay if you need advanced features like different tips per person or calculation history.
                        </p>
                    </div>

                    <div className="border border-gray-200 rounded-lg p-6">
                        <h3 className="text-lg font-semibold text-gray-800 mb-2">Can I use it on my phone?</h3>
                        <p className="text-gray-600">
                            Absolutely! TipMaster works perfectly on all devices - phones, tablets, and computers. You can even add it to your home screen like a native app.
                        </p>
                    </div>

                    <div className="border border-gray-200 rounded-lg p-6">
                        <h3 className="text-lg font-semibold text-gray-800 mb-2">Do you store my calculation data?</h3>
                        <p className="text-gray-600">
                            Your calculations are stored locally on your device. We don't send your bill data to our servers. For Pro users, history is saved in your browser's local storage.
                        </p>
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="max-w-4xl mx-auto px-4 py-16 text-center">
                <h2 className="text-3xl md:text-4xl font-bold text-gray-800 mb-4">
                    Ready to Simplify Group Dining?
                </h2>
                <p className="text-gray-600 mb-8 max-w-2xl mx-auto">
                    Join thousands of users who use TipMaster to make bill splitting fair and stress-free.
                </p>
                <Link
                    href="/"
                    className="inline-block bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-8 py-4 rounded-lg font-semibold text-lg hover:from-blue-700 hover:to-indigo-700 transition-all shadow-lg"
                >
                    🚀 Start Calculating Now
                </Link>
                <p className="text-gray-500 text-sm mt-4">No signup required • Free forever</p>
            </section>

            {/* Footer */}
            <footer className="bg-gray-800 text-white py-8">
                <div className="max-w-6xl mx-auto px-4 text-center">
                    <div className="flex items-center justify-center gap-2 mb-4">
                        <span className="text-2xl">🧮</span>
                        <span className="text-xl font-bold">TipMaster</span>
                    </div>
                    <p className="text-gray-400 mb-4">Making group dining fair and simple since 2024</p>
                    <div className="flex justify-center gap-6 text-sm text-gray-400">
                        <Link href="/" className="hover:text-white transition-colors">App</Link>
                        <a href="#features" className="hover:text-white transition-colors">Features</a>
                        <a href="#pricing" className="hover:text-white transition-colors">Pricing</a>
                        <a href="#" className="hover:text-white transition-colors">Privacy</a>
                        <a href="#" className="hover:text-white transition-colors">Terms</a>
                    </div>
                    <p className="text-gray-500 text-xs mt-6">© 2024 TipMaster. All rights reserved.</p>
                </div>
            </footer>
        </div>
    );
}