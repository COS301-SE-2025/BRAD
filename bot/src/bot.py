# bot.py
import requests
from bs4 import BeautifulSoup
import os
from dotenv import load_dotenv

load_dotenv()

API_URL = os.getenv("API_URL")
BAK = os.getenv("BAK")

def basic_fetch(domain: str):
    url = f"http://{domain}"
    try:
        print(f"[*] Fetching: {url}")
        response = requests.get(url, timeout=5)
        return response.text
    except Exception as e:
        print(f"[!] Failed to fetch {url}: {e}")
        return None

if __name__ == "__main__":
    import sys

    if len(sys.argv) != 2:
        print("Usage: python bot.py <domain>")
        exit(1)

    domain = sys.argv[1]
    html = basic_fetch(domain)

    if html:
        print("[✓] Page fetched. Length:", len(html))
    else:
        print("[x] Could not fetch page.")

    soup = BeautifulSoup(html, 'html.parser')
    print(soup.title.text)
