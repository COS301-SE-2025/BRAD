from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from bs4 import BeautifulSoup

def perform_scraping(domain):
    options = Options()
    options.add_argument("--headless")
    options.add_argument("--no-sandbox")
    options.add_argument("--disable-dev-shm-usage")

    driver = webdriver.Chrome(options=options)
    driver.get("http://" + domain if not domain.startswith("http") else domain)

    content = driver.page_source
    driver.quit()

    soup = BeautifulSoup(content, "html.parser")
    title = soup.title.string if soup.title else "No title"
    suspicious = any(x in content.lower() for x in ["login", "verify", "bank", "password", "update"])

    return {
        "title": title,
        "malwareDetected": suspicious,
        "summary": "Suspicious terms detected" if suspicious else "No malicious content found"
    }
