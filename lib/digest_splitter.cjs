/**
 * MULTI-JOB DIGEST SPLITTER
 * Splits Telegram messages containing 10-14 numbered jobs into discrete job blocks.
 */

function cleanHtml(raw) {
  return raw
    .replace(/<br\s*[\/]?>/gi, '\n')
    .replace(/<a\s+[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/gi, '$2 ($1)')
    .replace(/<[^>]+>/g, '')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ');
}

function splitDigest(text) {
  const lines = text.split('\n');
  const blocks = [];
  let currentBlock = [];

  const itemStartRegex = /^(?:[0-9]{1,2}[️⃣\.]|\b(?:Job|Role|Position|Opening)\s*[0-9]{1,2}\b|(?:\*{0,2}[0-9]{1,2}[\.\)]\*{0,2}\s+[A-Za-z]))/i;
  const dividerRegex = /^[━─=-]{4,}$/;

  const matches = text.match(/(?:[0-9]{1,2}[️⃣\.]|\b(?:Job|Role|Position|Opening)\s*[0-9]{1,2}\b)/g) || [];
  const isMultiJob = matches.length >= 2;

  if (!isMultiJob) {
    return [text];
  }

  for (const line of lines) {
    const trimmed = line.trim();
    if (dividerRegex.test(trimmed)) {
      if (currentBlock.length > 0) {
        blocks.push(currentBlock.join('\n'));
        currentBlock = [];
      }
      continue;
    }

    if (itemStartRegex.test(trimmed)) {
      if (currentBlock.length > 0) {
        blocks.push(currentBlock.join('\n'));
        currentBlock = [];
      }
    }
    currentBlock.push(line);
  }
  if (currentBlock.length > 0) {
    blocks.push(currentBlock.join('\n'));
  }

  return blocks.filter(b => {
    const t = b.trim();
    if (t.length < 25) return false;
    if (t.startsWith('🚀 TECH JOB UPDATES') && !t.includes('@')) return false;
    if (t.startsWith('Join our Premium Membership')) return false;
    if (t.startsWith('The hiring process is currently slow')) return false;
    return true;
  });
}

module.exports = { cleanHtml, splitDigest };
