# 📡 Telegram Recruiter Email Engine

High-precision, standalone recruiter email & tech job harvester for Telegram public hiring channels.

## 🚀 Key Features
1. **Multi-Job Digest Splitting:** Splits aggregated digest posts containing 10–14 numbered jobs (`1️⃣`, `2️⃣`, `3️⃣` or divider lines) into discrete, individually evaluated job items.
2. **Deterministic 3-Flow Experience Guard (Rule 23):**
   - **Range Flow:** Normalizes Unicode dashes (`–`, `—`, `-`) so broad entry ranges like `0–2`, `1–3`, and `2–4` are accurately approved, while `3–5`+ are rejected.
   - **Plus Flow:** Correctly evaluates `1+`, `2+` (approved) vs `3+`, `4+`, `5+` (rejected).
   - **Single Number:** Allows <= 2 years; disallows >= 3 years.
3. **Multi-Page Backward Pagination:** Automatically scans `/s/channel?before=...` to ensure full 7-day lookback coverage without missing older posts.
4. **Local Indore IT Priority Flag:** Whitelists and highlights tech companies in Indore (*Crestwin, Intellicus, BestPeers, YASH, InfoBeans, etc.*).
5. **Zero-Drop Categorization:** Categorizes into `ELIGIBLE_0_TO_2_YOE`, `REACH_OUT_3_TO_5_YOE`, `SENIOR_6_PLUS_YOE`, and `NON_DEV_OR_IRRELEVANT`.

## 📦 Usage
```bash
# Run harvest for the past 7 days (default)
node index.cjs

# Run harvest for past 3 days
node index.cjs --days 3

# Run unit tests
npm test
```

## 📂 Project Structure
```
telegram-recruiter-email-engine/
├── config.cjs                   # Central configuration (channels, whitelist)
├── index.cjs                    # Standalone CLI entrypoint
├── package.json
├── README.md
├── lib/
│   ├── block_parser.cjs         # Metadata extractor (email, company, role, exp, loc)
│   ├── digest_splitter.cjs      # Multi-job digest splitter
│   ├── experience_guard.cjs     # Deterministic 3-flow YOE evaluator
│   └── telegram_scraper.cjs     # HTTPS fetcher with backward pagination
└── test/
    └── run_tests.cjs            # Automated unit test suite (13 passing tests)
```
