'use client';

import { useState } from 'react';

export default function QualifyingQuestions({ onComplete }) {
  const [step, setStep] = useState(1);
  const [answers, setAnswers] = useState({});

  const handleAnswer = (key, value) => {
    const newAnswers = { ...answers, [key]: value };
    setAnswers(newAnswers);

    // Auto-advance logic
    if (key === 'hasAssets' && value === false) {
      onComplete({ needsProbate: false, reason: 'no_assets' });
      return;
    }
    
    if (key === 'assetValue' && value === 'under_100k') {
      setStep(3);
    } else if (key === 'assetValue' && value === 'over_100k') {
      setStep(4);
    } else if (key === 'hasRealProperty' && step === 3) {
      if (value === false) {
        setStep(5);
      } else {
        onComplete({ 
          needsProbate: true, 
          path: 'full_probate',
          reason: 'real_property_over_threshold'
        });
      }
    } else if (key === 'timeframe' && step === 5) {
      if (value === 'over_30_days') {
        onComplete({ 
          needsProbate: true, 
          path: 'small_estate',
          reason: 'small_estate_eligible'
        });
      } else {
        onComplete({ 
          needsProbate: true, 
          path: 'wait_or_full_probate',
          reason: 'too_early_for_small_estate'
        });
      }
    } else if (step < 4) {
      setStep(step + 1);
    }
  };

  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-semibold text-gray-900">
              Let's determine if you need probate
            </h2>
            <p className="text-gray-600">
              Did the person who died own any assets in their name alone?
            </p>
            <p className="text-sm text-gray-500">
              This includes bank accounts, investments, real estate, or personal property 
              that was not jointly owned or had no named beneficiary.
            </p>
            <div className="space-y-3">
              <button
                onClick={() => handleAnswer('hasAssets', true)}
                className="w-full p-4 text-left border border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50"
              >
                <div className="font-medium text-gray-900">Yes, they owned assets in their name alone</div>
              </button>
              <button
                onClick={() => handleAnswer('hasAssets', false)}
                className="w-full p-4 text-left border border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50"
              >
                <div className="font-medium text-gray-900">No, all assets were jointly owned or had beneficiaries</div>
              </button>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-semibold text-gray-900">
              What's the total value of probate assets?
            </h2>
            <p className="text-gray-600">
              Count only assets that were in the deceased person's name alone.
            </p>
            <div className="space-y-3">
              <button
                onClick={() => handleAnswer('assetValue', 'under_100k')}
                className="w-full p-4 text-left border border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50"
              >
                <div className="font-medium text-gray-900">Less than $100,000</div>
                <div className="text-sm text-gray-500">You may qualify for a simplified process</div>
              </button>
              <button
                onClick={() => handleAnswer('assetValue', 'over_100k')}
                className="w-full p-4 text-left border border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50"
              >
                <div className="font-medium text-gray-900">$100,000 or more</div>
                <div className="text-sm text-gray-500">Full probate process required</div>
              </button>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-semibold text-gray-900">
              Did they own real estate?
            </h2>
            <p className="text-gray-600">
              Real estate in their name alone requires full probate, regardless of value.
            </p>
            <div className="space-y-3">
              <button
                onClick={() => handleAnswer('hasRealProperty', true)}
                className="w-full p-4 text-left border border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50"
              >
                <div className="font-medium text-gray-900">Yes, they owned real estate</div>
              </button>
              <button
                onClick={() => handleAnswer('hasRealProperty', false)}
                className="w-full p-4 text-left border border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50"
              >
                <div className="font-medium text-gray-900">No real estate</div>
              </button>
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-6">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h2 className="text-xl font-semibold text-blue-900">
                Full probate required
              </h2>
              <p className="text-blue-700 mt-2">
                With assets over $100,000, you'll need to go through the full probate process in Utah.
              </p>
            </div>
            <button
              onClick={() => onComplete({ 
                needsProbate: true, 
                path: 'full_probate',
                reason: 'over_threshold'
              })}
              className="w-full bg-blue-600 text-white p-4 rounded-lg hover:bg-blue-700"
            >
              Continue to Full Probate Process
            </button>
          </div>
        );

      case 5:
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-semibold text-gray-900">
              When did they pass away?
            </h2>
            <p className="text-gray-600">
              Small estate affidavit requires waiting at least 30 days after death.
            </p>
            <div className="space-y-3">
              <button
                onClick={() => handleAnswer('timeframe', 'over_30_days')}
                className="w-full p-4 text-left border border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50"
              >
                <div className="font-medium">More than 30 days ago</div>
                <div className="text-sm text-gray-500">You can use the small estate process</div>
              </button>
              <button
                onClick={() => handleAnswer('timeframe', 'under_30_days')}
                className="w-full p-4 text-left border border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50"
              >
                <div className="font-medium">Less than 30 days ago</div>
                <div className="text-sm text-gray-500">You'll need to wait or use full probate</div>
              </button>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      <div className="mb-8">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-medium text-blue-600">Utah Probate Qualifier</span>
          <span className="text-sm text-gray-500">Step {step} of 5</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className="bg-blue-600 h-2 rounded-full transition-all"
            style={{ width: `${(step / 5) * 100}%` }}
          ></div>
        </div>
      </div>
      {renderStep()}
    </div>
  );
}