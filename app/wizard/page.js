'use client';

import { useState, useMemo, useEffect } from 'react';
import { determineProbatePath, FORM_TYPES } from '../../lib/probateFormSelection';
import { getJudicialDistrict, getDistrictCourtName } from '../../lib/utahCourts';
import SmallEstatePreview from '../components/SmallEstatePreview';
import InformalProbatePreview from '../components/InformalProbatePreview';
import AddressInput from '../components/AddressInput';

export default function WizardPage() {
  const [formType, setFormType] = useState('small-estate'); // 'small-estate' or 'informal-probate'
  const [isFormChanging, setIsFormChanging] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [expandedPartyIndex, setExpandedPartyIndex] = useState(0);
  
  const [formData, setFormData] = useState({
    // Affiant information (who's swearing)
    affiantFullName: '',
    affiantAddressLine1: '',
    affiantAddressCity: '',
    affiantAddressState: 'UT',
    affiantAddressZip: '',
    affiantPhone: '',
    affiantEmail: '',
    affiantCapacity: 'successor',
    successorName: '',
    
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
    
    domicileCounty: '',
    socialSecurityNumber: '',
    
    // Additional fields for Informal Probate
    willExists: false,
    willDate: '',
    willLocation: '',
    originalWillFiled: false,
    petitionerRelationship: '',
    bondRequired: false,
    bondAmount: '',
    bondWaived: false,
    interestedParties: [{
      type: 'heir', // 'heir', 'beneficiary', 'creditor', 'other'
      firstName: '',
      lastName: '',
      relationship: '', // spouse, child, parent, etc.
      address: '',
      city: '',
      state: 'UT',
      zip: '',
      phone: '',
      email: '',
      age: '',
      isMinor: false,
      interestType: '', // 'inheritance', 'specific_bequest', 'debt_claim', 'other'
      interestDescription: '',
      documentationProvided: {
        birthCertificate: false,
        marriageCertificate: false,
        deathCertificate: false,
        willCopy: false,
        creditorClaim: false,
        other: false,
        otherDescription: ''
      },
      consentToBondWaiver: false,
      notes: ''
    }]
  });

  const [currentStep, setCurrentStep] = useState(0);

  const getSteps = () => {
    if (formType === 'informal-probate') {
      return [
        { key: "decedent_name", title: "Deceased Person's Name", description: "Enter the full legal name as it appears on official documents" },
        { key: "death_info", title: "Death Information", description: "Date of death and county of domicile" },
        { key: "assets", title: "Estate Inventory", description: "Complete inventory of estate assets" },
        { key: "petitioner_info", title: "Who is the petitioner?", description: "Person requesting to be appointed Personal Representative" },
        { key: "will_info", title: "Is there a will?", description: "Details about the will and testament" },
        { key: "interested_parties", title: "Interested Parties", description: "Add all heirs, beneficiaries, creditors, and other interested parties" },
        { key: "bond_info", title: "Bond Requirements", description: "Security bond information if required" },
        { key: "review", title: "Review & Complete", description: "Final review before court filing" }
      ];
    } else {
      return [
        { key: "decedent_name", title: "Deceased Person's Name", description: "Enter the full legal name as it appears on official documents" },
        { key: "death_info", title: "Death Information", description: "Date of death and county of domicile" },
        { key: "assets", title: "Asset Inventory", description: "List assets to be collected" },
        { key: "affiant_info", title: "Your Information", description: "Person making this sworn statement" },
        { key: "review", title: "Review & Complete", description: "Final review before completion" }
      ];
    }
  };

  const steps = getSteps();

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
  };

  const removeAsset = (index) => {
    setFormData(prev => ({
      ...prev,
      assetRows: prev.assetRows.filter((_, i) => i !== index)
    }));
  };

  const totalAssetValue = useMemo(() => {
    return formData.assetRows.reduce((sum, asset) => {
      const value = parseFloat(asset.valueUsd) || 0;
      return sum + value;
    }, 0);
  }, [formData.assetRows]);

  // Determine probate path using utility function
  const probatePath = useMemo(() => {
    return determineProbatePath({
      assetValue: totalAssetValue,
      hasRealProperty: false, // TODO: Add real property question
      dateOfDeath: formData.decedentDodIso,
      hasPendingPersonalRepresentative: false, // TODO: Add this question
      hasWill: formData.willExists,
      hasVehicle: false // TODO: Add vehicle question
    });
  }, [totalAssetValue, formData.decedentDodIso, formData.willExists]);

  // Auto-switch form type based on probate path determination
  useEffect(() => {
    // Only switch if we have meaningful data (assets entered)
    if (totalAssetValue === 0 && !formData.decedentDodIso) {
      return; // Don't switch on initial load when no data is entered
    }
    
    const newFormType = probatePath.formType === FORM_TYPES.SMALL_ESTATE ? 'small-estate' : 'informal-probate';
    
    if (newFormType !== formType) {
      console.log('Switching form type from', formType, 'to', newFormType, 'based on conditions:', probatePath.conditions);
      
      // Show shimmer effect
      setIsFormChanging(true);
      
      // Delay the form type change to show the shimmer
      setTimeout(() => {
        setFormType(newFormType);
        
        // Adjust current step when switching form types
        if (newFormType === 'informal-probate' && formType === 'small-estate') {
          // Switching to informal probate
          if (currentStep >= 2) {
            const stepMapping = {
              2: 3, // assets step moves from index 2 to 3
              3: 4, // affiant_info becomes petitioner_info at index 4
              4: 7  // review moves to index 7
            };
            const newStep = stepMapping[currentStep] || currentStep;
            setCurrentStep(newStep);
          }
        } else if (newFormType === 'small-estate' && formType === 'informal-probate') {
          // Switching back to small estate
          if (currentStep >= 3) {
            const reverseMapping = {
              3: 2, // assets step moves from index 3 to 2
              4: 3, // petitioner_info becomes affiant_info at index 3
              7: 4  // review moves to index 4
            };
            const newStep = reverseMapping[currentStep] || Math.min(currentStep, 4);
            setCurrentStep(newStep);
          }
        }
        
        // Hide shimmer effect after form change
        setTimeout(() => {
          setIsFormChanging(false);
        }, 100);
      }, 800);
    }
  }, [probatePath.formType, formType, currentStep, totalAssetValue, formData.decedentDodIso]);

  const progressPct = Math.round(((currentStep + 1) / steps.length) * 100);

  const canProceedToNext = () => {
    const currentStepKey = steps[currentStep]?.key;
    
    switch (currentStepKey) {
      case "decedent_name":
        return formData.decedentFullName.trim().length > 0;
      case "death_info":
        return formData.deathMonth && formData.deathDay && formData.deathYear && formData.domicileCounty;
      case "will_info":
        if (formType === 'informal-probate') {
          if (formData.willExists) {
            return formData.willDate && formData.willLocation;
          }
          return true; // No will is valid
        }
        return true;
      case "assets":
        return formData.assetRows.every(asset => asset.holderName && asset.assetDescription && asset.valueUsd) && 
               totalAssetValue > 0;
      case "affiant_info":
        return formData.affiantFullName && 
               formData.affiantAddressLine1 && 
               formData.affiantAddressCity && 
               formData.affiantAddressState && 
               formData.affiantAddressZip &&
               (formData.affiantCapacity !== 'agent_of_successor' || formData.successorName);
      case "petitioner_info":
        return formData.affiantFullName && 
               formData.affiantAddressLine1 && 
               formData.affiantAddressCity && 
               formData.affiantAddressZip && 
               formData.petitionerRelationship;
      case "bond_info":
        if (formType === 'informal-probate') {
          return formData.bondWaived || formData.bondAmount;
        }
        return true;
      case "interested_parties":
        if (formType === 'informal-probate') {
          return formData.interestedParties.length > 0 && 
                 formData.interestedParties.every(party => party.firstName && party.lastName && party.relationship && party.type);
        }
        return true;
      default:
        return true;
    }
  };

  const next = () => {
    if (canProceedToNext() && currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const back = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const onEnterNext = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      next();
    }
  };

  const renderStepContent = () => {
    switch (steps[currentStep].key) {
      case "decedent_name":
        return (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Full Legal Name *
              </label>
              <input
                autoFocus
                type="text"
                value={formData.decedentFullName}
                onChange={(e) => {
                  let value = e.target.value.replace(/[^a-zA-Z\s\-']/g, '').slice(0, 40);
                  value = value.split(' ').map(word => {
                    if (word.length === 0) return word;
                    return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
                  }).join(' ');
                  updateFormData('decedentFullName', value);
                }}
                onKeyDown={onEnterNext}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-lg"
                placeholder="John Doe"
                maxLength="40"
                required
              />
              <div className="mt-2 text-xs text-gray-500">Press Enter to continue</div>
            </div>
          </div>
        );

      case "death_info":
        return (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Date of Death *
              </label>
              <div className="grid grid-cols-3 gap-3">
                <select
                  value={formData.deathMonth || ''}
                  onChange={(e) => {
                    updateFormData('deathMonth', e.target.value);
                    updateDateOfDeath(e.target.value, formData.deathDay, formData.deathYear);
                  }}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
                <select
                  value={formData.deathDay || ''}
                  onChange={(e) => {
                    updateFormData('deathDay', e.target.value);
                    updateDateOfDeath(formData.deathMonth, e.target.value, formData.deathYear);
                  }}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Day</option>
                  {Array.from({ length: 31 }, (_, i) => i + 1).map(day => (
                    <option key={day} value={day.toString().padStart(2, '0')}>
                      {day}
                    </option>
                  ))}
                </select>
                <select
                  value={formData.deathYear || ''}
                  onChange={(e) => {
                    updateFormData('deathYear', e.target.value);
                    updateDateOfDeath(formData.deathMonth, formData.deathDay, e.target.value);
                  }}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                County of Domicile at Death *
              </label>
              <select
                value={formData.domicileCounty}
                onChange={(e) => updateFormData('domicileCounty', e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
        );

      case "assets":
        return (
          <div className="space-y-6">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-blue-700 text-sm">
                List only assets that were owned by the deceased person alone (not jointly owned) 
                and do not have named beneficiaries.
              </p>
            </div>

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
                  
                  <div className="space-y-4">
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

          </div>
        );

      case "affiant_info":
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Your Full Legal Name *
                </label>
                <input
                  autoFocus
                  type="text"
                  value={formData.affiantFullName}
                  onChange={(e) => {
                    let value = e.target.value.replace(/[^a-zA-Z\s\-']/g, '').slice(0, 40);
                    value = value.split(' ').map(word => {
                      if (word.length === 0) return word;
                      return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
                    }).join(' ');
                    updateFormData('affiantFullName', value);
                  }}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  maxLength="40"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Address *
                </label>
                <AddressInput
                  value={{
                    address: formData.affiantAddressLine1,
                    city: formData.affiantAddressCity,
                    state: formData.affiantAddressState,
                    zip: formData.affiantAddressZip
                  }}
                  onChange={(addressData) => {
                    updateFormData('affiantAddressLine1', addressData.address);
                    updateFormData('affiantAddressCity', addressData.city);
                    updateFormData('affiantAddressState', addressData.state);
                    updateFormData('affiantAddressZip', addressData.zip);
                  }}
                  placeholder="Start typing your address..."
                  required
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
                >
                  <option value="successor">I am a successor of the deceased</option>
                  <option value="agent_of_successor">I am acting as agent for a successor</option>
                </select>
              </div>

              {formData.affiantCapacity === 'agent_of_successor' && (
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Successor&rsquo;s Name *
                  </label>
                  <input
                    type="text"
                    value={formData.successorName}
                    onChange={(e) => updateFormData('successorName', e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Name of the person you represent"
                  />
                </div>
              )}
            </div>
          </div>
        );


      case "will_info":
        return (
          <div className="space-y-6">
            <div>
              <select
                value={formData.willExists ? 'yes' : 'no'}
                onChange={(e) => updateFormData('willExists', e.target.value === 'yes')}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="no">No</option>
                <option value="yes">Yes</option>
              </select>
            </div>

            {formData.willExists && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Date Will was Signed
                  </label>
                  <input
                    type="date"
                    value={formData.willDate}
                    onChange={(e) => updateFormData('willDate', e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Location of Original Will
                  </label>
                  <input
                    type="text"
                    value={formData.willLocation}
                    onChange={(e) => updateFormData('willLocation', e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="e.g., Safe deposit box, attorney's office, home safe"
                  />
                </div>

                <div>
                  <label className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      checked={formData.originalWillFiled}
                      onChange={(e) => updateFormData('originalWillFiled', e.target.checked)}
                      className="w-5 h-5"
                    />
                    <span className="text-sm">Original will has been filed with the court</span>
                  </label>
                </div>
              </div>
            )}
          </div>
        );

      case "petitioner_info":
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Your Full Legal Name *
                </label>
                <input
                  autoFocus
                  type="text"
                  value={formData.affiantFullName}
                  onChange={(e) => {
                    let value = e.target.value.replace(/[^a-zA-Z\s\-']/g, '').slice(0, 40);
                    value = value.split(' ').map(word => {
                      if (word.length === 0) return word;
                      return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
                    }).join(' ');
                    updateFormData('affiantFullName', value);
                  }}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  maxLength="40"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Your Relationship to Deceased *
                </label>
                <select
                  value={formData.petitionerRelationship}
                  onChange={(e) => updateFormData('petitionerRelationship', e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Select relationship</option>
                  <option value="spouse">Spouse</option>
                  <option value="child">Child</option>
                  <option value="parent">Parent</option>
                  <option value="sibling">Sibling</option>
                  <option value="other_relative">Other Relative</option>
                  <option value="creditor">Creditor</option>
                  <option value="other">Other</option>
                </select>
              </div>

              {/* Address fields same as before */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Address *
                </label>
                <AddressInput
                  value={{
                    address: formData.affiantAddressLine1,
                    city: formData.affiantAddressCity,
                    state: formData.affiantAddressState,
                    zip: formData.affiantAddressZip
                  }}
                  onChange={(addressData) => {
                    updateFormData('affiantAddressLine1', addressData.address);
                    updateFormData('affiantAddressCity', addressData.city);
                    updateFormData('affiantAddressState', addressData.state);
                    updateFormData('affiantAddressZip', addressData.zip);
                  }}
                  placeholder="Start typing your address..."
                  required
                />
              </div>
            </div>
          </div>
        );

      case "bond_info":
        const allPartiesConsent = formData.interestedParties.length > 0 && 
                                 formData.interestedParties.every(p => p.consentToBondWaiver);
        const suggestedBondWaiver = allPartiesConsent || formData.willExists;
        
        return (
          <div className="space-y-6">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-blue-700 text-sm">
                A bond may be required to secure the faithful performance of duties as Personal Representative.
                Bond can be waived if specified in the will or if all interested parties consent.
              </p>
            </div>

            {/* Show bond waiver analysis */}
            {formData.interestedParties.length > 0 && (
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <h4 className="font-medium text-gray-900 mb-2">Bond Waiver Analysis</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Total interested parties:</span>
                    <span className="font-medium">{formData.interestedParties.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Parties consenting to bond waiver:</span>
                    <span className="font-medium">
                      {formData.interestedParties.filter(p => p.consentToBondWaiver).length}
                    </span>
                  </div>
                  <div className="pt-2 border-t border-gray-300">
                    {allPartiesConsent ? (
                      <div className="text-green-700 flex items-center">
                        <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                        All parties consent - bond can be waived
                      </div>
                    ) : (
                      <div className="text-amber-700 flex items-center">
                        <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                        Not all parties consent - bond will likely be required
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            <div>
              <label className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  checked={formData.bondWaived}
                  onChange={(e) => updateFormData('bondWaived', e.target.checked)}
                  className="w-5 h-5"
                />
                <span className="text-base">
                  Bond is waived by will or by consent of all interested persons
                  {suggestedBondWaiver && (
                    <span className="ml-2 px-2 py-1 bg-green-100 text-green-700 text-xs rounded">
                      Recommended
                    </span>
                  )}
                </span>
              </label>
            </div>

            {!formData.bondWaived && (
              <div className="ml-8">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Estimated Bond Amount ($)
                </label>
                <input
                  type="text"
                  value={formData.bondAmount ? `$${parseFloat(formData.bondAmount).toLocaleString()}` : ''}
                  onChange={(e) => {
                    let value = e.target.value.replace(/[$,]/g, '');
                    if (value === '' || (!isNaN(value) && parseFloat(value) >= 0)) {
                      updateFormData('bondAmount', value);
                    }
                  }}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="$0"
                />
                <p className="text-xs text-gray-600 mt-1">
                  Typically set at the value of personal property plus one year&rsquo;s estimated income
                </p>
              </div>
            )}
          </div>
        );

      case "interested_parties":
        return (
          <div className="space-y-6">
            
            <div>
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-medium text-gray-900">Interested Parties</h3>
                <div className="text-sm text-gray-600">
                  {formData.interestedParties.length} part{formData.interestedParties.length !== 1 ? 'ies' : 'y'} added
                </div>
              </div>
              
              {formData.interestedParties.map((party, index) => {
                const isExpanded = expandedPartyIndex === index;
                const hasBasicInfo = party.firstName && party.lastName && party.type && party.relationship;
                
                return (
                  <div key={index} className="border border-gray-200 rounded-lg mb-4">
                    <div className="p-4">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center gap-3">
                            <h4 className="font-medium text-gray-900">
                              {party.firstName || party.lastName ? `${party.firstName} ${party.lastName}`.trim() : `Interested Party ${index + 1}`}
                            </h4>
                            {party.type && (
                              <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded">
                                {party.type.charAt(0).toUpperCase() + party.type.slice(1)}
                              </span>
                            )}
                          </div>
                          {!isExpanded && hasBasicInfo && (
                            <div className="text-sm text-gray-600 mt-1">
                              {party.relationship.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                              {party.address && ` • ${party.address}`}
                            </div>
                          )}
                        </div>
                        
                        <div className="flex items-center gap-2">
                          {hasBasicInfo && (
                            <button
                              onClick={() => setExpandedPartyIndex(isExpanded ? -1 : index)}
                              className="text-blue-600 hover:text-blue-700 p-1 hover:bg-blue-50 rounded"
                              title={isExpanded ? 'Collapse' : 'Edit'}
                            >
                              {isExpanded ? (
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                                </svg>
                              ) : (
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                </svg>
                              )}
                            </button>
                          )}
                          {formData.interestedParties.length > 1 && (
                            <button
                              onClick={() => {
                                setFormData(prev => ({
                                  ...prev,
                                  interestedParties: prev.interestedParties.filter((_, i) => i !== index)
                                }));
                                if (expandedPartyIndex === index) {
                                  setExpandedPartyIndex(0);
                                }
                              }}
                              className="text-red-600 hover:text-red-700 p-1 hover:bg-red-50 rounded"
                              title="Remove"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  
                    {isExpanded && (
                      <div className="px-4 pb-4 space-y-4 border-t border-gray-100 mt-4">
                    {/* Party Type - Own Row */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Party Type *
                      </label>
                      <select
                        value={party.type}
                        onChange={(e) => {
                          const newParties = [...formData.interestedParties];
                          newParties[index] = { ...newParties[index], type: e.target.value };
                          updateFormData('interestedParties', newParties);
                        }}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="">Select type</option>
                        <option value="heir">Heir at Law</option>
                        <option value="beneficiary">Named Beneficiary</option>
                        <option value="creditor">Creditor</option>
                        <option value="other">Other Interested Party</option>
                      </select>
                    </div>

                    {/* Name Fields - Own Row */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          First Name *
                        </label>
                        <input
                          type="text"
                          value={party.firstName}
                          onChange={(e) => {
                            const newParties = [...formData.interestedParties];
                            newParties[index] = { ...newParties[index], firstName: e.target.value };
                            updateFormData('interestedParties', newParties);
                          }}
                          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          placeholder="First name"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Last Name *
                        </label>
                        <input
                          type="text"
                          value={party.lastName}
                          onChange={(e) => {
                            const newParties = [...formData.interestedParties];
                            newParties[index] = { ...newParties[index], lastName: e.target.value };
                            updateFormData('interestedParties', newParties);
                          }}
                          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          placeholder="Last name"
                        />
                      </div>
                    </div>
                    
                    {/* Relationship - Own Row */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Relationship to Deceased *
                      </label>
                      <select
                        value={party.relationship}
                        onChange={(e) => {
                          const newParties = [...formData.interestedParties];
                          newParties[index] = { ...newParties[index], relationship: e.target.value };
                          updateFormData('interestedParties', newParties);
                        }}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="" className="text-gray-500">Select relationship</option>
                        <option value="surviving_spouse">Surviving Spouse</option>
                        <option value="child">Child</option>
                        <option value="parent">Parent</option>
                        <option value="sibling">Sibling</option>
                        <option value="grandchild">Grandchild</option>
                        <option value="grandparent">Grandparent</option>
                        <option value="creditor">Creditor</option>
                        <option value="business_partner">Business Partner</option>
                        <option value="other_relative">Other Relative</option>
                        <option value="unrelated">Unrelated</option>
                      </select>
                    </div>

                    {/* Address Information */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Address
                      </label>
                      <AddressInput
                        value={{
                          address: party.address,
                          city: party.city,
                          state: party.state,
                          zip: party.zip
                        }}
                        onChange={(addressData) => {
                          const newParties = [...formData.interestedParties];
                          newParties[index] = { 
                            ...newParties[index], 
                            address: addressData.address,
                            city: addressData.city,
                            state: addressData.state,
                            zip: addressData.zip
                          };
                          updateFormData('interestedParties', newParties);
                        }}
                        placeholder="Start typing an address..."
                      />
                    </div>

                    {/* Contact Information */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Phone Number
                      </label>
                      <input
                        type="tel"
                        value={party.phone}
                        onChange={(e) => {
                          const newParties = [...formData.interestedParties];
                          newParties[index] = { ...newParties[index], phone: e.target.value };
                          updateFormData('interestedParties', newParties);
                        }}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="(555) 123-4567"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Email Address
                      </label>
                      <input
                        type="email"
                        value={party.email}
                        onChange={(e) => {
                          const newParties = [...formData.interestedParties];
                          newParties[index] = { ...newParties[index], email: e.target.value };
                          updateFormData('interestedParties', newParties);
                        }}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="email@example.com"
                      />
                    </div>
                      </div>
                    )}
                  </div>
                );
              })}
              
              <button
                onClick={() => {
                  const newIndex = formData.interestedParties.length;
                  setFormData(prev => ({
                    ...prev,
                    interestedParties: [...prev.interestedParties, {
                      type: '',
                      firstName: '',
                      lastName: '',
                      relationship: '',
                      address: '',
                      city: '',
                      state: 'UT',
                      zip: '',
                      phone: '',
                      email: '',
                      age: '',
                      isMinor: false,
                      interestType: '',
                      interestDescription: '',
                      documentationProvided: {
                        birthCertificate: false,
                        marriageCertificate: false,
                        deathCertificate: false,
                        willCopy: false,
                        creditorClaim: false,
                        other: false,
                        otherDescription: ''
                      },
                      consentToBondWaiver: false,
                      notes: ''
                    }]
                  }));
                  setExpandedPartyIndex(newIndex);
                }}
                className="w-full p-4 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-blue-500 hover:text-blue-600 font-medium"
              >
                + Add Another Interested Party
              </button>
              
            </div>
          </div>
        );

      case "review":
        return (
          <div className="space-y-6">
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <p className="text-green-700 text-sm">
                {formType === 'small-estate' 
                  ? '✓ Small Estate Affidavit is ready for completion. Review the information and proceed to document generation.'
                  : '✓ Informal Probate petition is ready for completion. Review the information and proceed to court filing.'
                }
              </p>
            </div>
            
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <h3 className="font-medium text-yellow-900 mb-2">Next Steps:</h3>
              <ol className="list-decimal list-inside space-y-1 text-sm text-yellow-700">
                {probatePath.nextSteps.map((step, index) => (
                  <li key={index}>{step}</li>
                ))}
              </ol>
            </div>

            {/* Display required forms */}
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <h3 className="font-medium text-gray-900 mb-2">Required Forms:</h3>
              <div className="space-y-2">
                {probatePath.requiredForms.map((form, index) => (
                  <div key={index} className="flex justify-between items-center text-sm">
                    <span className="font-mono text-blue-600">{form.code}</span>
                    <span className="text-gray-600">{form.name}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };


  return (
    <div className="min-h-screen bg-white">
      {/* Top Bar */}
      <div className="border-b border-gray-200">
        <div className="mx-auto max-w-6xl px-4 py-6 flex items-center gap-3 justify-between">
          <h1 className="text-xl font-semibold text-gray-900">
            {formType === 'small-estate' ? 'Utah Small Estate Affidavit' : 'Utah Informal Probate'}
          </h1>
          <div className="flex items-center gap-4">
            <button
              onClick={() => setShowPreview(!showPreview)}
              className="flex items-center gap-2 px-3 py-1 text-sm text-gray-600 hover:text-gray-900 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              {showPreview ? (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L6.757 6.757m3.121 3.121l-3.121-3.121m7.071 7.071L16.95 16.95m-1.414-1.414L12.414 12.414m3.121 3.121l3.122 3.122" />
                  </svg>
                  Hide Preview
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                  Show Preview
                </>
              )}
            </button>
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <span className="rounded-full bg-gray-100 text-gray-600 px-3 py-1">Draft</span>
              <span>·</span>
              <span>Autosaved</span>
            </div>
          </div>
        </div>
      </div>

      <div className={`mx-auto px-4 py-6 ${showPreview ? 'max-w-6xl grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,2fr)]' : 'max-w-2xl'}`}>
        {/* Left: Form */}
        <div className="min-w-0">
          {/* Progress */}
          <div className="mb-6">
            <div className="h-1 w-full bg-gray-200 rounded-full">
              <div className="h-1 bg-blue-600 rounded-full transition-all" style={{ width: `${progressPct}%` }} />
            </div>
            <div className="flex justify-between items-center mt-2">
              <span className="text-sm text-gray-600">Step {currentStep + 1} of {steps.length}</span>
              <span className="text-sm text-gray-500">{progressPct}% complete</span>
            </div>
          </div>

          {/* Step Content */}
          <div className="min-h-[60vh] flex flex-col justify-center">
            <div className="max-w-xl">
              <div className="text-2xl font-medium text-gray-900 tracking-tight mb-2">
                {steps[currentStep].title}
              </div>
              <p className="text-gray-600 mb-6">
                {steps[currentStep].description}
              </p>

              {renderStepContent()}
            </div>
          </div>

          {/* Navigation */}
          <div className="flex items-center justify-between pt-6">
            <button 
              onClick={back} 
              disabled={currentStep === 0} 
              className="rounded-md bg-white text-gray-900 border border-gray-300 px-3 py-2 text-sm disabled:opacity-50 font-medium hover:bg-gray-50"
            >
              Back
            </button>
            {currentStep < steps.length - 1 ? (
              <button 
                onClick={next} 
                disabled={!canProceedToNext()}
                className="rounded-md bg-blue-600 text-white px-4 py-2 text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            ) : (
              <button 
                disabled={!canProceedToNext()}
                className="rounded-md bg-green-600 text-white px-4 py-2 text-sm font-medium hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Complete
              </button>
            )}
          </div>
        </div>

        {/* Right: Live Preview */}
        {showPreview && (
          <aside className="sticky top-4 h-fit rounded-xl border border-gray-200 px-8 pb-8 pt-8 bg-white shadow-sm min-h-[800px] flex flex-col">
          <div className="inline-flex items-center gap-2 bg-blue-50 text-blue-700 px-3 py-1.5 rounded-full text-sm font-medium max-w-fit mb-6">
            <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
            Live Preview
          </div>
          
          <div className="flex-1 flex flex-col">
            {isFormChanging ? (
              // Skeleton shimmer loader
              <div className="animate-pulse">
                <div className="text-center mb-6">
                  <div className="h-6 bg-gray-200 rounded mx-auto mb-2 w-3/4"></div>
                  <div className="h-4 bg-gray-200 rounded mx-auto w-1/4"></div>
                </div>
                
                <div className="mb-6 flex">
                  <div className="w-1/4">
                    <div className="h-4 bg-gray-200 rounded mb-1 w-20"></div>
                    <div className="h-4 bg-gray-200 rounded w-16"></div>
                  </div>
                  <div className="flex-1 ml-4">
                    <div className="h-4 bg-gray-200 rounded mb-1 w-4"></div>
                    <div className="h-4 bg-gray-200 rounded mb-1 w-4"></div>
                    <div className="h-4 bg-gray-200 rounded w-4"></div>
                  </div>
                </div>

                <div className="mb-4">
                  <div className="h-4 bg-gray-200 rounded w-48"></div>
                </div>

                <div className="space-y-4">
                  {[...Array(6)].map((_, i) => (
                    <div key={i} className="flex">
                      <div className="h-4 bg-gray-200 rounded w-6 mr-2 flex-shrink-0"></div>
                      <div className="flex-1 space-y-2">
                        <div className="h-4 bg-gray-200 rounded w-full"></div>
                        <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-8 pt-4 border-t border-gray-200">
                  <div className="flex justify-between items-start">
                    <div className="space-y-2">
                      <div className="h-6 bg-gray-200 rounded w-48"></div>
                      <div className="h-4 bg-gray-200 rounded w-12"></div>
                    </div>
                    <div className="space-y-2">
                      <div className="h-6 bg-gray-200 rounded w-48"></div>
                      <div className="space-y-1">
                        <div className="h-3 bg-gray-200 rounded w-32"></div>
                        <div className="h-3 bg-gray-200 rounded w-28"></div>
                        <div className="h-3 bg-gray-200 rounded w-36"></div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              formType === 'small-estate' 
                ? <SmallEstatePreview formData={formData} totalAssetValue={totalAssetValue} />
                : <InformalProbatePreview formData={formData} totalAssetValue={totalAssetValue} />
            )}
          </div>
          </aside>
        )}
      </div>
    </div>
  );
}