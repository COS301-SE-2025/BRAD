import requests

import requests
import time

MAX_RETRIES = 3
RETRY_BACKOFF = 2  # seconds

def fetch_pending_report(api_url, headers, verbose=False):
    attempt = 0

    while attempt < MAX_RETRIES:
        try:
            res = requests.get(f"{api_url}/pending-reports", headers=headers)

            if verbose:
                print(f"[FETCH] Attempt {attempt + 1}, Status: {res.status_code}")

            if res.status_code == 204:
                return None
            if res.status_code == 200:
                return res.json()
            else:
                raise RuntimeError(f"Unexpected status code: {res.status_code}")

        except requests.exceptions.RequestException as e:
            if verbose:
                print(f"[FETCH] Request failed: {e} (retrying...)")
            time.sleep(RETRY_BACKOFF * (2 ** attempt))
            attempt += 1

    raise RuntimeError("Failed to fetch pending report after retries.")


