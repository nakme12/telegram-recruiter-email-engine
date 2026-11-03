/**
 * TELEGRAM JOB BLOCK PARSER
 * Extracts Recruiter Email, Application Link, Company Name, Role, Location, and Experience.
 */

const { evaluateExperience } = require('./experience_guard.cjs');
const { INDORE_TECH_COMPANIES } = require('../config.cjs');

function parseBlock(rawText, channel, dateIso, postUrl) {
  // 1. Extract Email
  const emailMatch = rawText.match(/([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/);
  const email = emailMatch ? emailMatch[1].toLowerCase().trim() : null;

  // 2. Extract Application / Google Form Link
  const formMatch = rawText.match(/(https?:\/\/(?:forms\.gle|docs\.google\.com\/forms|careers\.[a-zA-Z0-9.-]+|job-boards\.[a-zA-Z0-9.-]+|jobs\.[a-zA-Z0-9.-]+)[^\s\)]+)/i);
  const genericLinkMatch = rawText.match(/(https?:\/\/[^\s\)\<\>]+)/);
  let applyLink = formMatch ? formMatch[1] : (genericLinkMatch ? genericLinkMatch[1] : null);

  if (applyLink && (applyLink.includes('t.me') || applyLink.includes('telegram.me') || applyLink.includes('whatsapp') || applyLink.includes('devjobs.smtechpartner.com'))) {
    applyLink = null;
  }

  if (!email && !applyLink) {
    return null;
  }

  const lines = rawText.split('\n').map(l => l.trim()).filter(Boolean);
  const firstLine = lines[0] || '';

  // 3. Extract Company from Explicit Tag FIRST (Highest Priority)
  let company = '';
  const compMatch = rawText.match(/(?:🏢\s*(?:Company(?:\/Recruitment\s*Brand)?|Employer|Organization)?|Company(?:\/Recruitment\s*Brand)?|Organization)\s*[:\-]?\s*([A-Za-z0-9\s&,.]{2,40})/i);
  if (compMatch && compMatch[1]) {
    let c = compMatch[1].trim()
      .replace(/^\/+\s*/, '')
      .replace(/^Recruitment\s*Brand\s*[:\-]?\s*/i, '')
      .replace(/\*\*/g, '')
      .trim();
    const cLower = c.toLowerCase();
    // Validate that c is not a tech stack or placeholder
    if (!/^(?:fresher|fresher\s*\(.*?\)|experience|location|hiring|remote|hybrid|onsite|partner|node(?:\.js)?|react(?:\.js)?|python|java)$/i.test(cLower)) {
      company = c;
    }
  }

  // 4. Role Title & Company extraction from first line
  let role = '';
  // Check explicit Role/Title tag
  const roleMatch = rawText.match(/(?:Job\s*Role|Role|Position|Title)\s*[:\-]\s*([^\n\r💼📧📍🏢🛠]+)/i);
  if (roleMatch && roleMatch[1]) {
    role = roleMatch[1].trim().replace(/^[0-9•\-\*–\s1-9️⃣]+/, '').replace(/\*\*/g, '').trim();
  }

  // If role or company still missing, check first line
  if (!role || !company) {
    const firstLineMatch = firstLine.match(/^(?:[0-9]{1,2}[️⃣\.]|\b)\s*(?:\*\*)?([^–—\n]+?)(?:\*\*)?(?:\s*[-–—]\s*(.+))?$/);
    if (firstLineMatch) {
      if (!role && firstLineMatch[1]) {
        let r = firstLineMatch[1].trim().replace(/^[0-9•\-\*–\s1-9️⃣]+/, '').replace(/\*\*/g, '').trim();
        if (r.length > 2 && r.length < 50 && !r.toLowerCase().startsWith('company:')) {
          role = r;
        }
      }
      if (firstLineMatch[2]) {
        let remainder = firstLineMatch[2].trim().replace(/\*\*/g, '').replace(/^[•\-\*–\s]+/, '').trim();
        // Check if remainder is actually a tech stack or company
        const isTechStack = /\b(?:node(?:\.js)?|react(?:\.js)?|mern|full\s*stack|frontend|backend|python|java|angular|vue|php|devops|aws|docker)\b/i.test(remainder);
        if (isTechStack) {
          if (role && !role.toLowerCase().includes(remainder.toLowerCase())) {
            role += ` – ${remainder}`;
          } else if (!role) {
            role = remainder;
          }
        } else if (!company && remainder.length > 1 && remainder.length < 40 && !remainder.toLowerCase().includes('hiring') && !remainder.toLowerCase().includes('location')) {
          company = remainder;
        }
      }
    }
  }

  if (!role) {
    role = 'Software Developer';
  }

  // Fallback to secondary lines for company if still missing
  if (!company) {
    for (const line of lines.slice(1, 4)) {
      if (line.startsWith('🏢') || line.toLowerCase().startsWith('company:')) {
        let c = line.replace(/^[🏢\s]*company:\s*/i, '').replace(/\*\*/g, '').trim();
        if (c.length > 1 && !/^(?:fresher|fresher\s*\(.*?\)|experience|location)/i.test(c)) {
          company = c;
          break;
        }
      }
    }
  }

  // Domain fallback if missing or generic
  if (!company || company.length < 2 || /^(?:ion|fresher|direct\s*tech\s*firm|gmail|google|yahoo|hotmail|outlook)$/i.test(company.trim())) {
    if (email) {
      const emailDomain = email.split('@')[1].toLowerCase();
      if (!['gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com', 'icloud.com'].includes(emailDomain)) {
        const domainName = emailDomain.split('.')[0];
        company = domainName.charAt(0).toUpperCase() + domainName.slice(1);
      } else {
        // Derive clean company from local prefix: e.g. megha.nettech01@gmail.com -> NetTech India
        const localPart = email.split('@')[0].replace(/[0-9._-]+/g, ' ').trim();
        const parts = localPart.split(' ').filter(p => p.length >= 4 && !['gmail', 'mail', 'test', 'admin', 'career', 'careers', 'jobs', 'apply', 'contact'].includes(p.toLowerCase()));
        if (parts.length > 0) {
          company = parts.map(p => p.charAt(0).toUpperCase() + p.slice(1)).join(' ');
        } else {
          company = 'Direct Tech Hiring Team';
        }
      }
    } else {
      company = 'Direct Tech Hiring Team';
    }
  }

  company = company.replace(/[📍💼📧📱].*$/, '').replace(/[\s–—\-]+$/, '').trim();

  // 5. Extract Experience (Strict word boundary on \bExp\b so Express.js doesn't match!)
  let exp = 'Not specified';
  const expMatch = rawText.match(/(?:💼\s*Experience|\bExperience\b|\bExp\b)\s*[:\-]\s*([^\n\r📧📍🛠]+)/i) ||
                   rawText.match(/([0-9]+\s*(?:–|-|to)\s*[0-9]+\+?\s*(?:years?|yrs?|yoe)|[0-9]+\+?\s*(?:years?|yrs?|yoe)|Freshers?)/i);
  if (expMatch && expMatch[1]) {
    exp = expMatch[1].trim().replace(/\*\*/g, '');
  }

  // 6. Extract Location
  let location = 'India / Remote';
  const locMatch = rawText.match(/(?:📍\s*Location|Location|📍)\s*[:\-]?\s*([^\n\r💼📧📱|]+)/i);
  if (locMatch && locMatch[1]) {
    location = locMatch[1].trim().replace(/\*\*/g, '').replace(/[|•].*$/, '').trim();
  }

  // 7. Categorization & Stack Verification
  let category = 'ELIGIBLE_0_TO_2_YOE';
  const textLower = rawText.toLowerCase();

  // Check Non-Dev / Irrelevant
  const isBannedNonDev = /\b(extruder|operator|seo\b|ppc\b|telecaller|bpo\b|sales\b|marketing\b|content\s*writer|graphic\s*designer|video\s*editor|accountant|hr\s*executive|talent\s*acquisition|recruiter\b)\b/i.test(textLower);
  if (isBannedNonDev && !/\b(frontend|react|mern|next\.js)\b/i.test(textLower)) {
    category = 'NON_DEV_OR_IRRELEVANT';
  } else {
    // Check 3-Flow Experience
    const expEval = evaluateExperience(exp);
    category = expEval.category;

    // Check if role is lead/architect
    if (/\b(lead|principal|architect|director|head\s+of)\b/i.test(role)) {
      category = 'SENIOR_6_PLUS_YOE';
    }
  }

  // Local Indore Flag
  const isIndore = location.toLowerCase().includes('indore') || INDORE_TECH_COMPANIES.some(c => company.toLowerCase().includes(c) || textLower.includes(c));

  return {
    channel,
    date: dateIso ? dateIso.slice(0, 10) : 'Recent',
    dateIso,
    company,
    role,
    experience: exp,
    location,
    isIndore,
    email: email || '',
    applyLink: applyLink || '',
    category,
    postUrl,
    rawSnippet: rawText.slice(0, 300).replace(/\n/g, ' ')
  };
}

module.exports = { parseBlock };
