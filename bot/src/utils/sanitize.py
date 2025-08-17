def sanitize_domain(domain: str) -> str:
    return (domain or "").strip().replace("\u200b", "").replace("\u2060", "")
