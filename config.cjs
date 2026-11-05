/**
 * CONFIGURATION & CONSTANTS
 * Single Source of Truth for Channels, Date Windows, and Target Stack.
 */

const path = require('path');

module.exports = {
  ENGINE_ROOT: __dirname,
  DEFAULT_LOOKBACK_DAYS: 3,
  OUTPUT_DIR: path.join(__dirname, 'output'),
  OUTPUT_JSON: path.join(__dirname, 'output', 'telegram_recruiter_leads.json'),
  
  // High-signal public channels
  CHANNELS: [
    'merntech',
    'offcampusjobs4u',
    'freshersvoice',
    'freshershunt',
    'placementlelo',
    'placement_drive',
    'techjobsalert',
    'web_development_jobs',
    'frontendevelopers',
    'hire_developers',
    'remote_frontend_jobs',
    'developerjobs',
    'fullstackjobs'
  ],

  // Local Indore tech whitelist
  INDORE_TECH_COMPANIES: [
    'crestwin', 'intellicus', 'bestpeers', 'untangleit', 'infobeans',
    'diaspark', 'impetus', 'yash', 'systematix', 'walkover',
    'hackerkernel', 'infograins', 'vinove', 'codiant'
  ]
};
