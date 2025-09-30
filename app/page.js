'use client';
import { useState, useEffect } from 'react';
import StripeProvider from '../components/StripeProvider';
import PaymentModal from '../components/PaymentModal';
import ShareModal from '../components/ShareModal';
import { useSession, signIn } from 'next-auth/react';
import { loadStripe } from '@stripe/stripe-js';

function TipCalculator() {
  // Basic state
  const [billAmount, setBillAmount] = useState('');
  const [tipPercentage, setTipPercentage] = useState(18);
  const [numberOfPeople, setNumberOfPeople] = useState(1);

  // Premium state
  const [advancedMode, setAdvancedMode] = useState(false);
  const [taxPercentage, setTaxPercentage] = useState(8);
  const [isTaxIncluded, setIsTaxIncluded] = useState(false);
  const [individualTips, setIndividualTips] = useState([18]);
  const [calculationHistory, setCalculationHistory] = useState([]);

  // Payment state
  const [isPro, setIsPro] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [user, setUser] = useState(null);

  // Share state
  const [showShareModal, setShowShareModal] = useState(false);
  const [shareUrl, setShareUrl] = useState('');
  const [isCopied, setIsCopied] = useState(false);
  const [errors, setErrors] = useState({});

  // Load user data from localStorage on component mount
  useEffect(() => {
    const savedUser = localStorage.getItem('tipmaster-user');
    const savedHistory = localStorage.getItem('tipmaster-history');

    if (savedUser) {
      const userData = JSON.parse(savedUser);
      setUser(userData);
      setIsPro(userData.isPro || false);
    }

    if (savedHistory) {
      setCalculationHistory(JSON.parse(savedHistory));
    }
  }, []);

  // Validation
  const validateInputs = () => {
    const newErrors = {};

    if (billAmount && (parseFloat(billAmount) <= 0)) {
      newErrors.billAmount = 'Bill amount must be positive';
    }

    if (billAmount && parseFloat(billAmount) > 100000) {
      newErrors.billAmount = 'Bill amount seems too high';
    }

    if (numberOfPeople < 1) {
      newErrors.numberOfPeople = 'Must have at least 1 person';
    }

    if (numberOfPeople > 50) {
      newErrors.numberOfPeople = 'Maximum 50 people';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Calculate totals
  const bill = parseFloat(billAmount) || 0;
  const taxAmount = bill * (taxPercentage / 100);

  // Calculate base amount (without tax if tax is included)
  const baseAmount = isTaxIncluded ? bill - taxAmount : bill;

  // Calculate individual tips if in advanced mode
  let totalTipAmount = 0;
  let perPersonAmounts = [];

  if (advancedMode && individualTips.length === numberOfPeople && isPro) {
    totalTipAmount = individualTips.reduce((sum, tip, index) => {
      const personTip = baseAmount * (tip / 100);
      perPersonAmounts[index] = (baseAmount + taxAmount + personTip) / numberOfPeople;
      return sum + personTip;
    }, 0);
  } else {
    // Standard calculation
    totalTipAmount = baseAmount * (tipPercentage / 100);
    const totalPerPerson = (baseAmount + taxAmount + totalTipAmount) / numberOfPeople;
    perPersonAmounts = Array(numberOfPeople).fill(totalPerPerson);
  }

  const totalAmount = baseAmount + taxAmount + totalTipAmount;

  // Save to history
  const saveToHistory = () => {
    if (!validateInputs()) return;

    if (bill > 0 && isPro) {
      const newCalculation = {
        id: Date.now(),
        bill,
        tip: advancedMode ? 'Variable' : tipPercentage,
        people: numberOfPeople,
        total: totalAmount,
        date: new Date().toLocaleTimeString(),
        advanced: advancedMode
      };

      const newHistory = [newCalculation, ...calculationHistory.slice(0, 9)];
      setCalculationHistory(newHistory);
      localStorage.setItem('tipmaster-history', JSON.stringify(newHistory));
    }
  };

  // Update individual tips when number of people changes
  useEffect(() => {
    if (advancedMode && isPro) {
      setIndividualTips(Array(numberOfPeople).fill(tipPercentage));
    }
  }, [numberOfPeople, advancedMode, tipPercentage, isPro]);

  // Handle payment success
  const handlePaymentSuccess = () => {
    const userData = {
      id: Date.now(),
      email: 'user@example.com',
      isPro: true,
      joined: new Date().toISOString(),
      subscription: 'monthly'
    };

    setUser(userData);
    setIsPro(true);
    localStorage.setItem('tipmaster-user', JSON.stringify(userData));

    // Enable advanced mode after payment
    setAdvancedMode(true);
  };

  // Share functionality
  const generateShareableLink = () => {
    const calculationData = {
      bill: bill,
      tip: advancedMode ? 'Variable' : tipPercentage,
      people: numberOfPeople,
      total: totalAmount,
      perPerson: perPersonAmounts[0]?.toFixed(2)
    };

    const text = `💰 TipMaster Calculation: $${bill.toFixed(2)} bill • ${numberOfPeople} people • $${perPersonAmounts[0]?.toFixed(2)} each\n\nCalculate yours at: ${window.location.href}`;
    return text;
  };

  const handleShare = async () => {
    if (!validateInputs() || bill <= 0) {
      setErrors({ billAmount: 'Please enter a valid bill amount first' });
      return;
    }

    const shareText = generateShareableLink();

    // Try native share API first
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'TipMaster Calculation',
          text: shareText,
          url: window.location.href,
        });
        return;
      } catch (err) {
        console.log('Native share cancelled or failed');
      }
    }

    // Fallback: copy to clipboard
    try {
      await navigator.clipboard.writeText(shareText);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    } catch (err) {
      // Final fallback: show modal
      setShareUrl(shareText);
      setShowShareModal(true);
    }
  };

  const exportToCSV = () => {
    if (calculationHistory.length === 0) return;

    const headers = ['Date', 'Bill Amount', 'Tip %', 'People', 'Total', 'Advanced'];
    const csvData = calculationHistory.map(calc => [
      calc.date,
      calc.bill.toFixed(2),
      calc.tip,
      calc.people,
      calc.total.toFixed(2),
      calc.advanced ? 'Yes' : 'No'
    ]);

    const csvContent = [
      headers.join(','),
      ...csvData.map(row => row.join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `tipmaster-history-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Handle input changes with validation
  const handleBillAmountChange = (value) => {
    setBillAmount(value);
    // Clear error when user starts typing
    if (errors.billAmount) {
      setErrors(prev => ({ ...prev, billAmount: '' }));
    }
  };

  const handleRealPayment = async (priceId) => {
    try {
      // Ensure user is authenticated
      if (!session) {
        setShowAuthModal(true);
        return;
      }

      // Create checkout session
      const response = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          priceId: priceId,
          userId: session.user.id,
          userEmail: session.user.email,
        }),
      });

      const { sessionId } = await response.json();

      // Redirect to Stripe Checkout
      const stripe = await loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY);
      const { error } = await stripe.redirectToCheckout({ sessionId });

      if (error) {
        console.error('Stripe redirect error:', error);
      }
    } catch (error) {
      console.error('Payment error:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8 px-4">
      <div className="max-w-md mx-auto">
        {/* Header with User Status */}

        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-2">
            <span className="text-3xl">🧮</span>
            <h1 className="text-3xl font-bold text-gray-800">TipMaster</h1>
            {isPro && (
              <span className="bg-yellow-500 text-white text-xs px-2 py-1 rounded-full">PRO</span>
            )}
          </div>
          <p className="text-gray-600">
            {isPro ? 'Premium tip calculator for groups' : 'Smart tip calculator for groups'}
          </p>

          {/* Add marketing link */}
          <a
            href="/marketing"
            className="inline-block mt-2 text-sm text-blue-600 hover:text-blue-700"
          >
            🏠 Back to Homepage
          </a>
        </div>

        {/* Advanced Mode Toggle - Gated */}
        <div
          className={`rounded-2xl shadow-lg p-4 mb-4 cursor-pointer transition-all ${isPro ? 'bg-white hover:shadow-xl' : 'bg-gray-100 opacity-75'
            }`}
          onClick={() => {
            if (!isPro) {
              setShowPaymentModal(true);
              return;
            }
            setAdvancedMode(!advancedMode);
          }}
        >
          <div className="flex items-center justify-between">
            <span className="font-medium text-gray-700">
              Advanced Mode {!isPro && '🔒'}
            </span>
            <div className="flex items-center gap-3">
              {!isPro && (
                <span className="text-xs bg-blue-500 text-white px-2 py-1 rounded">PRO</span>
              )}
              <button
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${advancedMode && isPro ? 'bg-blue-600' : 'bg-gray-300'
                  } ${!isPro ? 'cursor-not-allowed' : ''}`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${advancedMode && isPro ? 'translate-x-6' : 'translate-x-1'
                    }`}
                />
              </button>
            </div>
          </div>
          {advancedMode && isPro && (
            <p className="text-xs text-green-600 mt-2">
              💎 Premium features activated! Different tips per person enabled.
            </p>
          )}
          {!isPro && (
            <p className="text-xs text-gray-600 mt-2">
              Upgrade to Pro to unlock advanced features
            </p>
          )}
        </div>

        {/* Calculator Card */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
          {/* Bill Amount */}
          <div className="mb-6">
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
              <span>💰</span>
              Bill Amount
            </label>
            <input
              type="number"
              value={billAmount}
              onChange={(e) => handleBillAmountChange(e.target.value)}
              placeholder="0.00"
              className={`w-full p-3 border rounded-lg text-2xl font-bold text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.billAmount ? 'border-red-300 bg-red-50' : 'border-gray-300'
                }`}
            />
            {errors.billAmount && (
              <p className="text-red-600 text-xs mt-1">{errors.billAmount}</p>
            )}
          </div>

          {/* Tax Settings - Gated */}
          <div
            className={`mb-6 p-4 rounded-lg transition-all ${isPro ? 'bg-white' : 'bg-gray-50 opacity-75'
              }`}
            onClick={() => !isPro && setShowPaymentModal(true)}
          >
            <div className="flex items-center gap-2 mb-2">
              <span>🏷️</span>
              <span className="text-sm font-medium text-gray-700">
                Tax Settings {!isPro && '🔒'}
              </span>
              {!isPro && (
                <span className="text-xs bg-blue-500 text-white px-2 py-1 rounded ml-auto">PRO</span>
              )}
            </div>

            {isPro ? (
              <>
                <div className="flex gap-2 mb-2">
                  <input
                    type="range"
                    min="0"
                    max="20"
                    value={taxPercentage}
                    onChange={(e) => setTaxPercentage(parseInt(e.target.value))}
                    className="flex-1"
                  />
                  <span className="text-sm font-medium w-12">{taxPercentage}%</span>
                </div>
                <label className="flex items-center gap-2 text-sm text-gray-600">
                  <input
                    type="checkbox"
                    checked={isTaxIncluded}
                    onChange={(e) => setIsTaxIncluded(e.target.checked)}
                    className="rounded"
                  />
                  Tax included in bill amount
                </label>
              </>
            ) : (
              <p className="text-xs text-gray-600">
                Upgrade to Pro to customize tax settings
              </p>
            )}
          </div>

          {/* Tip Percentage */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {advancedMode && isPro ? 'Default Tip Percentage' : 'Tip Percentage'}
            </label>
            <div className="grid grid-cols-4 gap-2 mb-2">
              {[15, 18, 20, 25].map((percent) => (
                <button
                  key={percent}
                  onClick={() => setTipPercentage(percent)}
                  className={`p-3 rounded-lg font-medium transition-all ${tipPercentage === percent
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                >
                  {percent}%
                </button>
              ))}
            </div>
            <div className="mt-2">
              <input
                type="range"
                min="0"
                max="30"
                value={tipPercentage}
                onChange={(e) => setTipPercentage(parseInt(e.target.value))}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
              />
              <div className="flex justify-between text-xs text-gray-500">
                <span>0%</span>
                <span>Custom: {tipPercentage}%</span>
                <span>30%</span>
              </div>
            </div>
          </div>

          {/* Number of People */}
          <div className="mb-6">
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
              <span>👥</span>
              Split Between
            </label>
            <div className="flex items-center gap-4">
              <button
                onClick={() => setNumberOfPeople(Math.max(1, numberOfPeople - 1))}
                className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center text-gray-600 hover:bg-gray-200"
              >
                -
              </button>
              <span className="text-2xl font-bold text-gray-800">{numberOfPeople} {numberOfPeople === 1 ? 'person' : 'people'}</span>
              <button
                onClick={() => setNumberOfPeople(numberOfPeople + 1)}
                className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center text-gray-600 hover:bg-gray-200"
              >
                +
              </button>
            </div>
            {errors.numberOfPeople && (
              <p className="text-red-600 text-xs mt-1 text-center">{errors.numberOfPeople}</p>
            )}
          </div>

          {/* Individual Tips (Premium Feature) - Gated */}
          {advancedMode && numberOfPeople > 1 && isPro && (
            <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-3">
                <span>🎯</span>
                Individual Tips (%)
              </label>
              <div className="grid gap-2">
                {individualTips.map((tip, index) => (
                  <div key={index} className="flex items-center gap-3">
                    <span className="text-sm font-medium w-16">Person {index + 1}:</span>
                    <input
                      type="range"
                      min="0"
                      max="30"
                      value={tip}
                      onChange={(e) => {
                        const newTips = [...individualTips];
                        newTips[index] = parseInt(e.target.value);
                        setIndividualTips(newTips);
                      }}
                      className="flex-1"
                    />
                    <span className="text-sm font-medium w-12">{tip}%</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Results */}
          <div className="bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl p-6 text-white mb-4">
            <div className="space-y-3">
              {isPro && (
                <div className="flex justify-between items-center">
                  <span>Tax Amount:</span>
                  <span className="font-bold">${taxAmount.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between items-center">
                <span>Tip Amount:</span>
                <span className="font-bold">${totalTipAmount.toFixed(2)}</span>
              </div>
              <div className="border-t border-white/20 pt-2">
                <div className="flex justify-between items-center text-lg">
                  <span>Total per person:</span>
                  <span className="text-2xl font-bold">${perPersonAmounts[0]?.toFixed(2) || '0.00'}</span>
                </div>
              </div>
            </div>

            {/* Share Button */}
            <button
              onClick={handleShare}
              disabled={bill <= 0 || !validateInputs()}
              className="w-full mt-4 bg-white text-blue-600 py-3 rounded-lg font-semibold hover:bg-gray-100 disabled:bg-gray-300 disabled:text-gray-500 disabled:cursor-not-allowed transition-all"
            >
              {isCopied ? '✅ Copied!' : '📤 Share Calculation'}
            </button>
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={saveToHistory}
              disabled={bill <= 0 || !isPro}
              className={`py-3 rounded-lg font-semibold transition-all ${isPro
                ? 'bg-green-500 text-white hover:bg-green-600 disabled:bg-gray-300 disabled:cursor-not-allowed'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
            >
              {isPro ? '💾 Save' : '🔒 Save'}
            </button>

            <button
              onClick={exportToCSV}
              disabled={calculationHistory.length === 0 || !isPro}
              className="bg-purple-500 text-white py-3 rounded-lg font-semibold hover:bg-purple-600 disabled:bg-gray-300 disabled:text-gray-500 disabled:cursor-not-allowed transition-all"
            >
              📊 Export
            </button>
          </div>
        </div>

        {/* Calculation History - Gated */}
        {isPro && calculationHistory.length > 0 && (
          <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-gray-800 flex items-center gap-2">
                <span>📊</span>
                Recent Calculations ({calculationHistory.length})
              </h3>
              {calculationHistory.length > 0 && (
                <button
                  onClick={() => {
                    setCalculationHistory([]);
                    localStorage.removeItem('tipmaster-history');
                  }}
                  className="text-xs text-red-600 hover:text-red-700"
                >
                  Clear All
                </button>
              )}
            </div>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {calculationHistory.map((calc) => (
                <div key={calc.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                  <div>
                    <div className="font-medium">${calc.bill.toFixed(2)}</div>
                    <div className="text-xs text-gray-500">
                      {calc.people} {calc.people === 1 ? 'person' : 'people'} • {calc.date}
                      {calc.advanced && <span className="text-blue-600 ml-1">• Advanced</span>}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-green-600">${calc.total.toFixed(2)}</div>
                    <div className="text-xs text-gray-500">{calc.tip}% tip</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Upgrade Card */}
        {!isPro ? (
          <div className="bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl shadow-lg p-6 text-white mb-6">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-xl">💎</span>
              <h3 className="font-semibold">TipMaster Pro</h3>
            </div>
            <ul className="text-sm space-y-2 mb-4">
              <li className="flex items-center gap-2">✅ Different tips per person</li>
              <li className="flex items-center gap-2">✅ Tax calculations</li>
              <li className="flex items-center gap-2">✅ Save calculation history</li>
              <li className="flex items-center gap-2">✅ Export to CSV</li>
              <li className="flex items-center gap-2">✅ Share calculations</li>
              <li className="flex items-center gap-2">✅ No ads</li>
            </ul>
            <button
              onClick={() => setShowPaymentModal(true)}
              className="w-full bg-white text-purple-600 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-all"
            >
              Upgrade to Pro - $3/month
            </button>
            <p className="text-xs text-center mt-2 text-white/80">Try premium features FREE for 7 days</p>
          </div>
        ) : (
          <div className="bg-green-50 rounded-2xl shadow-lg p-6 border border-green-200">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xl">🎉</span>
              <h3 className="font-semibold text-green-800">You&apos;re a Pro Member!</h3>
            </div>
            <p className="text-sm text-green-600">Thank you for supporting TipMaster. Enjoy all premium features.</p>
            <div className="mt-3 text-xs text-green-500">
              Member since: {user?.joined ? new Date(user.joined).toLocaleDateString() : 'Recently'}
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="text-center mt-6 text-gray-500 text-sm">
          <p>TipMaster {isPro ? 'Pro' : ''} - Making group dining easy 💫</p>
          <p className="text-xs mt-1">Share with friends and split bills fairly!</p>
        </div>
      </div>

      {/* Payment Modal */}
      <PaymentModal
        isOpen={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        onSuccess={handlePaymentSuccess}
      />

      {/* Share Modal */}
      <ShareModal
        isOpen={showShareModal}
        onClose={() => setShowShareModal(false)}
        shareText={shareUrl}
      />
    </div>
  );
}

// Wrap the main component with Stripe Provider
export default function Page() {
  return (
    <StripeProvider>
      <TipCalculator />
    </StripeProvider>
  );
}