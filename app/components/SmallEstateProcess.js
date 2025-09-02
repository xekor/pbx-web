'use client';

import { useState } from 'react';
import DocumentChecklist from './DocumentChecklist';
import AINameAssistant from './AINameAssistant';

export default function SmallEstateProcess() {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    // Affiant information (who's swearing)
    affiantFullName: '',
    affiantAddressLine1: '',
    affiantAddressCity: '',
    affiantAddressState: 'UT',
    affiantAddressZip: '',
    affiantPhone: '',
    affiantEmail: '',
    affiantCapacity: 'successor', // "successor" | "agent_of_successor"
    successorName: '', // required if agent_of_successor
    
    // Decedent & timing
    decedentFullName: '',
    decedentDodIso: '',
    deathMonth: '',
    deathDay: '',
    deathYear: '',
    elapsed30DaysBool: false,
    
    // Estate value & PR status
    estateValueNetOfLiensUsd: 0,
    noPrPendingOrGrantedBool: false,
    successorEntitledBool: false,
    
    // Property to be collected
    assetRows: [{
      holderName: '',
      assetDescription: '',
      last4Account: '',
      valueUsd: ''
    }],
    
    // Legacy fields for compatibility
    domicileCounty: '',
    socialSecurityNumber: ''
  });

  const updateFormData = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const updateDateOfDeath = (month, day, year) => {
    if (month && day && year) {
      const dateString = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
      updateFormData('decedentDodIso', dateString);
      updateFormData('elapsed30DaysBool', isAtLeast30DaysAgo(dateString));
    } else {
      updateFormData('decedentDodIso', '');
      updateFormData('elapsed30DaysBool', false);
    }
  };

  const isAtLeast30DaysAgo = (dateString) => {
    const deathDate = new Date(dateString);
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    return deathDate <= thirtyDaysAgo;
  };

  const addAsset = () => {
    setFormData(prev => ({
      ...prev,
      assetRows: [...prev.assetRows, { holderName: '', assetDescription: '', last4Account: '', valueUsd: '' }]
    }));
  };

  const updateAsset = (index, field, value) => {
    setFormData(prev => ({
      ...prev,
      assetRows: prev.assetRows.map((asset, i) => 
        i === index ? { ...asset, [field]: value } : asset
      )
    }));
    
    // Update total estate value
    if (field === 'valueUsd') {
      updateTotalEstateValue();
    }
  };

  const removeAsset = (index) => {
    setFormData(prev => ({
      ...prev,
      assetRows: prev.assetRows.filter((_, i) => i !== index)
    }));
    updateTotalEstateValue();
  };

  const updateTotalEstateValue = () => {
    setTimeout(() => {
      const total = formData.assetRows.reduce((sum, asset) => {
        const value = parseFloat(asset.valueUsd) || 0;
        return sum + value;
      }, 0);
      updateFormData('estateValueNetOfLiensUsd', total);
    }, 0);
  };

  const totalAssetValue = formData.assetRows.reduce((sum, asset) => {
    const value = parseFloat(asset.valueUsd) || 0;
    return sum + value;
  }, 0);

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return renderDecedentName();
      case 2:
        return renderDeathInfo();
      case 3:
        return renderAssetInventory();
      case 4:
        return renderAdditionalDetails();
      case 5:
        return renderApplicantInfo();
      case 6:
        return renderAffidavitStatements();
      case 7:
        return renderReviewAndSubmit();
      case 8:
        return <DocumentChecklist formData={formData} onComplete={() => setCurrentStep(7)} />;
      default:
        return renderDecedentName();
    }
  };

  const renderDecedentName = () => (
    <div className="space-y-6">
      <h2 className="text-2xl font-semibold text-gray-900">
        Deceased Person's Name
      </h2>
      <p className="text-gray-600">
        Enter the full legal name as it appears on official documents.
      </p>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Full Legal Name *
        </label>
        <input
          type="text"
          value={formData.decedentFullName}
          onChange={(e) => {
            let value = e.target.value.replace(/[^a-zA-Z\s\-']/g, '').slice(0, 40);
            // Capitalize first letter of each word in real time
            value = value.split(' ').map(word => {
              if (word.length === 0) return word;
              return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
            }).join(' ');
            updateFormData('decedentFullName', value);
          }}
          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-lg"
          placeholder="John Doe"
          maxLength="40"
          required
        />
      </div>

      <AINameAssistant
        onExtract={(name) => {
          // Fill the field; user can review and click Next
          updateFormData('decedentFullName', name);
        }}
      />
    </div>
  );

  const renderDeathInfo = () => (
    <div className="space-y-6">
      <h2 className="text-2xl font-semibold text-gray-900">
        Death Information
      </h2>
      <p className="text-gray-600">
        Provide the date of death and county where {formData.decedentFullName || 'the deceased'} was domiciled.
      </p>
      {formData.decedentDodIso && (
        <div className={`p-3 rounded-lg border ${formData.elapsed30DaysBool ? 'bg-green-50 border-green-200' : 'bg-yellow-50 border-yellow-200'}`}>
          <p className={`text-sm ${formData.elapsed30DaysBool ? 'text-green-700' : 'text-yellow-700'}`}>
            {formData.elapsed30DaysBool 
              ? '✓ More than 30 days have passed - you can proceed with small estate affidavit'
              : '⚠️ Less than 30 days have passed since death - you may need to wait or use full probate'
            }
          </p>
        </div>
      )}
      
      <div className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Date of Death *
          </label>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <select
                value={formData.deathMonth || ''}
                onChange={(e) => {
                  updateFormData('deathMonth', e.target.value);
                  updateDateOfDeath(e.target.value, formData.deathDay, formData.deathYear);
                }}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              >
                <option value="">Month</option>
                <option value="01">January</option>
                <option value="02">February</option>
                <option value="03">March</option>
                <option value="04">April</option>
                <option value="05">May</option>
                <option value="06">June</option>
                <option value="07">July</option>
                <option value="08">August</option>
                <option value="09">September</option>
                <option value="10">October</option>
                <option value="11">November</option>
                <option value="12">December</option>
              </select>
            </div>
            
            <div>
              <select
                value={formData.deathDay || ''}
                onChange={(e) => {
                  updateFormData('deathDay', e.target.value);
                  updateDateOfDeath(formData.deathMonth, e.target.value, formData.deathYear);
                }}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              >
                <option value="">Day</option>
                {Array.from({ length: 31 }, (_, i) => i + 1).map(day => (
                  <option key={day} value={day.toString().padStart(2, '0')}>
                    {day}
                  </option>
                ))}
              </select>
            </div>
            
            <div>
              <select
                value={formData.deathYear || ''}
                onChange={(e) => {
                  updateFormData('deathYear', e.target.value);
                  updateDateOfDeath(formData.deathMonth, formData.deathDay, e.target.value);
                }}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              >
                <option value="">Year</option>
                {Array.from({ length: new Date().getFullYear() - 1899 }, (_, i) => new Date().getFullYear() - i).map(year => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            County of Domicile at Death *
          </label>
          <select
            value={formData.domicileCounty}
            onChange={(e) => updateFormData('domicileCounty', e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            required
          >
            <option value="">Select County</option>
            <option value="Salt Lake">Salt Lake</option>
            <option value="Utah">Utah</option>
            <option value="Davis">Davis</option>
            <option value="Weber">Weber</option>
            <option value="Washington">Washington</option>
            <option value="Cache">Cache</option>
            <option value="Box Elder">Box Elder</option>
            <option value="Tooele">Tooele</option>
            <option value="Iron">Iron</option>
            <option value="Sanpete">Sanpete</option>
            <option value="Sevier">Sevier</option>
            <option value="Juab">Juab</option>
            <option value="Millard">Millard</option>
            <option value="Beaver">Beaver</option>
            <option value="Wayne">Wayne</option>
            <option value="Garfield">Garfield</option>
            <option value="Kane">Kane</option>
            <option value="San Juan">San Juan</option>
            <option value="Grand">Grand</option>
            <option value="Emery">Emery</option>
            <option value="Carbon">Carbon</option>
            <option value="Duchesne">Duchesne</option>
            <option value="Uintah">Uintah</option>
            <option value="Wasatch">Wasatch</option>
            <option value="Summit">Summit</option>
            <option value="Morgan">Morgan</option>
            <option value="Rich">Rich</option>
            <option value="Piute">Piute</option>
            <option value="Daggett">Daggett</option>
          </select>
        </div>
      </div>
    </div>
  );

  const renderAdditionalDetails = () => (
    <div className="space-y-6">
      <h2 className="text-2xl font-semibold text-gray-900">
        Additional Information
      </h2>
      <p className="text-gray-600">
        The Social Security Number is optional but can help with asset identification.
      </p>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Social Security Number (Optional)
        </label>
        <input
          type="text"
          value={formData.socialSecurityNumber}
          onChange={(e) => {
            // Format SSN as XXX-XX-XXXX
            let value = e.target.value.replace(/\D/g, '').slice(0, 9);
            if (value.length >= 5) {
              value = value.slice(0, 3) + '-' + value.slice(3, 5) + '-' + value.slice(5);
            } else if (value.length >= 3) {
              value = value.slice(0, 3) + '-' + value.slice(3);
            }
            updateFormData('socialSecurityNumber', value);
          }}
          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          placeholder="XXX-XX-XXXX"
          maxLength="11"
        />
      </div>
    </div>
  );

  const renderAssetInventory = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-semibold text-gray-900">
          Asset Inventory
        </h2>
        <div className="text-sm text-gray-600">
          Total Value: <span className="font-medium text-green-600">${totalAssetValue.toLocaleString()}</span>
        </div>
      </div>
      
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-blue-700 text-sm">
          List only assets that were owned by the deceased person alone (not jointly owned) 
          and do not have named beneficiaries. Total must be under $100,000.
        </p>
      </div>

      {formData.decedentDodIso && (
        <div className={`p-3 rounded-lg border ${formData.elapsed30DaysBool ? 'bg-green-50 border-green-200' : 'bg-yellow-50 border-yellow-200'}`}>
          <p className={`text-sm ${formData.elapsed30DaysBool ? 'text-green-700' : 'text-yellow-700'}`}>
            <strong>30-Day Requirement:</strong> {formData.elapsed30DaysBool 
              ? '✓ More than 30 days have passed since death - you can proceed with small estate affidavit'
              : '⚠️ Less than 30 days have passed since death - you may need to wait or use full probate'
            }
          </p>
        </div>
      )}

      <div className="space-y-4">
        {formData.assetRows.map((asset, index) => (
          <div key={index} className="border border-gray-200 rounded-lg p-4">
            <div className="flex justify-between items-start mb-4">
              <h3 className="font-medium text-gray-900">Asset {index + 1}</h3>
              {formData.assetRows.length > 1 && (
                <button
                  onClick={() => removeAsset(index)}
                  className="text-red-600 hover:text-red-700 text-sm"
                >
                  Remove
                </button>
              )}
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Holder/Institution Name *
                </label>
                <input
                  type="text"
                  value={asset.holderName}
                  onChange={(e) => updateAsset(index, 'holderName', e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="e.g., Wells Fargo Bank"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Asset Description *
                </label>
                <input
                  type="text"
                  value={asset.assetDescription}
                  onChange={(e) => updateAsset(index, 'assetDescription', e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="e.g., Checking Account"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Last 4 Digits of Account (Optional)
                </label>
                <input
                  type="text"
                  value={asset.last4Account}
                  onChange={(e) => {
                    const value = e.target.value.replace(/\D/g, '').slice(0, 4);
                    updateAsset(index, 'last4Account', value);
                  }}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="1234"
                  maxLength="4"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Value ($) *
                </label>
                <input
                  type="text"
                  value={asset.valueUsd ? `$${parseFloat(asset.valueUsd).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}` : ''}
                  onChange={(e) => {
                    let value = e.target.value.replace(/[$,]/g, '');
                    if (value === '' || (!isNaN(value) && parseFloat(value) >= 0)) {
                      updateAsset(index, 'valueUsd', value);
                    }
                  }}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="$0"
                  required
                />
              </div>
            </div>
          </div>
        ))}
      </div>

      <button
        onClick={addAsset}
        className="w-full p-3 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-blue-500 hover:text-blue-600"
      >
        + Add Another Asset
      </button>

      {(totalAssetValue >= 100000 || (formData.decedentDodIso && !formData.elapsed30DaysBool)) && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="text-red-700 text-sm space-y-1">
            {totalAssetValue >= 100000 && (
              <p>⚠️ Total asset value exceeds $100,000. Small Estate Affidavit is not available.</p>
            )}
            {formData.decedentDodIso && !formData.elapsed30DaysBool && (
              <p>⚠️ Less than 30 days have passed since death. You must wait or use full probate.</p>
            )}
            <p className="font-medium mt-2">You will need to use the full probate process.</p>
          </div>
        </div>
      )}

      {totalAssetValue > 0 && totalAssetValue < 100000 && formData.elapsed30DaysBool && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <p className="text-green-700 text-sm">
            ✓ You qualify for the Small Estate Affidavit process!
          </p>
        </div>
      )}
    </div>
  );

  const renderApplicantInfo = () => (
    <div className="space-y-6">
      <h2 className="text-2xl font-semibold text-gray-900">
        Your Information (Affiant)
      </h2>
      <p className="text-gray-600">
        You are the person making this sworn statement to collect the assets.
      </p>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Your Full Legal Name *
          </label>
          <input
            type="text"
            value={formData.affiantFullName}
            onChange={(e) => {
              let value = e.target.value.replace(/[^a-zA-Z\s\-']/g, '').slice(0, 40);
              // Capitalize first letter of each word in real time
              value = value.split(' ').map(word => {
                if (word.length === 0) return word;
                return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
              }).join(' ');
              updateFormData('affiantFullName', value);
            }}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            maxLength="40"
            required
          />
        </div>

        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Street Address *
          </label>
          <input
            type="text"
            value={formData.affiantAddressLine1}
            onChange={(e) => updateFormData('affiantAddressLine1', e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="123 Main Street"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            City *
          </label>
          <input
            type="text"
            value={formData.affiantAddressCity}
            onChange={(e) => updateFormData('affiantAddressCity', e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="Salt Lake City"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            State *
          </label>
          <input
            type="text"
            value={formData.affiantAddressState}
            onChange={(e) => updateFormData('affiantAddressState', e.target.value.toUpperCase().slice(0, 2))}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="UT"
            maxLength="2"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            ZIP Code *
          </label>
          <input
            type="text"
            value={formData.affiantAddressZip}
            onChange={(e) => {
              const value = e.target.value.replace(/\D/g, '').slice(0, 5);
              updateFormData('affiantAddressZip', value);
            }}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="84101"
            maxLength="5"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Phone Number
          </label>
          <input
            type="tel"
            value={formData.affiantPhone}
            onChange={(e) => updateFormData('affiantPhone', e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="(801) 555-0123"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Email Address
          </label>
          <input
            type="email"
            value={formData.affiantEmail}
            onChange={(e) => updateFormData('affiantEmail', e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="your@email.com"
          />
        </div>

        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Your Capacity *
          </label>
          <select
            value={formData.affiantCapacity}
            onChange={(e) => updateFormData('affiantCapacity', e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            required
          >
            <option value="successor">I am a successor of the deceased</option>
            <option value="agent_of_successor">I am acting as agent for a successor</option>
          </select>
        </div>

        {formData.affiantCapacity === 'agent_of_successor' && (
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Successor's Name *
            </label>
            <input
              type="text"
              value={formData.successorName}
              onChange={(e) => updateFormData('successorName', e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Name of the person you represent"
              required
            />
          </div>
        )}
      </div>
    </div>
  );

  const renderAffidavitStatements = () => (
    <div className="space-y-6">
      <h2 className="text-2xl font-semibold text-gray-900">
        Required Affidavit Statements
      </h2>
      <p className="text-gray-600">
        These are the statutory requirements you must attest to under oath.
      </p>
      
      <div className="space-y-4">
        <div className="flex items-start">
          <input
            type="checkbox"
            id="noPrPending"
            checked={formData.noPrPendingOrGrantedBool}
            onChange={(e) => updateFormData('noPrPendingOrGrantedBool', e.target.checked)}
            className="mt-1 mr-3"
            required
          />
          <label htmlFor="noPrPending" className="text-sm text-gray-700">
            <span className="font-medium">No personal representative pending or granted:</span> I affirm that no 
            application or petition for the appointment of a personal representative is pending 
            or has been granted in any jurisdiction.
          </label>
        </div>

        <div className="flex items-start">
          <input
            type="checkbox"
            id="elapsed30Days"
            checked={formData.elapsed30DaysBool}
            disabled={!formData.elapsed30DaysBool}
            className="mt-1 mr-3"
            required
          />
          <label htmlFor="elapsed30Days" className={`text-sm ${formData.elapsed30DaysBool ? 'text-gray-700' : 'text-gray-400'}`}>
            <span className="font-medium">30-day waiting period:</span> At least 30 days have elapsed since the decedent's death.
            {!formData.elapsed30DaysBool && (
              <div className="text-yellow-600 mt-1">
                ⚠️ This will be automatically checked based on the death date you entered.
              </div>
            )}
          </label>
        </div>

        <div className="flex items-start">
          <input
            type="checkbox"
            id="successorEntitled"
            checked={formData.successorEntitledBool}
            onChange={(e) => updateFormData('successorEntitledBool', e.target.checked)}
            className="mt-1 mr-3"
            required
          />
          <label htmlFor="successorEntitled" className="text-sm text-gray-700">
            <span className="font-medium">Successor entitlement:</span> I am entitled to payment or 
            delivery of the described property as an heir, devisee, or other successor of the decedent.
          </label>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-4">
          <h3 className="font-medium text-blue-900 mb-2">Estate Value Confirmation</h3>
          <p className="text-blue-700 text-sm">
            Total estate value (net of liens): <span className="font-medium">${totalAssetValue.toLocaleString()}</span>
          </p>
          {totalAssetValue > 100000 && (
            <div className="text-red-700 text-sm mt-2">
              ⚠️ Estate value exceeds $100,000 - Small Estate Affidavit not available
            </div>
          )}
        </div>
      </div>
    </div>
  );

  const renderReviewAndSubmit = () => (
    <div className="space-y-6">
      <h2 className="text-2xl font-semibold text-gray-900">
        Review Your Small Estate Affidavit
      </h2>
      
      <div className="bg-white border border-gray-200 rounded-lg">
        <div className="p-6 space-y-6">
          <div>
            <h3 className="font-semibold text-gray-900 mb-2">Deceased Person</h3>
            <p className="text-gray-700">{formData.decedentFullName}</p>
            <p className="text-gray-600 text-sm">
              Died: {formData.decedentDodIso} • Domicile: {formData.domicileCounty} County
            </p>
          </div>

          <div>
            <h3 className="font-semibold text-gray-900 mb-2">Assets (Total: ${totalAssetValue.toLocaleString()})</h3>
            <div className="space-y-2">
              {formData.assetRows.map((asset, index) => (
                <div key={index} className="text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-700">{asset.holderName} - {asset.assetDescription}</span>
                    <span className="font-medium">${parseFloat(asset.valueUsd || 0).toLocaleString()}</span>
                  </div>
                  {asset.last4Account && (
                    <span className="text-gray-500 text-xs">Account ending in {asset.last4Account}</span>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div>
            <h3 className="font-semibold text-gray-900 mb-2">Affiant</h3>
            <p className="text-gray-700">{formData.affiantFullName}</p>
            <p className="text-gray-600 text-sm">
              {formData.affiantAddressLine1}, {formData.affiantAddressCity}, {formData.affiantAddressState} {formData.affiantAddressZip}
            </p>
            <p className="text-gray-600 text-sm">
              Capacity: {formData.affiantCapacity === 'successor' ? 'Successor' : 'Agent of successor'}
              {formData.affiantCapacity === 'agent_of_successor' && formData.successorName && (
                <span> for {formData.successorName}</span>
              )}
            </p>
          </div>
        </div>
      </div>

      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <h3 className="font-medium text-yellow-900 mb-2">Next Steps After Form Completion:</h3>
        <ol className="list-decimal list-inside space-y-1 text-sm text-yellow-700">
          <li>Print and sign the completed affidavit form</li>
          <li>Have your signature notarized</li>
          <li>Gather supporting documents (death certificate, asset statements)</li>
          <li>File with the district court in {formData.domicileCounty} County</li>
          <li>Present the affidavit to asset holders for collection</li>
        </ol>
      </div>

      <div className="space-y-3">
        <button 
          onClick={() => setCurrentStep(8)}
          className="w-full bg-green-600 text-white p-4 rounded-lg hover:bg-green-700 font-medium"
        >
          Continue to Document Checklist
        </button>
        <p className="text-xs text-gray-500 text-center">
          Review required documents and next steps
        </p>
      </div>
    </div>
  );

  const canProceedToNext = () => {
    switch (currentStep) {
      case 1:
        return formData.decedentFullName;
      case 2:
        return formData.deathMonth && formData.deathDay && formData.deathYear;
      case 3:
        return formData.assetRows.every(asset => asset.holderName && asset.assetDescription && asset.valueUsd) && 
               totalAssetValue < 100000 && 
               totalAssetValue > 0 &&
               formData.elapsed30DaysBool;
      case 4:
        return formData.domicileCounty; // SSN is optional
      case 5:
        return formData.affiantFullName && 
               formData.affiantAddressLine1 && 
               formData.affiantAddressCity && 
               formData.affiantAddressState && 
               formData.affiantAddressZip &&
               (formData.affiantCapacity !== 'agent_of_successor' || formData.successorName);
      case 6:
        return formData.noPrPendingOrGrantedBool && 
               formData.elapsed30DaysBool && 
               formData.successorEntitledBool;
      default:
        return true;
    }
  };

  // Don't show wrapper for DocumentChecklist step
  if (currentStep === 8) {
    return renderStep();
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Progress bar */}
      <div className="mb-8">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-medium text-blue-600">Small Estate Affidavit</span>
          <span className="text-sm text-gray-500">Step {currentStep} of 7</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className="bg-blue-600 h-2 rounded-full transition-all"
            style={{ width: `${(currentStep / 7) * 100}%` }}
          ></div>
        </div>
      </div>

      {/* Form content */}
      {renderStep()}

      {/* Navigation */}
      <div className="mt-8 flex justify-between">
        {currentStep > 1 && (
          <button
            onClick={() => setCurrentStep(currentStep - 1)}
            className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
          >
            ← Previous
          </button>
        )}
        
        {currentStep < 7 && (
          <button
            onClick={() => setCurrentStep(currentStep + 1)}
            disabled={!canProceedToNext()}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            Next →
          </button>
        )}
      </div>
    </div>
  );
}
