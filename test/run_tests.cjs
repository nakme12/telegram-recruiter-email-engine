/**
 * UNIT TEST SUITE FOR TELEGRAM RECRUITER EMAIL ENGINE
 */

const { evaluateExperience } = require('../lib/experience_guard.cjs');
const { splitDigest } = require('../lib/digest_splitter.cjs');
const { parseBlock } = require('../lib/block_parser.cjs');

let passed = 0;
let failed = 0;

function assert(desc, condition) {
  if (condition) {
    console.log(`✅ PASS: ${desc}`);
    passed++;
  } else {
    console.error(`❌ FAIL: ${desc}`);
    failed++;
  }
}

console.log('=== RUNNING TESTS ===\n');

// 1. Experience Guard Tests
assert('1–3 Years is ALLOWED (broad junior range)', evaluateExperience('1–3 Years').allowed === true);
assert('2–4 Years is ALLOWED (start <= 2)', evaluateExperience('2–4 Years').allowed === true);
assert('0–2 Years is ALLOWED', evaluateExperience('0–2 Years').allowed === true);
assert('Freshers is ALLOWED', evaluateExperience('Freshers').allowed === true);
assert('3–5 Years is DISQUALIFIED (start > 2)', evaluateExperience('3–5 Years').allowed === false);
assert('3–5 Years is categorized as REACH_OUT_3_TO_5_YOE', evaluateExperience('3–5 Years').category === 'REACH_OUT_3_TO_5_YOE');
assert('4+ Years is DISQUALIFIED', evaluateExperience('4+ Years').allowed === false);
assert('7+ Years is categorized as SENIOR_6_PLUS_YOE', evaluateExperience('7+ Years').category === 'SENIOR_6_PLUS_YOE');

// 2. Multi-Job Digest Splitting Tests
const sampleDigest = `
🚀 TODAY'S HIRING UPDATE
1️⃣ React Developer – CompanyA
📍 Indore
💼 Experience: 1–2 Years
📧 Email: hr@companya.com
━━━━━━━━━━━━━━━━━━━━
2️⃣ Full Stack Developer – CompanyB
📍 Remote
💼 Experience: 2–4 Years
📧 Email: hr@companyb.com
`;

const blocks = splitDigest(sampleDigest);
assert('Multi-job digest split into 2 blocks', blocks.length === 2);

// 3. Block Parser Tests
const p1 = parseBlock(blocks[0], 'test_ch', '2026-11-03T10:00:00Z', 'https://t.me/test/1');
assert('p1 email extracted correctly', p1.email === 'hr@companya.com');
assert('p1 company is CompanyA', p1.company.includes('CompanyA'));
assert('p1 category is ELIGIBLE_0_TO_2_YOE', p1.category === 'ELIGIBLE_0_TO_2_YOE');
assert('p1 Indore detected', p1.isIndore === true);

// 4. Tech Stack & Exclusion Guard Tests (Ironclad Candidate Rule 1 & Rule 3)
const javaBlock = `3️⃣ Java Backend Developer
🏢 Company: TechCorp
📍 Bangalore
💼 Experience: 1–2 Years
📧 Email: jobs@techcorp.com`;
const parsedJava = parseBlock(javaBlock, 'ch', null, 'url');
assert('Java Backend Developer is disqualified to NON_DEV_OR_IRRELEVANT', parsedJava.category === 'NON_DEV_OR_IRRELEVANT');

const jsBlock = `4️⃣ JavaScript / Node.js Developer
🏢 Company: WebWorks
📍 Indore
💼 Experience: 0–2 Years
📧 Email: hr@webworks.in`;
const parsedJs = parseBlock(jsBlock, 'ch', null, 'url');
assert('JavaScript / Node.js is ELIGIBLE_0_TO_2_YOE', parsedJs.category === 'ELIGIBLE_0_TO_2_YOE');

const seniorBlock = `5️⃣ Senior Full Stack Developer
🏢 Company: NextGen
📍 Remote
💼 Experience: 1–3 Years
📧 Email: talent@nextgen.com`;
const parsedSenior = parseBlock(seniorBlock, 'ch', null, 'url');
assert('Senior title is disqualified to SENIOR_6_PLUS_YOE', parsedSenior.category === 'SENIOR_6_PLUS_YOE');

const flutterBlock = `6️⃣ Flutter App Developer
🏢 Company: AppStudio
📍 Pune
💼 Experience: Freshers
📧 Email: hr@appstudio.io`;
const parsedFlutter = parseBlock(flutterBlock, 'ch', null, 'url');
assert('Flutter Developer is disqualified to NON_DEV_OR_IRRELEVANT', parsedFlutter.category === 'NON_DEV_OR_IRRELEVANT');

const netBlock = `7️⃣ .NET Developer
🏢 Company: RulesIQ
📍 Remote
💼 Experience: 1–2 Years
📧 Email: hr@rulesiq.com`;
const parsedNet = parseBlock(netBlock, 'ch', null, 'url');
assert('.NET Developer is disqualified to NON_DEV_OR_IRRELEVANT', parsedNet.category === 'NON_DEV_OR_IRRELEVANT');

const csharpBlock = `8️⃣ C# Backend Developer
🏢 Company: DotNetCorp
📍 Remote
💼 Experience: Freshers
📧 Email: hr@dotnetcorp.com`;
const parsedCsharp = parseBlock(csharpBlock, 'ch', null, 'url');
assert('C# Developer is disqualified to NON_DEV_OR_IRRELEVANT', parsedCsharp.category === 'NON_DEV_OR_IRRELEVANT');

const pythonBlock = `9️⃣ Python Developer
🏢 Company: PyCorp
📍 Pune
💼 Experience: 1 Year
📧 Email: hr@pycorp.com`;
const parsedPython = parseBlock(pythonBlock, 'ch', null, 'url');
assert('Python Developer is disqualified to NON_DEV_OR_IRRELEVANT', parsedPython.category === 'NON_DEV_OR_IRRELEVANT');

console.log(`\n=== RESULTS: ${passed} PASSED, ${failed} FAILED ===`);
if (failed > 0) process.exit(1);
