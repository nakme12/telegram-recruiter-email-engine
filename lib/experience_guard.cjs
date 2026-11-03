/**
 * DETERMINISTIC 3-FLOW EXPERIENCE GUARD (RULE 23 COMPLIANT)
 * 
 * Rules:
 * 1. Range Flow (start-end like X-Y years or X to Y years):
 *    - start <= 2 (e.g. 0-2, 1-3, 2-4, 2-5) -> ALLOWED (Broad Junior Range)
 *    - start > 2 (e.g. 3-5, 4-6) -> DISQUALIFIED
 * 2. Plus Flow (X+ years):
 *    - exp <= 2 (e.g. 1+, 2+) -> ALLOWED
 *    - exp > 2 (e.g. 3+, 4+) -> DISQUALIFIED
 * 3. Single Number (X years):
 *    - years <= 2 (e.g. 1 year, 2 years) -> ALLOWED
 *    - years > 2 (e.g. 3 years, 4 years) -> DISQUALIFIED
 */

function evaluateExperience(text) {
  if (!text) return { allowed: true, category: 'ELIGIBLE_0_TO_2_YOE', reason: 'NO_EXP_SPECIFIED' };

  // Normalize all unicode dashes to standard ASCII hyphen
  const normalized = text.replace(/[\u2010-\u2015]/g, '-');

  // Flow 1: Range Flow
  const rangeRegex = /(\b\d+(?:\.\d+)?)\s*(?:years?|yrs?|yoe)?\s*(?:-|to)\s*(\b\d+(?:\.\d+)?)\s*(?:years?|yrs?|yoe)\b/gi;
  let rangeDisqualified = false;
  let rangeStart = null;
  let rangeEnd = null;

  const textWithoutRanges = normalized.replace(rangeRegex, (match, sStr, eStr) => {
    const start = parseFloat(sStr);
    const end = parseFloat(eStr);
    rangeStart = start;
    rangeEnd = end;
    if (start > 2) {
      rangeDisqualified = true;
    }
    return ' __PROCESSED_RANGE__ ';
  });

  if (rangeDisqualified) {
    const isReachOut = rangeStart <= 5;
    return {
      allowed: false,
      category: isReachOut ? 'REACH_OUT_3_TO_5_YOE' : 'SENIOR_6_PLUS_YOE',
      reason: `RANGE_START_GT_2: ${rangeStart}-${rangeEnd} Years`
    };
  }

  // Flow 2: Plus Flow
  const plusRegex = /(\b\d+(?:\.\d+)?)\s*\+\s*(?:years?|yrs?|yoe)\b/gi;
  let plusDisqualified = false;
  let plusExp = null;

  const textWithoutPlus = textWithoutRanges.replace(plusRegex, (match, expStr) => {
    const exp = parseFloat(expStr);
    plusExp = exp;
    if (exp > 2) {
      plusDisqualified = true;
    }
    return ' __PROCESSED_PLUS__ ';
  });

  if (plusDisqualified) {
    const isReachOut = plusExp <= 4;
    return {
      allowed: false,
      category: isReachOut ? 'REACH_OUT_3_TO_5_YOE' : 'SENIOR_6_PLUS_YOE',
      reason: `PLUS_GT_2: ${plusExp}+ Years`
    };
  }

  // Flow 3: Single Number
  const singleRegex = /\b(?:minimum|at\s*least|min)?\s*([3-9]|\d{2,})\s*(?:years?|yrs?|yoe)\b/i;
  const singleMatch = textWithoutPlus.match(singleRegex);
  if (singleMatch) {
    const num = parseInt(singleMatch[1], 10);
    return {
      allowed: false,
      category: num <= 4 ? 'REACH_OUT_3_TO_5_YOE' : 'SENIOR_6_PLUS_YOE',
      reason: `SINGLE_GT_2: ${singleMatch[0]}`
    };
  }

  return {
    allowed: true,
    category: 'ELIGIBLE_0_TO_2_YOE',
    reason: 'CLEAN_0_TO_2_YOE'
  };
}

module.exports = { evaluateExperience };
