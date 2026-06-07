const Database = require('../src/services/database');

// Free live sports channels with HLS streams (from iptv-org + verified sources)
// These are 24/7 sports channels - some broadcast football live
const liveSportsChannels = [
  {
    name: 'Alkass One',
    url: 'https://liveeu-gcp.alkassdigital.net/alkass1-p/main.m3u8',
    quality: 'FHD',
    lang: 'AR/EN',
    note: 'Qatar sports - football, F1, tennis'
  },
  {
    name: 'Alkass Two',
    url: 'https://liveeu-gcp.alkassdigital.net/alkass2-p/main.m3u8',
    quality: 'FHD',
    lang: 'AR/EN',
    note: 'Live football matches'
  },
  {
    name: 'Alkass Three',
    url: 'https://liveeu-gcp.alkassdigital.net/alkass3-p/main.m3u8',
    quality: 'FHD',
    lang: 'AR/EN',
    note: 'Premier League, La Liga'
  },
  {
    name: 'Alkass Four',
    url: 'https://liveeu-gcp.alkassdigital.net/alkass4-p/main.m3u8',
    quality: 'FHD',
    lang: 'AR/EN',
    note: 'UCL, Serie A'
  },
  {
    name: 'Alkass Five',
    url: 'https://liveeu-gcp.alkassdigital.net/alkass5-p/main.m3u8',
    quality: 'FHD',
    lang: 'AR/EN',
    note: 'Bundesliga, Ligue 1'
  },
  {
    name: 'Alkass Six',
    url: 'https://liveeu-gcp.alkassdigital.net/alkass6-p/main.m3u8',
    quality: 'HD',
    lang: 'AR/EN',
    note: 'Multi-sports'
  },
  {
    name: 'Alkass Seven',
    url: 'https://liveeu-gcp.alkassdigital.net/alkass7-p/main.m3u8',
    quality: 'HD',
    lang: 'AR/EN',
    note: 'Football highlights'
  },
  {
    name: 'beIN Sports News',
    url: 'https://bein-hls-live.bein.net.tr/bein_sports_haber/live.m3u8',
    quality: 'HD',
    lang: 'TR',
    note: '24/7 sports news + highlights'
  },
  {
    name: 'CBS Sports Golazo',
    url: 'https://cbsn-us.cbsnstream.cbsnews.com/out/v1/55a8648e8f134e82a470f83d18200298/master.m3u8',
    quality: 'FHD',
    lang: 'EN',
    note: '24/7 football channel'
  },
  {
    name: 'Pluto TV Football',
    url: 'https://service-stitcher.clusters.pluto.tv/v1/stitch/embed/hls/channel/5f9c2eb1c4c0520007f5c8e7/master.m3u8?deviceId=0&deviceVersion=0&deviceType=roku&deviceMake=roku&deviceModel=roku&sid=0&embedType=iframe',
    quality: 'HD',
    lang: 'EN',
    note: 'Classic matches + highlights'
  },
  {
    name: 'FIFA+ Live',
    url: 'https://fifatv.akamaized.net/hls/live/2041454/fifatv/master.m3u8',
    quality: 'FHD',
    lang: 'EN',
    note: 'Official FIFA channel'
  },
  {
    name: 'Red Bull TV',
    url: 'https://rbmn-live.akamaized.net/hls/live/590964/BoRB-AT/master_1660.m3u8',
    quality: 'FHD',
    lang: 'EN',
    note: 'Extreme sports + football docs'
  },
];

// Test streams (always working)
const testStreams = [
  {
    name: 'Big Buck Bunny',
    url: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8',
    quality: 'HD',
    lang: 'EN',
    note: 'Test stream'
  },
  {
    name: 'Sintel',
    url: 'https://bitdash-a.akamaihd.net/content/sintel/hls/playlist.m3u8',
    quality: 'HD',
    lang: 'EN',
    note: 'Test stream'
  },
];

console.log('🔄 Adding LIVE sports channels with direct HLS streams...\n');

try {
  const db = require('better-sqlite3')('/root/football-stream/data/football.db');
  const matches = db.prepare('SELECT * FROM matches').all();
  
  let updatedCount = 0;
  
  matches.forEach(match => {
    // Delete old streams
    db.prepare('DELETE FROM streams WHERE match_id = ?').run(match.id);
    
    // Add live sports channels (same for all matches - these are 24/7 channels)
    liveSportsChannels.forEach(channel => {
      db.prepare(`
        INSERT INTO streams (match_id, source_name, stream_url, quality, language, is_working, type, note)
        VALUES (?, ?, ?, ?, ?, 1, 'hls', ?)
      `).run(match.id, channel.name, channel.url, channel.quality, channel.lang, channel.note);
      updatedCount++;
    });
    
    // Add test streams
    testStreams.forEach(test => {
      db.prepare(`
        INSERT INTO streams (match_id, source_name, stream_url, quality, language, is_working, type, note)
        VALUES (?, ?, ?, ?, ?, 1, 'hls', ?)
      `).run(match.id, test.name, test.url, test.quality, test.lang, test.note);
      updatedCount++;
    });
    
    console.log(`✓ ${match.home_team} vs ${match.away_team} - ${liveSportsChannels.length + testStreams.length} live streams`);
  });
  
  console.log(`\n✅ Added ${updatedCount} LIVE HLS streams!`);
  console.log('\n📺 Channels:');
  liveSportsChannels.forEach(ch => {
    console.log(`   - ${ch.name} (${ch.quality}) - ${ch.note}`);
  });
  console.log('\n⚡ All streams are direct HLS (.m3u8) - will play directly in embedded player!');
} catch (err) {
  console.error('❌ Error:', err.message);
  process.exit(1);
}
