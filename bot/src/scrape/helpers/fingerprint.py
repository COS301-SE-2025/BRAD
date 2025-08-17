from __future__ import annotations
from dataclasses import dataclass
import random, re
from playwright_stealth import stealth_sync
from typing import Dict, Tuple, Optional

# Simple platform mapping based on UA; tweak as needed
def _infer_platform_from_ua(ua: str) -> str:
    if "Windows" in ua:
        return "Win32"
    if "Macintosh" in ua:
        return "MacIntel"
    if "Linux" in ua:
        return "Linux x86_64"
    return "Win32"

@dataclass
class Fingerprint:
    user_agent: str
    accept_language: str = "en-US,en;q=0.9"
    timezone: str = "America/New_York"
    viewport: Tuple[int, int] = (1366, 768)
    device_scale_factor: float = 1.0
    platform: str = "Win32"
    hardware_concurrency: int = 8
    device_memory_gb: int = 8
    color_scheme: str = "light"  # 'light' or 'dark'

    def extra_headers(self) -> Dict[str, str]:
        # Keep it minimal; Chromium will provide sec-ch headers itself
        return {
            "Accept-Language": self.accept_language,
            "Upgrade-Insecure-Requests": "1",
            "DNT": "1",
            "Cache-Control": "max-age=0",
        }

def generate_fingerprint(user_agent: str,
                         randomize: bool = True,
                         locale_list: Optional[list[str]] = None,
                         tz_list: Optional[list[str]] = None) -> Fingerprint:
    locale_list = locale_list or [
        "en-US,en;q=0.9", "en-GB,en;q=0.9", "en-ZA,en;q=0.9",
        "en-CA,en;q=0.9", "en-AU,en;q=0.9"
    ]
    tz_list = tz_list or [
        "America/New_York", "Europe/London", "Africa/Johannesburg",
        "Europe/Berlin", "America/Los_Angeles"
    ]
    viewport_choices = [(1366,768), (1440,900), (1536,864), (1600,900), (1920,1080)]
    dpr_choices = [1.0, 1.25, 1.5, 2.0]
    hc_choices = [4, 6, 8, 12]
    dm_choices = [4, 8, 16]

    plat = _infer_platform_from_ua(user_agent)

    if not randomize:
        return Fingerprint(user_agent=user_agent, platform=plat)

    return Fingerprint(
        user_agent=user_agent,
        accept_language="en-US,en;q=0.9",
        viewport={"width": 1366, "height": 768},
        timezone="Africa/Johannesburg",
        platform="Win32",
    )

def build_context_and_page(
    pw,
    proxy_str: Optional[str],
    fp: Fingerprint,
    *,
    headless: bool = True,        # NEW
    use_stealth: bool = True      # NEW
):
    launch_args: Dict[str, Any] = {
        "headless": headless,
        # A few flags that reduce automation fingerprints (stealth also helps)
        "args": [
            "--disable-blink-features=AutomationControlled",
            "--disable-infobars",
            "--no-default-browser-check",
            "--no-first-run",
        ],
    }
    if proxy_str:
        launch_args["proxy"] = {"server": proxy_str}

    browser = pw.chromium.launch(**launch_args)

    context = browser.new_context(
        user_agent=fp.user_agent,
        locale=fp.accept_language,               # Accept-Language at the context level
        viewport=fp.viewport,
        timezone_id=fp.timezone,
        java_script_enabled=True,
        # NOTE: Playwright doesn’t let us set sec-ch-ua directly; that’s okay.
        extra_http_headers={
            "Accept-Language": fp.accept_language,
            "DNT": "1",
            # "Referer": "...",   # set if you later want referrer spoofing per navigation
        },
    )

    page = context.new_page()

    # Apply stealth last so it can patch the JS runtime for the page
    if use_stealth:
        stealth_sync(page)

    # Optional: small navigation timing budget tweak for interstitials
    page.set_default_navigation_timeout(20000)

    return browser, context, page
