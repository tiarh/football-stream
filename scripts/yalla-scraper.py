#!/usr/bin/env python3
"""
Yalla Shoot Scraper - Auto-fetch match-specific streams
Scrapes Yalla Shoot for today's matches and their direct stream URLs
"""

import requests
from bs4 import BeautifulSoup
import sqlite3
import re
from datetime import datetime, timedelta
import json

# Yalla Shoot domains (rotate if blocked)
DOMAINS = [
    'https://www.yallashoot360.com',
    'https://www.yallashoot.live',
    'https://www.yallashoot.today',
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
            res = requests.get(domain, headers=HEADERS, timeout=10, allow_redirects=True)
            if res.status_code == 200:
                print(f"✓ Using domain: {domain}")
                return domain
        except Exception as e:
            print(f"✗ {domain}: {e}")
            continue
    return None

def extract_stream_url(html, match_url=''):
    """Extract direct HLS stream URL from page HTML"""
    # Look for .m3u8 URLs in various patterns
    patterns = [
        r'(https?://[^\s\'"]+\.m3u8[^\s\'"]*)',
        r'source:\s*["\']([^"\']+\.m3u8[^"\']*)["\']',
        r'file:\s*["\']([^"\']+\.m3u8[^"\']*)["\']',
        r'data-stream=["\']([^"\']+\.m3u8[^"\']*)["\']',
    ]
    
    for pattern in patterns:
        matches = re.findall(pattern, html, re.IGNORECASE)
        if matches:
            for url in matches:
                url = url.replace('\\', '').replace('"', '').replace("'", '').strip()
                if url.startswith('http') and 'm3u8' in url:
                    print(f"  Found stream: {url[:80]}...")
                    return url
    
    # Look for iframe with stream
    iframe_matches = re.findall(r'<iframe[^>]+src=["\']([^"\']+)["\']', html, re.IGNORECASE)
    for iframe in iframe_matches:
        if 'embed' in iframe or 'stream' in iframe:
            # Fetch iframe content
            try:
                iframe_res = requests.get(iframe, headers=HEADERS, timeout=10)
                iframe_stream = extract_stream_url(iframe_res.text, iframe)
                if iframe_stream:
                    return iframe_stream
            except:
                pass
    
    return None

def scrape_matches(base_url):
    """Scrape today's matches from Yalla Shoot"""
    matches = []
    
    try:
        res = requests.get(base_url, headers=HEADERS, timeout=15, allow_redirects=True)
        soup = BeautifulSoup(res.text, 'html.parser')
        
        # Try to find match links (various selectors)
        match_links = []
        
        # Look for match cards/links
        for tag in ['a', 'div']:
            elements = soup.find_all(tag, href=re.compile(r'watch|match|live|game', re.IGNORECASE))
            for elem in elements:
                href = elem.get('href', '')
                if href and href not in match_links:
                    match_links.append(href)
        
        # Also look in specific containers
        containers = soup.find_all(class_=re.compile(r'match|game|live|event', re.IGNORECASE))
        for container in containers:
            links = container.find_all('a', href=True)
            for link in links:
                href = link.get('href', '')
                if href and href not in match_links:
                    match_links.append(href)
        
        print(f"Found {len(match_links)} potential match links")
        
        # Process each match link
        for link_href in match_links[:15]:  # Limit to 15 matches
            try:
                if not link_href.startswith('http'):
                    if link_href.startswith('/'):
                        match_url = base_url + link_href
                    else:
                        match_url = base_url + '/' + link_href
                else:
                    match_url = link_href
                
                # Fetch match page
                match_res = requests.get(match_url, headers=HEADERS, timeout=10)
                match_soup = BeautifulSoup(match_res.text, 'html.parser')
                
                # Extract teams (try multiple selectors)
                home_team = None
                away_team = None
                
                # Method 1: Look for team names in specific classes
                for home_cls in ['home', 'team-home', 'team1', 'home-team']:
                    elem = match_soup.find(class_=re.compile(home_cls, re.IGNORECASE))
                    if elem:
                        home_team = elem.get_text(strip=True)
                        break
                
                for away_cls in ['away', 'team-away', 'team2', 'away-team']:
                    elem = match_soup.find(class_=re.compile(away_cls, re.IGNORECASE))
                    if elem:
                        away_team = elem.get_text(strip=True)
                        break
                
                # Method 2: Look in title
                if not home_team or not away_team:
                    title = match_soup.find('title')
                    if title:
                        title_text = title.get_text(strip=True)
                        if ' vs ' in title_text:
                            parts = title_text.split(' vs ')
                            if len(parts) >= 2:
                                home_team = parts[0].strip()
                                away_team = parts[1].split(' - ')[0].split('|')[0].strip()
                
                # Method 3: Look for h1/h2 tags with team names
                if not home_team or not away_team:
                    for header in match_soup.find_all(['h1', 'h2']):
                        text = header.get_text(strip=True)
                        if ' vs ' in text:
                            parts = text.split(' vs ')
                            if len(parts) >= 2:
                                home_team = parts[0].strip()
                                away_team = parts[1].split(' - ')[0].strip()
                                break
                
                if not home_team or not away_team:
                    continue
                
                # Extract stream URL
                stream_url = extract_stream_url(match_res.text, match_url)
                
                if stream_url:
                    # Determine league from context
                    league = 'Live Football'
                    league_keywords = {
                        'premier league': 'Premier League',
                        'la liga': 'La Liga',
                        'serie a': 'Serie A',
                        'bundesliga': 'Bundesliga',
                        'ucl': 'UCL',
                        'champions league': 'UCL',
                        'world cup': 'World Cup',
                    }
                    for keyword, league_name in league_keywords.items():
                        if keyword in match_res.text.lower():
                            league = league_name
                            break
                    
                    matches.append({
                        'home_team': home_team,
                        'away_team': away_team,
                        'stream_url': stream_url,
                        'match_url': match_url,
                        'league': league,
                        'quality': 'HD',
                        'language': 'AR/EN',
                        'status': 'live'
                    })
                    print(f"✓ {home_team} vs {away_team} - Stream found")
                else:
                    print(f"✗ {home_team} vs {away_team} - No stream URL")
                    
            except Exception as e:
                print(f"  Error: {e}")
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
            print(f"→ Updating: {match['home_team']} vs {match['away_team']}")
            
            # Update match status to live
            cursor.execute('''
                UPDATE matches SET status = 'live', match_date = ?
                WHERE id = ?
            ''', (datetime.now().isoformat(), match_id))
            
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
            print(f"→ Added: {match['home_team']} vs {match['away_team']}")
        
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
        print("💡 You can manually add streams via /api/scrape endpoint")
        return 1
    
    # Update database
    update_database(matches)
    
    print(f"\n🎉 Scraped {len(matches)} matches with direct streams!")
    return 0

if __name__ == '__main__':
    exit(main())
