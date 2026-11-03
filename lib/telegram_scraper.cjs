/**
 * TELEGRAM PUBLIC CHANNEL SCRAPER (HTTPS FETCH + BACKWARD PAGINATION)
 */

const https = require('https');
const { cleanHtml, splitDigest } = require('./digest_splitter.cjs');
const { parseBlock } = require('./block_parser.cjs');

function fetchUrl(url) {
  return new Promise((resolve) => {
    const req = https.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      }
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve({ status: res.statusCode, html: data }));
    });
    req.on('error', (err) => resolve({ error: err.message, html: '' }));
    req.setTimeout(12000, () => {
      req.destroy();
      resolve({ error: 'timeout', html: '' });
    });
  });
}

async function scrapeChannel(channel, cutoffMs) {
  let currentUrl = `https://t.me/s/${channel}`;
  let pageCount = 0;
  const channelJobs = [];

  while (currentUrl && pageCount < 3) {
    try {
      const res = await fetchUrl(currentUrl);
      if (!res.html) break;

      const messageBlocks = res.html.split('<div class="tgme_widget_message_wrap');
      let oldestDateMs = Date.now();

      for (let i = 1; i < messageBlocks.length; i++) {
        const block = messageBlocks[i];
        const timeMatch = block.match(/<time datetime="([^"]+)"/i);
        const dateIso = timeMatch ? timeMatch[1] : null;
        if (dateIso) {
          const tMs = new Date(dateIso).getTime();
          if (tMs < oldestDateMs) oldestDateMs = tMs;
          if (tMs < cutoffMs) continue; // Skip messages older than cutoff
        }

        const textMatch = block.match(/<div class="tgme_widget_message_text[^"]*"[^>]*>([\s\S]*?)<\/div>/i);
        if (!textMatch) continue;

        const linkMatch = block.match(/href="(https:\/\/t\.me\/[^\/]+\/\d+)"/i);
        const postUrl = linkMatch ? linkMatch[1] : `https://t.me/s/${channel}`;

        const cleanText = cleanHtml(textMatch[1]).trim();
        const units = splitDigest(cleanText);

        for (const u of units) {
          const parsed = parseBlock(u, channel, dateIso, postUrl);
          if (parsed) {
            channelJobs.push(parsed);
          }
        }
      }

      // Check for backwards pagination link
      const beforeMatch = res.html.match(/href="\/s\/[^\/]+\?before=(\d+)"/i);
      if (beforeMatch && oldestDateMs >= cutoffMs) {
        currentUrl = `https://t.me/s/${channel}?before=${beforeMatch[1]}`;
        pageCount++;
        await new Promise(r => setTimeout(r, 400));
      } else {
        break;
      }
    } catch (err) {
      console.warn(`[Scraper] Error scraping @${channel}: ${err.message}`);
      break;
    }
  }

  return channelJobs;
}

module.exports = { scrapeChannel };
