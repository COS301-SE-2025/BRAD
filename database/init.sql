-- database/init.sql

CREATE TABLE submissions (
    id SERIAL PRIMARY KEY,
    domain TEXT NOT NULL,
    status TEXT DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE domain_reports (
    id SERIAL PRIMARY KEY,
    submission_id INTEGER REFERENCES submissions(id),
    ip TEXT,
    whois TEXT,
    ssl_info TEXT,
    risk_score INTEGER,
    scanned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
