/**
 * Utah Probate Form Selection Utility
 * Determines the correct forms based on probate conditions
 */

// Utah Probate Form Types
export const FORM_TYPES = {
  SMALL_ESTATE: 'small_estate',
  INFORMAL_PROBATE_NO_WILL: 'informal_probate_no_will',
  INFORMAL_PROBATE_WITH_WILL: 'informal_probate_with_will'
};

// Utah Probate Forms
export const FORMS = {
  // Small Estate Forms (assets < $100,000)
  [FORM_TYPES.SMALL_ESTATE]: [
    { code: '1110XX', name: 'Small Estate Affidavit' },
    { code: 'DMV_SURVIVORSHIP', name: 'DMV Survivorship Affidavit', conditional: true, condition: 'hasVehicle' }
  ],
  
  // Informal Probate Without Will (assets ≥ $100,000 OR real property)
  [FORM_TYPES.INFORMAL_PROBATE_NO_WILL]: [
    { code: '1158XX', name: 'Cover Sheet' },
    { code: '1001ES', name: 'Application for Informal Probate and Informal Appointment of Personal Representative' },
    { code: '1006ES', name: 'Statement of Informal Probate' },
    { code: '1008ES', name: 'Order for Informal Probate' },
    { code: '1009ES', name: 'Letters of Administration' }
  ],
  
  // Informal Probate With Will (assets ≥ $100,000 OR real property)
  [FORM_TYPES.INFORMAL_PROBATE_WITH_WILL]: [
    { code: '1158XX', name: 'Cover Sheet' },
    { code: '1002ES', name: 'Application for Informal Probate of Will and Informal Appointment of Personal Representative' },
    { code: '1007ES', name: 'Statement of Informal Probate of Will' },
    { code: '1008ES', name: 'Order for Informal Probate' },
    { code: '1010ES', name: 'Letters Testamentary' }
  ]
};

/**
 * Determines if small estate affidavit is available
 * @param {Object} conditions - Estate conditions
 * @returns {boolean}
 */
export function isSmallEstateEligible(conditions) {
  const {
    assetValue,
    hasRealProperty,
    daysSinceDeath,
    hasPendingPersonalRepresentative
  } = conditions;

  return (
    assetValue < 100000 &&
    !hasRealProperty &&
    daysSinceDeath >= 30 &&
    !hasPendingPersonalRepresentative
  );
}

/**
 * Determines the appropriate form type based on estate conditions
 * @param {Object} conditions - Estate conditions
 * @returns {string} Form type from FORM_TYPES
 */
export function determineFormType(conditions) {
  const {
    assetValue,
    hasRealProperty,
    daysSinceDeath,
    hasPendingPersonalRepresentative,
    hasWill
  } = conditions;

  // Check if small estate affidavit is eligible
  if (isSmallEstateEligible(conditions)) {
    return FORM_TYPES.SMALL_ESTATE;
  }

  // If not eligible for small estate, use informal probate
  if (hasWill) {
    return FORM_TYPES.INFORMAL_PROBATE_WITH_WILL;
  } else {
    return FORM_TYPES.INFORMAL_PROBATE_NO_WILL;
  }
}

/**
 * Gets the required forms for a given form type
 * @param {string} formType - Form type from FORM_TYPES
 * @param {Object} additionalConditions - Additional conditions for conditional forms
 * @returns {Array} Array of required forms
 */
export function getRequiredForms(formType, additionalConditions = {}) {
  const formSet = FORMS[formType] || [];
  
  return formSet.filter(form => {
    if (!form.conditional) return true;
    
    // Handle conditional forms
    if (form.condition === 'hasVehicle') {
      return additionalConditions.hasVehicle === true;
    }
    
    return true;
  });
}

/**
 * Main function to determine probate path and required forms
 * @param {Object} estateData - Complete estate information
 * @returns {Object} Probate determination result
 */
export function determineProbatePath(estateData) {
  const {
    assetValue = 0,
    hasRealProperty = false,
    dateOfDeath,
    hasPendingPersonalRepresentative = false,
    hasWill = false,
    hasVehicle = false
  } = estateData;

  // Calculate days since death
  let daysSinceDeath = 0;
  if (dateOfDeath) {
    const deathDate = new Date(dateOfDeath);
    const today = new Date();
    daysSinceDeath = Math.floor((today - deathDate) / (1000 * 60 * 60 * 24));
  }

  const conditions = {
    assetValue,
    hasRealProperty,
    daysSinceDeath,
    hasPendingPersonalRepresentative,
    hasWill
  };

  const formType = determineFormType(conditions);
  const requiredForms = getRequiredForms(formType, { hasVehicle });

  return {
    eligible: true,
    formType,
    requiredForms,
    conditions,
    eligibilityReasons: getEligibilityReasons(conditions, formType),
    nextSteps: getNextSteps(formType)
  };
}

/**
 * Gets eligibility reasons for the determined form type
 * @param {Object} conditions - Estate conditions
 * @param {string} formType - Determined form type
 * @returns {Array} Array of eligibility reasons
 */
function getEligibilityReasons(conditions, formType) {
  const reasons = [];

  if (formType === FORM_TYPES.SMALL_ESTATE) {
    reasons.push('Estate value is under $100,000');
    reasons.push('No real property owned');
    reasons.push('More than 30 days have passed since death');
    reasons.push('No pending personal representative application');
  } else {
    if (conditions.assetValue >= 100000) {
      reasons.push('Estate value is $100,000 or more');
    }
    if (conditions.hasRealProperty) {
      reasons.push('Real property is owned by the estate');
    }
    if (conditions.daysSinceDeath < 30) {
      reasons.push('Less than 30 days have passed since death');
    }
    if (conditions.hasPendingPersonalRepresentative) {
      reasons.push('Personal representative application is pending');
    }
  }

  return reasons;
}

/**
 * Gets next steps based on form type
 * @param {string} formType - Form type
 * @returns {Array} Array of next steps
 */
function getNextSteps(formType) {
  if (formType === FORM_TYPES.SMALL_ESTATE) {
    return [
      'Complete and print the Small Estate Affidavit',
      'Have your signature notarized',
      'Gather supporting documents (death certificate, asset statements)',
      'File with the district court in the county of domicile',
      'Present the affidavit to asset holders for collection'
    ];
  } else {
    return [
      'Complete and print all required petition forms',
      'Gather required documents (death certificate, will if applicable, asset inventory)',
      'File petition with the district court in the county of domicile',
      'Pay required filing fees',
      'Obtain Letters of Administration/Testamentary',
      'Post bond if required',
      'Begin estate administration duties'
    ];
  }
}