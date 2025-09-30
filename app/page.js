// app/page.js
'use client';
import { useState } from 'react';
import { Calculator, DollarSign, Users, Sparkles } from 'lucide-react';

export default function TipCalculator() {
  const [billAmount, setBillAmount] = useState('');
  const [tipPercentage, setTipPercentage] = useState(18);
  const [numberOfPeople, setNumberOfPeople] = useState(1);

  // Calculate totals
  const bill = parseFloat(billAmount) || 0;
  const tipAmount = bill * (tipPercentage / 100);
  const totalAmount = bill + tipAmount;
  const perPerson = totalAmount / numberOfPeople;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8 px-4">
      <div className="max-w-md mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Calculator className="w-8 h-8 text-blue-600" />
            <h1 className="text-3xl font-bold text-gray-800">TipMaster</h1>
          </div>
          <p className="text-gray-600">Smart tip calculator for groups</p>
        </div>

        {/* Calculator Card */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
          {/* Bill Amount */}
          <div className="mb-6">
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
              <DollarSign className="w-4 h-4" />
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

          {/* Tip Percentage */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tip Percentage
            </label>
            <div className="grid grid-cols-4 gap-2">
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
              <Users className="w-4 h-4" />
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

          {/* Results */}
          <div className="bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl p-6 text-white">
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span>Tip Amount:</span>
                <span className="text-xl font-bold">${tipAmount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center text-lg">
                <span>Total per person:</span>
                <span className="text-2xl font-bold">${perPerson.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Premium Features Teaser */}
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="w-5 h-5 text-yellow-500" />
            <h3 className="font-semibold text-gray-800">Premium Features</h3>
          </div>
          <ul className="text-sm text-gray-600 space-y-1">
            <li>• Different tips per person</li>
            <li>• Tax calculations</li>
            <li>• Save calculation history</li>
            <li>• Share results with friends</li>
          </ul>
          <button className="w-full mt-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-3 rounded-lg font-semibold hover:from-blue-700 hover:to-indigo-700 transition-all">
            Upgrade to Premium - $3/month
          </button>
        </div>

        {/* Footer */}
        <div className="text-center mt-6 text-gray-500 text-sm">
          <p>TipMaster - Making group dining easy</p>
        </div>
      </div>
    </div>
  );
}