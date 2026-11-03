#!/usr/bin/env node
/**
 * TELEGRAM RECRUITER EMAIL ENGINE — CLI RUNNER
 * Usage:
 *   node index.cjs [--days 7] [--export json|csv]
 */

const fs = require('fs');
const path = require('path');
const { CHANNELS, DEFAULT_LOOKBACK_DAYS, OUTPUT_DIR, OUTPUT_JSON } = require('./config.cjs');
const { scrapeChannel } = require('./lib/telegram_scraper.cjs');

function parseArgs() {
  const args = process.argv.slice(2);
  const params = {};
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg.startsWith('--')) {
      const key = arg.replace(/^--/, '');
      const val = args[i + 1] && !args[i + 1].startsWith('--') ? args[++i] : true;
      params[key] = val;
    }
  }
  return params;
}

async function main() {
  const args = parseArgs();
  const days = parseInt(args.days, 10) || DEFAULT_LOOKBACK_DAYS;

  // Set UTC midnight cutoff for past N days
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - days);
  d.setUTCHours(0, 0, 0, 0);
  const cutoffMs = d.getTime();

  console.log('================================================================================');
  console.log(`🚀 TELEGRAM RECRUITER EMAIL ENGINE (V1.0 STANDALONE)`);
  console.log(`  • Scanning Channels:   ${CHANNELS.length} Active Public Tech Channels`);
  console.log(`  • Lookback Window:     ${days} Days (Cutoff: ${d.toISOString()})`);
  console.log('================================================================================\n');

  const allJobs = [];
  const seenKeys = new Set();

  for (let i = 0; i < CHANNELS.length; i++) {
    const ch = CHANNELS[i];
    process.stdout.write(`[${i + 1}/${CHANNELS.length}] Scraping @${ch.padEnd(24)} `);
    const jobs = await scrapeChannel(ch, cutoffMs);
    let newInChannel = 0;

    for (const j of jobs) {
      const key = (j.email || j.applyLink).toLowerCase();
      if (!seenKeys.has(key)) {
        seenKeys.add(key);
        allJobs.push(j);
        newInChannel++;
      }
    }
    console.log(`-> Found ${newInChannel} unique contacts`);
  }

  // Ensure output directory exists
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  // Filter lists
  const emails = allJobs.filter(j => j.email);
  const eligible02 = emails.filter(j => j.category === 'ELIGIBLE_0_TO_2_YOE');
  const reachOut35 = emails.filter(j => j.category === 'REACH_OUT_3_TO_5_YOE');
  const indoreEmails = emails.filter(j => j.isIndore);

  // Write JSON
  fs.writeFileSync(OUTPUT_JSON, JSON.stringify(allJobs, null, 2), 'utf8');

  console.log('\n================================================================================');
  console.log(`🎯 TELEGRAM HARVEST SUMMARY`);
  console.log(`  • Total Unique Contacts Found:   ${allJobs.length}`);
  console.log(`  • Total Direct Recruiter Emails:  ${emails.length}`);
  console.log(`  • 🟢 0–2 YOE Target Dev Emails:   ${eligible02.length}`);
  console.log(`  • 🟡 3–5 YOE Dev Reach-Outs:      ${reachOut35.length}`);
  console.log(`  • 📍 Indore Local Tech Openings:  ${indoreEmails.length}`);
  console.log(`  • 💾 Saved Full JSON Output to:    ${OUTPUT_JSON}`);
  console.log('================================================================================\n');

  console.log('--- TOP 15 ACTIONABLE DEV RECRUITER EMAILS ---');
  console.table([...eligible02, ...reachOut35].slice(0, 15).map((j, idx) => ({
    '#': idx + 1,
    Company: j.company.slice(0, 22),
    Role: j.role.slice(0, 25),
    Exp: j.experience.slice(0, 15),
    Email: j.email,
    Location: j.location.slice(0, 15)
  })));
}

main().catch(err => {
  console.error('Fatal error in Telegram Email Engine:', err);
  process.exit(1);
});
