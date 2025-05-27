# Hello World Inc - B.R.A.D - COS301 Capstone

# Software Requirement Specifications

# Requirements

## 1. Core Requirements

### 1.1. User Submission Portal

1.1.1. Provide a web form for users to report suspicious domains.  
1.1.2. Ensure ease of use with form validation and confirmation messages.

### 1.2. Scraping & Malware Detection

1.2.1. Deploy a secure, containerized bot to visit submitted domains.  
1.2.2. Extract domain content and run malware detection tools.

### 1.3. Forensic Data Collection

1.3.1. Gather metadata such as IP address, hosting provider, and registrar info.  
1.3.2. Fetch SSL certificate and WHOIS data for further analysis.

### 1.4. AI Risk Analysis

1.4.1. Use machine learning to evaluate domain content and metadata.  
1.4.2. Classify domains based on risk level or threat type.

### 1.5. Evidence Submission

1.5.1. Allow users to upload supporting files (e.g., screenshots, logs).  
1.5.2. Validate file types and scan for malware.

### 1.6. Investigator Dashboard

1.6.1. Provide a UI for analysts to review submitted reports.  
1.6.2. Include filters, sorting, and risk classification indicators.

### 1.7. Secure Storage

1.7.1. Store all data with encryption at rest and in transit.  
1.7.2. Implement access controls and secure backups.

## 2. Optional Features

### 2.1. Threat Intelligence Lookup

2.1.1. Integrate with known threat intelligence APIs.  
2.1.2. Flag domains found in blacklists or reports.

### 2.2. Automated WHOIS & DNS

2.2.1. Periodically fetch and update WHOIS and DNS records.  
2.2.2. Detect ownership or server changes.

### 2.3. Domain Similarity Detection

2.3.1. Identify lookalike or typo-squatting domains.  
2.3.2. Cluster domains with similar patterns.

### 2.4. Real-Time Alerts

2.4.1. Send email, SMS, or webhook alerts for critical threats.  
2.4.2. Include context and risk score in alert payloads.

### 2.5. Historical Tracking

2.5.1. Maintain timeline of changes and reports for each domain.  
2.5.2. Track repeat offenders and escalation trends.

### 2.6. Multi-Language Support

2.6.1. Detect and process content in various languages.  
2.6.2. Include translation tools or plugins if necessary.

## 3. Wow Factors (Optional)

### 3.1. Live Sandbox Testing

3.1.1. Execute domain resources in an isolated environment.  
3.1.2. Capture behavioral traces like redirects or script execution.

### 3.2. Machine Learning Risk Scores

3.2.1. Train models on historical data to generate risk scores.  
3.2.2. Continuously refine with analyst feedback.

### 3.3. Automated Threat Hunting

3.3.1. Use domain data to proactively scan for similar threats.  
3.3.2. Suggest new domains to monitor based on clustering.

### 3.4. Blockchain Evidence

3.4.1. Store report hashes on a blockchain for integrity proof.  
3.4.2. Enable public verification of report authenticity.

### 3.5. Auto Takedown Requests

3.5.1. Generate pre-filled abuse reports for registrars.  
3.5.2. Track status of takedown actions.

### 3.6. Dark Web Checks

3.6.1. Monitor dark web forums or marketplaces for domain mentions.  
3.6.2. Flag domains associated with underground activity.

## 4. Architecture Requirements (Optional)

### 4.1. Secure Backend

4.1.1. Harden APIs and use secure coding practices.  
4.1.2. Enforce authentication and rate limiting.

### 4.2. Scalability

4.2.1. Support horizontal scaling for high domain intake.  
4.2.2. Use load balancing and asynchronous processing where needed.

### 4.3. Dockerized Bot

4.3.1. Deploy scrapers in isolated Docker containers.  
4.3.2. Reset containers after each scan to prevent contamination.

### 4.4. RBAC (Role-Based Access Control)

4.4.1. Define roles like user, analyst, and admin.  
4.4.2. Restrict feature access based on role permissions.

### 4.5. Immutable Logs

4.5.1. Record all actions with timestamps and user IDs.  
4.5.2. Store logs in append-only format for audit integrity.
