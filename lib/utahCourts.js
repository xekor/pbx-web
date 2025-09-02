/**
 * Utah Judicial District Court Mapping
 * Maps counties to their corresponding judicial district numbers
 */

export const UTAH_JUDICIAL_DISTRICTS = {
  // 1st District
  'Cache': '1st',
  'Box Elder': '1st', 
  'Rich': '1st',

  // 2nd District  
  'Davis': '2nd',
  'Morgan': '2nd',
  'Weber': '2nd',

  // 3rd District
  'Salt Lake': '3rd',
  'Summit': '3rd', 
  'Tooele': '3rd',

  // 4th District
  'Utah': '4th',
  'Millard': '4th',
  'Juab': '4th',
  'Wasatch': '4th',

  // 5th District
  'Beaver': '5th',
  'Iron': '5th',
  'Washington': '5th',

  // 6th District
  'Garfield': '6th',
  'Kane': '6th',
  'San Juan': '6th',

  // 7th District
  'Carbon': '7th',
  'Duchesne': '7th',
  'Emery': '7th',
  'Grand': '7th',
  'Uintah': '7th',

  // 8th District
  'Daggett': '8th',
  'Sanpete': '8th',
  'Sevier': '8th',
  'Wayne': '8th',
  'Piute': '8th'
};

/**
 * Gets the judicial district number for a given county
 * @param {string} county - County name
 * @returns {string} District number (e.g., "3rd") or placeholder if not found
 */
export function getJudicialDistrict(county) {
  if (!county) return '[DISTRICT COURT NUMBER]';
  
  const district = UTAH_JUDICIAL_DISTRICTS[county];
  return district || '[DISTRICT COURT NUMBER]';
}

/**
 * Gets the full judicial district court name for a county
 * @param {string} county - County name  
 * @returns {string} Full court name
 */
export function getDistrictCourtName(county) {
  const district = getJudicialDistrict(county);
  return `IN THE ${district.toUpperCase()} JUDICIAL DISTRICT COURT OF ${county?.toUpperCase() || '[COUNTY]'} COUNTY`;
}