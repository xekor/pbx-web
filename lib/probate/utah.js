// Utah Probate Decision Engine

const MS_HOUR = 3600_000;
const addYears = (d, y) => new Date(d.getFullYear() + y, d.getMonth(), d.getDate());
const iso = (d) => d.toISOString().slice(0, 10);

function hoursBetween(aISO, bISO) {
  return Math.abs((new Date(aISO).getTime() - new Date(bISO).getTime()) / MS_HOUR);
}

export function decideUtah(input) {
  const { decedent, assets, applicant, parties, filingDateISO } = input;
  const blocks = [];
  const notes = [];
  const venue = { county: decedent.domicileCounty || 'Unknown' };

  // Core clocks
  const canFileAfterISO = iso(new Date(new Date(decedent.dateOfDeathISO).getTime() + 120 * MS_HOUR));
  const threeYearBarISO = iso(addYears(new Date(decedent.dateOfDeathISO), 3));

  // Timeliness checks
  if (hoursBetween(decedent.dateOfDeathISO, filingDateISO) < 120) {
    blocks.push('Must wait 120 hours after death to file.');
  }
  if (new Date(filingDateISO) > new Date(threeYearBarISO)) {
    // In Utah, informal probate/testacy generally barred after 3 years → determine heirs path
    return {
      path: 'determine_heirs',
      blocks: ['More than 3 years since death: use determination of heirs process.'],
      venue,
      smallEstateEligible: false,
      requiresBond: false,
      requiredConsents: [],
      timers: { canFileAfterISO, threeYearBarISO },
      notes,
    };
  }

  // Assets & small-estate eligibility
  const totalProbateUSD = assets.reduce((s, a) => s + (a.valueUSD || 0), 0);
  const hasRealProperty = input.hasRealProperty ?? assets.some(a => a.kind === 'real_property');
  let smallEstateEligible =
    totalProbateUSD < 100_000 &&
    !hasRealProperty &&
    hoursBetween(decedent.dateOfDeathISO, filingDateISO) >= 24 * 30 && // ~30 days
    !input.priorPRApplicationFiled;

  // Consents (equal/higher priority than applicant)
  const rankMap = {
    nominee_in_will: 0,
    devisee: 1,
    spouse_devisee: 2,
    spouse_nondevisee: 3,
    heir: 4,
    creditor: 5,
  };
  const applicantRank = rankMap[applicant.priority] ?? 99;
  const requiredConsents = parties
    .filter(p => p.priorityRank <= applicantRank && p.waiverStatus !== 'waived')
    .map(p => p.name);

  // Bond logic (simplified MVP)
  const requiresBond =
    !!input.bondDemanded && !(decedent.hadWill && decedent.willSelfProved); // waive if will explicitly waives (MVP proxy: self-proved flag)

  // Path decision
  let path = 'formal_referral';

  if (smallEstateEligible) {
    path = 'small_estate_affidavit';
    notes.push('Eligible for small-estate collection by affidavit (<$100k, no real property, 30+ days).');
  } else if (input.anyObjection) {
    path = 'formal_referral';
    blocks.push('There is an objection or dispute; use formal probate.');
  } else if (decedent.hadWill) {
    if (decedent.willSelfProved) {
      path = 'informal_testate';
    } else {
      // You can still do informal with appropriate will proofing; MVP pushes to formal to keep it simple
      path = 'formal_referral';
      notes.push('Will is not self-proved; consider formal probate or add witness affidavits to stay informal.');
    }
  } else {
    path = 'informal_intestate';
  }

  // Applicant qual checks
  if (applicant.age < 21) blocks.push('Applicant must be 21 or older.');
  if (path !== 'small_estate_affidavit' && requiredConsents.length > 0) {
    notes.push('Collect waivers/renunciations from equal/higher-priority parties for informal appointment.');
  }

  return {
    path,
    blocks,
    venue,
    smallEstateEligible,
    requiresBond,
    requiredConsents,
    timers: { canFileAfterISO, threeYearBarISO },
    notes,
  };
}