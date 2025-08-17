from bs4 import BeautifulSoup
from urllib.parse import urljoin, urlparse, urlunparse, urldefrag

def normalize_url(u: str) -> str:
    if not u:
        return ""
    u = urldefrag(u)[0]
    p = urlparse(u)
    scheme = p.scheme.lower()
    netloc = p.netloc.lower()
    if (scheme == "http" and netloc.endswith(":80")) or (scheme == "https" and netloc.endswith(":443")):
        netloc = netloc.rsplit(":", 1)[0]
    return urlunparse((scheme, netloc, p.path or "/", p.params, p.query, ""))

def is_http(u: str) -> bool:
    return urlparse(u).scheme in ("http", "https")

def extract_links(soup: BeautifulSoup, base_url: str) -> list[str]:
    links = []
    for a in soup.find_all("a", href=True):
        href = a["href"].strip()
        if href.startswith(("mailto:", "tel:", "javascript:", "#")):
            continue
        abs_url = urljoin(base_url, href)
        links.append(normalize_url(abs_url))
    # de-dup preserving order
    seen, out = set(), []
    for l in links:
        if l and l not in seen:
            seen.add(l)
            out.append(l)
    return out
