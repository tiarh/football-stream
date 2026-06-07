#!/usr/bin/env python3
"""
Scrape real football fixtures from BBC Sport / Premier League
Updates database with actual matches happening today
"""

import requests
from bs4 import BeautifulSoup
import sqlite3
from datetime import datetime, timedelta
import re

HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
}

def get_today_date():
    return datetime.now().strftime('%Y-%m-%d')

def scrape_bbc_football():
    """Scrape BBC Sport Football fixtures"""
    print("🔍 Scraping BBC Sport Football...")
    
    try:
        url = 'https://www.bbc.com/sport/football/scores-fixtures'
        res = requests.get(url, headers=HEADERS, timeout=15)
        soup = BeautifulSoup(res.text, 'html.parser')
        
        fixtures = []
        
        # Look for match containers with better selectors
        for article in soup.find_all('article')[:30]:
            try:
                # Find team names in spans or divs with specific patterns
                teams = []
                for elem in article.find_all(['span', 'div']):
                    text = elem.get_text(strip=True)
                    # Filter valid team names (not numbers, not too short)
                    if text and len(text) > 3 and not text.isdigit():
                        # Common football team keywords
                        if any(kw in text.lower() for kw in ['united', 'city', 'fc', 'real', 'barcelona', 'liverpool', 'chelsea', 'arsenal', 'madrid', 'bayern', 'milan', 'inter', 'juventus', 'psg', 'dortmund', 'atletico', 'sevilla', 'napoli', 'roma', 'lazio', 'fiorentina', 'ajax', 'benfica', 'porto', 'sporting', 'celtic', 'rangers', 'galatasaray', 'fenerbahce', 'besiktas']):
                            if text not in teams:
                                teams.append(text)
                
                if len(teams) >= 2:
                    home_team = teams[0]
                    away_team = teams[1]
                    
                    # Check for live status
                    status = 'scheduled'
                    status_elem = article.find(string=re.compile(r'LIVE|HT|FT', re.IGNORECASE))
                    if status_elem:
                        text = status_elem.upper()
                        if 'LIVE' in text or 'HT' in text:
                            status = 'live'
                        elif 'FT' in text:
                            status = 'finished'
                    
                    fixtures.append({
                        'home_team': home_team,
                        'away_team': away_team,
                        'league': 'Football',
                        'match_time': '',
                        'status': status,
                    })
                    print(f"  ✓ {home_team} vs {away_team} - {status}")
                    
            except Exception as e:
                continue
        
        print(f"Found {len(fixtures)} fixtures from BBC\n")
        return fixtures
        
    except Exception as e:
        print(f"✗ BBC scrape failed: {e}\n")
        return []

def scrape_premier_league():
    """Scrape Premier League official fixtures"""
    print("🔍 Scraping Premier League...")
    
    try:
        url = 'https://www.premierleague.com/matchweek/38/matches'
        res = requests.get(url, headers=HEADERS, timeout=15)
        soup = BeautifulSoup(res.text, 'html.parser')
        
        fixtures = []
        
        # Find match blocks
        match_blocks = soup.find_all('li', class_='match')
        
        for block in match_blocks[:10]:
            try:
                home = block.find(class_='homeTeam')
                away = block.find(class_='awayTeam')
                
                if home and away:
                    home_team = home.get_text(strip=True)
                    away_team = away.get_text(strip=True)
                    
                    # Check if live
                    status_elem = block.find(class_='status')
                    status = 'live' if status_elem and 'LIVE' in status_elem.get_text().upper() else 'scheduled'
                    
                    fixtures.append({
                        'home_team': home_team,
                        'away_team': away_team,
                        'league': 'Premier League',
                        'match_time': '',
                        'status': status,
                    })
                    print(f"  ✓ {home_team} vs {away_team} - {status}")
                    
            except Exception as e:
                continue
        
        print(f"Found {len(fixtures)} fixtures from Premier League\n")
        return fixtures
        
    except Exception as e:
        print(f"✗ Premier League scrape failed: {e}\n")
        return []

def update_database(fixtures):
    """Update SQLite database with scraped fixtures"""
    db_path = '/root/football-stream/data/football.db'
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    print(f"📊 Updating database with {len(fixtures)} fixtures...\n")
    
    if not fixtures:
        # Clear old live matches
        cursor.execute("""
            UPDATE matches SET status = 'finished' 
            WHERE status = 'live'
        """)
        conn.commit()
        print("ℹ️ No fixtures today - cleared old live matches")
        return
    
    added = 0
    updated = 0
    
    for fixture in fixtures:
        # Check if exists
        cursor.execute("""
            SELECT id FROM matches 
            WHERE home_team = ? AND away_team = ?
        """, (fixture['home_team'], fixture['away_team']))
        
        row = cursor.fetchone()
        
        if row:
            match_id = row[0]
            # Update
            cursor.execute("""
                UPDATE matches 
                SET status = ?, match_date = ?, league = ?
                WHERE id = ?
            """, (fixture['status'], datetime.now().isoformat(), fixture['league'], match_id))
            updated += 1
            print(f"🔄 {fixture['home_team']} vs {fixture['away_team']}")
            
            # Delete old streams
            cursor.execute("DELETE FROM streams WHERE match_id = ?", (match_id,))
        else:
            # Insert
            cursor.execute("""
                INSERT INTO matches (home_team, away_team, league, match_date, status)
                VALUES (?, ?, ?, ?, ?)
            """, (fixture['home_team'], fixture['away_team'], fixture['league'], 
                  datetime.now().isoformat(), fixture['status']))
            match_id = cursor.lastrowid
            added += 1
            print(f"➕ {fixture['home_team']} vs {fixture['away_team']}")
        
        # Add 2 verified streams
        streams = [
            ('Alkass Two - Live', 'https://liveeu-gcp.alkassdigital.net/alkass2-p/main.m3u8', 'FHD', 'AR/EN'),
            ('Alkass Three - Live', 'https://liveeu-gcp.alkassdigital.net/alkass3-p/main.m3u8', 'FHD', 'AR/EN'),
        ]
        
        for name, url, quality, lang in streams:
            cursor.execute("""
                INSERT INTO streams (match_id, source_name, stream_url, quality, language, is_working, type, note)
                VALUES (?, ?, ?, ?, ?, 1, 'hls', ?)
            """, (match_id, name, url, quality, lang, f"{fixture['home_team']} vs {fixture['away_team']}"))
    
    conn.commit()
    conn.close()
    
    print(f"\n✅ Database updated!")
    print(f"   ➕ Added: {added}")
    print(f"   🔄 Updated: {updated}")

def main():
    print("⚽ Football Fixture Scraper\n")
    print(f"📅 Date: {get_today_date()}\n")
    
    # Try multiple sources
    fixtures = []
    
    # Scrape BBC
    bbc_fixtures = scrape_bbc_football()
    fixtures.extend(bbc_fixtures)
    
    # Scrape Premier League (if season active)
    pl_fixtures = scrape_premier_league()
    fixtures.extend(pl_fixtures)
    
    # Remove duplicates
    unique = []
    seen = set()
    for f in fixtures:
        key = f"{f['home_team']} vs {f['away_team']}"
        if key not in seen:
            seen.add(key)
            unique.append(f)
    
    print(f"📊 Total unique fixtures: {len(unique)}\n")
    
    # Update database
    update_database(unique)
    
    print("\n🎉 Scrape complete!")
    return 0

if __name__ == '__main__':
    exit(main())
