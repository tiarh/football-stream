/**
 * fetch-poly-odds.js
 * Fetch WC 2026 winner odds from Polymarket gamma API
 * Run: node scripts/fetch-poly-odds.js
 * 
 * Fetches: "Will [TEAM] win the 2026 FIFA World Cup?" markets
 * and returns odds as decimal implied probability
 */

const POLYMARKET_API = 'https://gamma-api.polymarket.com/markets';

// Map PolyMarket country names to our team names
const TEAM_MAP = {
  'Spain': 'Spain',
  'England': 'England',
  'France': 'France',
  'Brazil': 'Brazil',
  'Argentina': 'Argentina',
  'Germany': 'Germany',
  'Portugal': 'Portugal',
  'Netherlands': 'Netherlands',
  'USA': 'USA',
  'Uruguay': 'Uruguay',
  'Mexico': 'Mexico',
  'Belgium': 'Belgium',
  'Colombia': 'Colombia',
  'Japan': 'Japan',
  'Morocco': 'Morocco',
  'Croatia': 'Croatia',
  'Switzerland': 'Switzerland',
  'Italy': 'Italy',
};

async function fetchWCOdds() {
  console.log('🏆 Fetching WC 2026 Winner odds from Polymarket...\n');

  try {
    const res = await fetch(`${POLYMARKET_API}?tagSlug=sports&limit=200&closed=false`);
    const data = await res.json();

    const odds = {};
    let found = 0;

    for (const market of data) {
      const q = market.question || '';
      
      // Match "Will [TEAM] win the 2026 FIFA World Cup?" pattern
      const match = q.match(/^Will (.+?) win the 2026 FIFA World Cup\?$/);
      if (!match) continue;

      const team = match[1].trim();
      if (!TEAM_MAP[team]) continue;

      const prices = JSON.parse(market.outcomePrices || '[]');
      const outcomes = JSON.parse(market.outcomes || '[]');
      
      if (prices.length < 2) continue;

      // price[0] = YES price, price[1] = NO price (typically)
      // For winner markets: YES = team wins, NO = team doesn't win
      const yesPrice = parseFloat(prices[0]);
      const noPrice = parseFloat(prices[1]);
      
      // Convert to implied probability
      // If YES price is 0.10, implied prob = 10%
      const yesProb = yesPrice;
      const noProb = noPrice;
      
      // Decimal odds (for display)
      const decimalOdds = yesProb > 0 ? (1 / yesProb).toFixed(2) : 'N/A';

      odds[team] = {
        yesPrice: yesPrice.toFixed(4),
        noPrice: noPrice.toFixed(4),
        impliedProb: (yesProb * 100).toFixed(1) + '%',
        decimalOdds: decimalOdds,
        volume: parseFloat(market.volume || 0).toFixed(0),
        liquidity: parseFloat(market.liquidity || 0).toFixed(0),
        slug: market.slug,
      };
      found++;
    }

    // Sort by implied probability (most likely first)
    const sorted = Object.entries(odds)
      .sort((a, b) => parseFloat(b[1].yesPrice) - parseFloat(a[1].yesPrice));

    console.log(`✅ Found ${found} WC 2026 winner markets\n`);
    console.log('📊 WC 2026 Winner Odds (sorted by probability):');
    console.log('─'.repeat(70));
    console.log(`${'Team'.padEnd(20)} ${'Implied Prob'.padEnd(12)} ${'Decimal Odds'.padEnd(14)} ${'Vol ($)'.padEnd(12)}`);
    console.log('─'.repeat(70));
    
    for (const [team, data] of sorted) {
      console.log(
        `${team.padEnd(20)} ${data.impliedProb.padEnd(12)} ${data.decimalOdds.padEnd(14)} $${(parseFloat(data.volume)).toLocaleString().padEnd(12)}`
      );
    }

    console.log('\n💾 Saving to data/poly-odds.json...');
    
    const fs = require('fs');
    const outDir = '/root/football-stream/data';
    if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
    
    fs.writeFileSync(
      `${outDir}/poly-odds.json`,
      JSON.stringify({
        updatedAt: new Date().toISOString(),
        source: 'https://gamma-api.polymarket.com',
        odds
      }, null, 2)
    );

    console.log('✅ Saved!\n');
    console.log(`📁 File: ${outDir}/poly-odds.json`);
    
    return odds;

  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  }
}

fetchWCOdds();