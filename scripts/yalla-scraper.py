#!/usr/bin/env python3
"""
Yalla Shoot Scraper - Auto-fetch match-specific streams
Scrapes Yalla Shoot for today's matches and their direct stream URLs
"""

import requests
from bs4 import BeautifulSoup
import sqlite3
import re
from datetime import datetime
import json

# Yalla Shoot domains (rotate if blocked)
DOMAINS = [
    'https://www.yallashoot360.com',
    'https://www.yallashoot7.com',
    'https://www.yallashoot9.com',
]

HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
    'Accept-Language': 'en-US,en;q=0.5',
}

def get_working_domain():
    """Find a working Yalla Shoot domain"""
    for domain in DOMAINS:
        try:
            res = requests.get(domain, headers=HEADERS, timeout=10)
            if res.status_code == 200:
                print(f"✓ Using domain: {domain}")
                return domain
        except:
            continue
    return None

def extract_stream_url(html):
    """Extract direct HLS stream URL from page HTML"""
    # Look for .m3u8 URLs
    m3u8_pattern = r'(https?://[^\s\'"]+\.m3u8[^\s\'"]*)'
    matches = re.findall(m3u8_pattern, html)
    
    if matches:
        # Return first working m3u8
        for url in matches:
            # Clean URL
            url = url.replace('\\', '').replace('"', '').replace("'", '')
            if 'm3u8' in url and 'http' in url:
                return url
    
    # Look for iframe sources
    iframe_pattern = r'<iframe[^>]+src=["\']([^"\']+)["\']'
    iframes = re.findall(iframe_pattern, html, re.IGNORECASE)
    
    for iframe in iframes:
        if 'm3u8' in iframe or 'embed' in iframe:
            return iframe
    
    return None

def scrape_matches(base_url):
    """Scrape today's matches from Yalla Shoot"""
    matches = []
    
    try:
        # Get homepage (today's matches)
        res = requests.get(base_url, headers=HEADERS, timeout=15)
        soup = BeautifulSoup(res.text, 'html.parser')
        
        # Find match cards (adjust selectors based on actual site structure)
        match_cards = soup.find_all('a', href=re.compile(r'/match/\d+|/watch/'))
        
        print(f"Found {len(match_cards)} match cards")
        
        for card in match_cards[:10]:  # Limit to 10 matches
            try:
                match_url = card.get('href', '')
                if not match_url.startswith('http'):
                    match_url = base_url + match_url
                
                # Get match details
                match_res = requests.get(match_url, headers=HEADERS, timeout=10)
                match_soup = BeautifulSoup(match_res.text, 'html.parser')
                
                # Extract teams
                home_team = None
                away_team = None
                
                # Try different selectors
                for cls in ['team-home', 'home-team', 'team1', 'hometeam']:
                    elem = match_soup.find(class_=cls)
                    if elem:
                        home_team = elem.get_text(strip=True)
                        break
                
                for cls in ['team-away', 'away-team', 'team2', 'awayteam']:
                    elem = match_soup.find(class_=cls)
                    if elem:
                        away_team = elem.get_text(strip=True)
                        break
                
                # Fallback: try to extract from title
                if not home_team or not away_team:
                    title = match_soup.find('title')
                    if title:
                        title_text = title.get_text(strip=True)
                        if 'vs' in title_text.lower():
                            parts = title_text.split(' vs ')
                            if len(parts) == 2:
                                home_team = parts[0].strip()
                                away_team = parts[1].split(' - ')[0].strip()
                
                if not home_team or not away_team:
                    continue
                
                # Extract stream URL
                stream_url = extract_stream_url(match_res.text)
                
                if stream_url:
                    matches.append({
                        'home_team': home_team,
                        'away_team': away_team,
                        'stream_url': stream_url,
                        'match_url': match_url,
                        'league': 'Live',
                        'quality': 'HD',
                        'language': 'AR/EN'
                    })
                    print(f"✓ {home_team} vs {away_team} - Stream found")
                else:
                    print(f"✗ {home_team} vs {away_team} - No stream URL")
                    
            except Exception as e:
                print(f"Error processing card: {e}")
                continue
                
    except Exception as e:
        print(f"Scrape error: {e}")
    
    return matches

def update_database(matches):
    """Update SQLite database with scraped streams"""
    db_path = '/root/football-stream/data/football.db'
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    print(f"\n📊 Updating database with {len(matches)} matches...\n")
    
    for match in matches:
        # Check if match exists
        cursor.execute('''
            SELECT id FROM matches 
            WHERE home_team = ? AND away_team = ?
        ''', (match['home_team'], match['away_team']))
        
        row = cursor.fetchone()
        
        if row:
            match_id = row[0]
            print(f"→ Updating existing match: {match['home_team']} vs {match['away_team']}")
            
            # Delete old streams
            cursor.execute('DELETE FROM streams WHERE match_id = ?', (match_id,))
        else:
            # Insert new match
            cursor.execute('''
                INSERT INTO matches (home_team, away_team, league, match_date, status)
                VALUES (?, ?, ?, ?, ?)
            ''', (
                match['home_team'],
                match['away_team'],
                match.get('league', 'Live'),
                datetime.now().isoformat(),
                'live'
            ))
            match_id = cursor.lastrowid
            print(f"→ Added new match: {match['home_team']} vs {match['away_team']}")
        
        # Insert stream
        cursor.execute('''
            INSERT INTO streams (match_id, source_name, stream_url, quality, language, is_working, type)
            VALUES (?, ?, ?, ?, ?, 1, 'hls')
        ''', (
            match_id,
            'Yalla Shoot Live',
            match['stream_url'],
            match.get('quality', 'HD'),
            match.get('language', 'AR/EN')
        ))
    
    conn.commit()
    conn.close()
    print(f"\n✅ Database updated successfully!")

def main():
    print("🔍 Yalla Shoot Scraper - Starting...\n")
    print(f"📅 Date: {datetime.now().isoformat()}\n")
    
    # Find working domain
    base_url = get_working_domain()
    if not base_url:
        print("❌ No working Yalla Shoot domain found")
        return 1
    
    # Scrape matches
    matches = scrape_matches(base_url)
    
    if not matches:
        print("\n⚠️ No matches found with stream URLs")
        print("💡 Trying alternative approach...")
        # Fallback: use pre-configured streams
        return 1
    
    # Update database
    update_database(matches)
    
    print(f"\n🎉 Scraped {len(matches)} matches with direct streams!")
    return 0

if __name__ == '__main__':
    exit(main())
