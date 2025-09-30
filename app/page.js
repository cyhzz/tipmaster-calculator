// app/page.js - ENHANCED VERSION WITH PREMIUM FEATURES
'use client';
import { useState, useEffect } from 'react';

export default function TipCalculator() {
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

  // Load history from localStorage on component mount
  useEffect(() => {
    const saved = localStorage.getItem('tipmaster-history');
    if (saved) {
      setCalculationHistory(JSON.parse(saved));
    }
  }, []);

  // Calculate totals
  const bill = parseFloat(billAmount) || 0;
  const taxAmount = bill * (taxPercentage / 100);

  // Calculate base amount (without tax if tax is included)
  const baseAmount = isTaxIncluded ? bill - taxAmount : bill;

  // Calculate individual tips if in advanced mode
  let totalTipAmount = 0;
  let perPersonAmounts = [];

  if (advancedMode && individualTips.length === numberOfPeople) {
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
    if (bill > 0) {
      const newCalculation = {
        id: Date.now(),
        bill,
        tip: advancedMode ? 'Variable' : tipPercentage,
        people: numberOfPeople,
        total: totalAmount,
        date: new Date().toLocaleTimeString(),
        advanced: advancedMode
      };

      const newHistory = [newCalculation, ...calculationHistory.slice(0, 9)]; // Keep last 10
      setCalculationHistory(newHistory);
      localStorage.setItem('tipmaster-history', JSON.stringify(newHistory));
    }
  };

  // Update individual tips when number of people changes
  useEffect(() => {
    if (advancedMode) {
      setIndividualTips(Array(numberOfPeople).fill(tipPercentage));
    }
  }, [numberOfPeople, advancedMode, tipPercentage]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8 px-4">
      <div className="max-w-md mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-2">
            <span className="text-3xl">🧮</span>
            <h1 className="text-3xl font-bold text-gray-800">TipMaster</h1>
            <span className="bg-yellow-500 text-white text-xs px-2 py-1 rounded-full">PRO</span>
          </div>
          <p className="text-gray-600">Smart tip calculator for groups</p>
        </div>

        {/* Advanced Mode Toggle */}
        <div className="bg-white rounded-2xl shadow-lg p-4 mb-4">
          <div className="flex items-center justify-between">
            <span className="font-medium text-gray-700">Advanced Mode</span>
            <button
              onClick={() => setAdvancedMode(!advancedMode)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${advancedMode ? 'bg-blue-600' : 'bg-gray-300'
                }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${advancedMode ? 'translate-x-6' : 'translate-x-1'
                  }`}
              />
            </button>
          </div>
          {advancedMode && (
            <p className="text-xs text-green-600 mt-2">
              💎 Premium features activated! Different tips per person enabled.
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
              onChange={(e) => setBillAmount(e.target.value)}
              placeholder="0.00"
              className="w-full p-3 border border-gray-300 rounded-lg text-2xl font-bold text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Tax Settings */}
          <div className="mb-6">
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
              <span>🏷️</span>
              Tax ({taxPercentage}%)
            </label>
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
          </div>

          {/* Tip Percentage */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {advancedMode ? 'Default Tip Percentage' : 'Tip Percentage'}
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
          </div>

          {/* Individual Tips (Premium Feature) */}
          {advancedMode && numberOfPeople > 1 && (
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
              <div className="flex justify-between items-center">
                <span>Tax Amount:</span>
                <span className="font-bold">${taxAmount.toFixed(2)}</span>
              </div>
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
          </div>

          {/* Save Button */}
          <button
            onClick={saveToHistory}
            disabled={bill <= 0}
            className="w-full bg-green-500 text-white py-3 rounded-lg font-semibold hover:bg-green-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-all"
          >
            💾 Save Calculation
          </button>
        </div>

        {/* Calculation History */}
        {calculationHistory.length > 0 && (
          <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
            <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
              <span>📊</span>
              Recent Calculations
            </h3>
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

        {/* Premium Features Teaser */}
        <div className="bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl shadow-lg p-6 text-white">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-xl">💎</span>
            <h3 className="font-semibold">TipMaster Pro</h3>
          </div>
          <ul className="text-sm space-y-2 mb-4">
            <li className="flex items-center gap-2">✅ Different tips per person</li>
            <li className="flex items-center gap-2">✅ Tax calculations</li>
            <li className="flex items-center gap-2">✅ Save calculation history</li>
            <li className="flex items-center gap-2">✅ Export results</li>
            <li className="flex items-center gap-2">✅ No ads</li>
          </ul>
          <button className="w-full bg-white text-purple-600 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-all">
            Upgrade to Pro - $3/month
          </button>
          <p className="text-xs text-center mt-2 text-white/80">Try premium features FREE for 7 days</p>
        </div>

        {/* Footer */}
        <div className="text-center mt-6 text-gray-500 text-sm">
          <p>TipMaster Pro - Making group dining easy 💫</p>
        </div>
      </div>
    </div>
  );
}