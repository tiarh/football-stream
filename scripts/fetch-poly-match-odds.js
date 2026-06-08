/**
 * fetch-poly-match-odds.js
 * Scrape WC 2026 match-by-match odds (Win/Draw/Lose) from Polymarket
 * 
 * Source: polymarket.com/sports/world-cup/games
 * Each match page has 3 separate binary markets:
 *   - "Will HOME_TEAM win on YYYY-MM-DD?"  → home price
 *   - "Will HOME vs AWAY end in a draw?"    → draw price
 *   - "Will AWAY_TEAM win on YYYY-MM-DD?"  → away price
 * 
 * Run: node scripts/fetch-poly-match-odds.js
 */

const https = require('https');
const fs = require('fs');

const POLY_BASE = 'https://polymarket.com';
const OUTFILE = '/root/football-stream/data/poly-match-odds.json';

function httpsGet(url) {
  return new Promise((resolve, reject) => {
    https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' } }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(data));
    }).on('error', reject);
  });
}

function extractOddsFromHTML(html, home, away) {
  // 3 binary markets per match:
  // 1. home win: "Will {home} win on 2026-XX-XX?"
  // 2. draw: "Will {home} vs {away} end in a draw?"
  // 3. away win: "Will {away} win on 2026-XX-XX?"
  
  const patterns = [
    {
      label: 'home',
      qFrag: `Will ${home} win`,
    },
    {
      label: 'draw',
      qFrag: 'end in a draw',
    },
    {
      label: 'away',
      qFrag: `Will ${away} win`,
    },
  ];

  const odds = {};
  
  for (const p of patterns) {
    const idx = html.indexOf(p.qFrag);
    if (idx < 0) continue;
    
    const chunk = html.slice(idx, idx + 2000);
    const opMatch = chunk.match(/"outcomePrices":\s*\[([^\]]+)\]/);
    if (!opMatch) continue;
    
    const prices = opMatch[1].match(/[\d.]+/g) || [];
    if (prices.length < 2) continue;
    
    // First number is YES price (probability)
    const yesProb = parseFloat(prices[0]);
    odds[p.label] = yesProb;
  }

  if (Object.keys(odds).length < 2) return null;
  
  return {
    homePercent: odds.home ? (odds.home * 100).toFixed(1) : null,
    drawPercent: odds.draw ? (odds.draw * 100).toFixed(1) : null,
    awayPercent: odds.away ? (odds.away * 100).toFixed(1) : null,
  };
}

async function getGamesList() {
  console.log('📋 Fetching WC 2026 games list...');
  const html = await httpsGet(`${POLY_BASE}/sports/world-cup/games`);

  const scriptMatch = html.match(/<script[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g);
  if (!scriptMatch) throw new Error('No JSON-LD found');

  const matches = [];
  for (const script of scriptMatch) {
    const jsonMatch = script.match(/<script[^>]*>([\s\S]*?)<\/script>/);
    if (!jsonMatch) continue;
    try {
      const data = JSON.parse(jsonMatch[1]);
      if (data['@type'] === 'CollectionPage') {
        const items = data.mainEntity?.itemListElement || [];
        for (const item of items) {
          const e = item.item;
          if (e['@type'] === 'Event') {
            const slug = e.url?.replace(POLY_BASE, '');
            const name = e.name || '';
            const date = e.startDate || '';
            if (slug && name) {
              matches.push({ slug, name, date });
            }
          }
        }
      }
    } catch (e) { /* skip */ }
  }

  return matches;
}

async function main() {
  console.log('🏆 WC 2026 Match Odds Fetcher\n');

  const matches = await getGamesList();
  console.log(`Found ${matches.length} matches\n`);

  const allOdds = {};
  let fetched = 0, failed = 0;

  for (const m of matches) {
    const parts = m.name.split(' vs. ');
    const home = parts[0]?.trim();
    const away = parts[1]?.trim();
    
    process.stdout.write(`Fetching: ${m.name}... `);

    try {
      const html = await httpsGet(`${POLY_BASE}${m.slug}`);
      const odds = extractOddsFromHTML(html, home, away);
      
      if (odds && (odds.homePercent || odds.awayPercent)) {
        allOdds[m.slug] = {
          home,
          away,
          date: m.date,
          homePercent: odds.homePercent,
          drawPercent: odds.drawPercent,
          awayPercent: odds.awayPercent,
        };
        console.log(`✅ Home ${odds.homePercent}% | Draw ${odds.drawPercent}% | Away ${odds.awayPercent}%`);
        fetched++;
      } else {
        console.log(`❌ could not extract odds`);
        failed++;
      }
    } catch (e) {
      console.log(`❌ ${e.message}`);
      failed++;
    }

    await new Promise(r => setTimeout(r, 300));
  }

  console.log(`\n📊 Summary: ${fetched} fetched, ${failed} failed`);

  const output = {
    updatedAt: new Date().toISOString(),
    source: 'polymarket.com/sports/world-cup/games',
    matchCount: fetched,
    odds: allOdds,
  };

  fs.writeFileSync(OUTFILE, JSON.stringify(output, null, 2));
  console.log(`💾 Saved to ${OUTFILE}`);

  console.log('\n📋 All matches:');
  for (const slug of Object.keys(allOdds)) {
    const o = allOdds[slug];
    console.log(`  ${o.home} vs ${o.away}: ${o.homePercent}% / ${o.drawPercent}% / ${o.awayPercent}%`);
  }
}

main().catch(console.error);