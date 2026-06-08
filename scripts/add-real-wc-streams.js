const path = require('path');
const dbPath = path.join(__dirname, '..', 'src', 'services', 'database');
const Database = require(dbPath);

const channels = [
  { name: 'Alkass One (FC)', url: 'https://liveeu-gcp.alkassdigital.net/alkass1-p/main.m3u8', country: 'QA', lang: 'Arabic', quality: '1080p' },
  { name: 'Alkass Two (FC)', url: 'https://liveeu-gcp.alkassdigital.net/alkass2-p/main.m3u8', country: 'QA', lang: 'Arabic', quality: '1080p' },
  { name: 'Alkass Three (FC)', url: 'https://liveeu-gcp.alkassdigital.net/alkass3-p/main.m3u8', country: 'QA', lang: 'Arabic', quality: '1080p' },
  { name: 'Alkass Four (FC)', url: 'https://liveeu-gcp.alkassdigital.net/alkass4-p/main.m3u8', country: 'QA', lang: 'Arabic', quality: '1080p' },
  { name: 'Africa 24 Sport', url: 'https://africa24.vedge.infomaniak.com/livecast/ik:africa24sport/manifest.m3u8', country: 'FR', lang: 'French', quality: '1080p' },
  { name: 'Šport TV', url: 'http://88.212.15.27/live/test_rtvs_sport_hevc/playlist.m3u8', country: 'SK', lang: 'Slovak', quality: '1080p' },
  { name: 'ACI Sport TV', url: 'https://webstream.multistream.it/memfs/e2cb3629-c1a2-495b-b43a-9eb386f04ed8.m3u8', country: 'IT', lang: 'Italian', quality: '1080p' },
  { name: 'Al Iraqia Sport', url: 'https://imn-live.esite-lab.com/hls/iraqia-sports-1.m3u8', country: 'IQ', lang: 'Arabic', quality: '720p' },
];

const matches = Database.getUpcomingMatches();
console.log(`Found ${matches.length} WC 2026 matches`);

let streamCount = 0;
for (const match of matches) {
  const h = match.home_team, a = match.away_team;
  
  const isAfrican = ['South Africa','Morocco','Tunisia','Egypt','Senegal','Ghana','Cabo Verde','DR Congo','Nigeria','Algeria'].some(c => h.includes(c)||a.includes(c));
  const isEuropean = ['Germany','France','England','Spain','Netherlands','Portugal','Belgium','Italy','Croatia','Switzerland','Austria','Czechia','Sweden','Scotland','Wales'].some(c => h.includes(c)||a.includes(c));
  const isAsian = ['Japan','Korea Republic','IR Iran','Saudi Arabia','Qatar','Australia','Uzbekistan','Jordan','Iraq','Tajikistan'].some(c => h.includes(c)||a.includes(c));
  const isMENA = ['Qatar','Saudi Arabia','IR Iran','Morocco','Tunisia','Egypt','Algeria','Jordan','Iraq'].some(c => h.includes(c)||a.includes(c));
  
  let assigned = [];
  assigned.push(channels[0]); // Alkass One
  assigned.push(channels[1]); // Alkass Two
  
  if (isAfrican) assigned.push(channels[4]); // Africa 24
  if (isEuropean) { assigned.push(channels[5]); assigned.push(channels[6]); }
  if (isMENA) { assigned.push(channels[0]); assigned.push(channels[3]); }
  if (isAsian && !isMENA) assigned.push(channels[7]); // Iraqia
  
  const seen = new Set();
  assigned = assigned.filter(c => !seen.has(c.name) && seen.add(c.name));
  
  for (const ch of assigned.slice(0,3)) {
    try {
      Database.addStream(match.id, ch.name, ch.url, ch.quality, ch.lang, 'hls', ch.country === 'QA' ? 'MENA broadcaster' : 'International sports');
      streamCount++;
    } catch(e) { console.error(e.message); }
  }
}

console.log(`Added ${streamCount} real channel streams`);
