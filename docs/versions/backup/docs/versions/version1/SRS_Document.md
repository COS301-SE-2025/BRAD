<!-- omit in toc -->
# Software Requirement Specifications

<br />

<!-- omit in toc -->
# Table of Contents


- [Introduction](#introduction)
    - [Business Need](#business-need)
    - [Project Scope](#project-scope)
- [User Stories](#user-stories)
    - [1. Role: General user(Reporter)](#1-role-general-userreporter)
    - [2. Role:Investigator](#2-roleinvestigator)
    - [3. Role:Admin](#3-roleadmin)
- [Use cases](#use-cases)
    - [Use Case 1: Submit Domain Report](#use-case-1-submit-domain-report)
    - [Use Case 2: View Submitted Reports](#use-case-2-view-submitted-reports)
    - [Use Case 3: Analyse Forensic](#use-case-3-analyse-forensic)
    - [Complete use cases daigrams:](#complete-use-cases-daigrams)
- [Functional Requirements](#functional-requirements)
  - [Core Requirements](#core-requirements)
    - [1.1. User Submission Portal](#11-user-submission-portal)
    - [1.2. Scraping \& Malware Detection](#12-scraping--malware-detection)
    - [1.3. Forensic Data Collection](#13-forensic-data-collection)
    - [1.4. AI Risk Analysis](#14-ai-risk-analysis)
    - [1.5. Evidence Submission](#15-evidence-submission)
    - [1.6. Investigator Dashboard](#16-investigator-dashboard)
    - [1.7. Secure Storage](#17-secure-storage)
  - [Optional Features](#optional-features)
    - [2.1. Threat Intelligence Lookup](#21-threat-intelligence-lookup)
    - [2.2. Automated WHOIS \& DNS](#22-automated-whois--dns)
    - [2.3. Domain Similarity Detection](#23-domain-similarity-detection)
    - [2.4. Real-Time Alerts](#24-real-time-alerts)
    - [2.5. Historical Tracking](#25-historical-tracking)
    - [2.6. Multi-Language Support](#26-multi-language-support)
  - [3. Wow Factors](#3-wow-factors)
    - [3.1. Live Sandbox Testing](#31-live-sandbox-testing)
    - [3.2. Machine Learning Risk Scores](#32-machine-learning-risk-scores)
    - [3.3. Automated Threat Hunting](#33-automated-threat-hunting)
    - [3.4. Blockchain Evidence](#34-blockchain-evidence)
    - [3.5. Auto Takedown Requests](#35-auto-takedown-requests)
    - [3.6. Dark Web Checks](#36-dark-web-checks)
- [Service Contracts](#service-contracts)
  - [1. User Authentication](#1-user-authentication)
    - [Login](#login)
    - [Register](#register)
  - [2. Domain Submission](#2-domain-submission)
    - [Submit Suspicious Domain](#submit-suspicious-domain)
  - [3. Internal Bot Analysis](#3-internal-bot-analysis)
    - [Analyze Domain (Internal)](#analyze-domain-internal)
  - [4. Reports](#4-reports)
    - [View Domain Report](#view-domain-report)
  - [5. Evidence Management](#5-evidence-management)
    - [Upload Evidence](#upload-evidence)
- [Domain Model](#domain-model)
- [Architecture Requirements](#architecture-requirements)
  - [Quality Requirements](#quality-requirements)
    - [1. Security (Most Important)](#1-security-most-important)
    - [2. Compliance](#2-compliance)
    - [3. Reliability](#3-reliability)
    - [4. Scalability](#4-scalability)
    - [5. Maintainability](#5-maintainability)
  - [Architectural Patterns](#architectural-patterns)
    - [Gatekeeper Pattern](#gatekeeper-pattern)
    - [Event-Driven Architecture (EDA)](#event-driven-architecture-eda)
    - [Service-Oriented Architecture (SOA)](#service-oriented-architecture-soa)
    - [Micro-services Architecture](#micro-services-architecture)
    - [Client-Server Model](#client-server-model)
    - [Layered Architecture](#layered-architecture)
    - [Pipe and Filter Pattern](#pipe-and-filter-pattern)
    - [Model-View-Controller (MVC)](#model-view-controller-mvc)
  - [Design Patterns](#design-patterns)
    - [1. Factory Pattern](#1-factory-pattern)
    - [2. Strategy Pattern](#2-strategy-pattern)
    - [3. Observer Pattern](#3-observer-pattern)
    - [4. Singleton Pattern](#4-singleton-pattern)
    - [5. Decorator Pattern](#5-decorator-pattern)
    - [6. Command Pattern](#6-command-pattern)
    - [7. Builder Pattern](#7-builder-pattern)
    - [8. Chain of Responsibility Pattern](#8-chain-of-responsibility-pattern)
    - [9. Adapter Pattern](#9-adapter-pattern)
    - [10. Proxy Pattern](#10-proxy-pattern)
    - [11. Mediator Pattern](#11-mediator-pattern)
  - [Architectural Constraints](#architectural-constraints)
- [Technology Requirements](#technology-requirements)
- [Appendices](#appendices)


<br />
<br />

# Introduction

The **Bot to Report Abusive Domains (B.R.A.D)** is a cybersecurity-focused application designed to automate the investigation and analysis of domain abuse reports. With the increasing prevalence of phishing websites, malware-hosting domains, and other forms of DNS abuse, organizations require efficient, secure, and intelligent tools to support cybersecurity operations.

B.R.A.D addresses this need by providing a streamlined web-based platform where users can submit suspicious URLs. Upon submission, a secure, containerized bot performs automated scraping and forensic analysis on the domain—extracting content, detecting potential malware, collecting metadata (such as WHOIS data, IP addresses, and SSL certificates), and classifying risk levels using AI techniques. The system compiles this data into structured forensic reports, which are made available to cybersecurity investigators through a dedicated dashboard.

### Business Need

Modern cyber threats are increasingly sophisticated, targeting individuals, businesses, and infrastructure through deceptive and malicious domains. Manual approaches to investigating these threats are often time-consuming and reactive. There is a clear need for an automated solution that facilitates the rapid assessment and reporting of potentially harmful domains. B.R.A.D aims to fill this gap by providing a secure, scalable system for domain abuse detection and reporting.

### Project Scope

The scope of this project includes the design and implementation of:
- A **User Submission Portal** for reporting suspicious domains
- A **Containerized Bot** for automated domain visits and content scraping
- **Forensic Data Collection** to gather and store domain intelligence
- **AI-Powered Risk Classification** to evaluate the level of threat
- An **Investigator Dashboard** for reviewing and analyzing reports
- Optional integration with threat intelligence sources and real-time alerting

The B.R.A.D system will support both a user-friendly interface and API-based access to ensure integration flexibility and ease of use.

 <br />
 
<p align="right"><a href="#table-of-contents">⬆️ Back to Table of Contents</a></p>

<br />
<br />

# User Stories

### 1. Role: General user(Reporter)

**Description:**

- A member of the public or organization who wants to report a suspicious website.

**User Story:**

- As a general user I want to submit a suspicious domain so that I can check if it's legal and safe to use.

**Definition of done:**

- I can submit a suspicious domain via a simple form
- I can optionally add notes or upload evidence
- I receive confirmation that my report is submitted
- I can track my report status and receive feedback

<br />

---

### 2. Role:Investigator

**Description:**

- A cybersecurity analyst who reviews and classifies domain submissions.

**User Story:**

- As an investigator I want to view all reports submitted and their results so that I can analyse them, change their status, and send feedback to the reporter.

**Definition of done:**

- I can view all submitted reports
- I can see risk scores and AI verdicts
- I can open a detailed report with metadata and evidence
- I can update the report status
- I can send feedback to the original reporter
  
<br />

---

### 3. Role:Admin

**Description:**

- A system administrator responsible for managing user roles.

**User Story:**

- As an admin I want to view all users and manage their roles so that I can control who has access to specific functionalities

**Definition of done:**

- I can view all registered users
- I can promote a user to the role of investigator
- I can demote an investigator to a general user

 <br />
 
<p align="right"><a href="#table-of-contents">⬆️ Back to Table of Contents</a></p>

<br />
<br />

# Use cases

This outlines and analyses the three main use cases of the B.R.A.D (Bot
to Report Abusive Domains) cybersecurity application. Each use case is
detailed with user perspectives,system responsibilities, and variations
in workflow depending on the implementation of automated vs manual bot
analysis.

### Use Case 1: Submit Domain Report

**User Perspective:** 

The Reporter wants to submit a suspicious domain via a
simple and secure interface.They may optionally upload supporting evidence (screenshots,emails,etc.).

**System Role:**

• Validates the domain

• Stores the report in the database

•Optionally or automatically triggers the
investigation bot depending on chosen version

•Provides confirmation of submission

<br />

**Steps(General):**

 1. Reporter logs into the platform.

 2. Fills in the domain name.

 3. Uploads evidence(optional).

 4. Submits the report.

 5. System processes the submission accordingly.

<br />

**Version 1: Bot is triggered automatically u pon submission.**

• Trigger BotAnalysis becomes an\<\<include\>\>usecase.

• Investigation starts immediately in the background.

• Reporter receives a confirmation that investigation has started.

• Optional: Investigator is notified post-analysis.

<br />

<img src="./images/Usecase1V1.png"
style="width:6.31514in;height:2.65903in" />

<br />

**Version 2: Investigator manually launches the bot later.**

 • Submission is stored and queued for human review.

 • Investigator decides when to initiate investigation.

<br />

<img src="./images/Usecase2V2.png"
style="width:7.26805in;height:2.98889in" />

<br />

---

### Use Case 2: View Submitted Reports

**User Perspective:** 

The Reporter wants to track the status of their
previous submissions,including any analysis results or reports generated by investigators.

**System Role:**

• Authenticates the user

• Retrieves and displays submission history and current statuses

• Optionally allows filtering,downloading reports,or receiving notifications

In **Version1:** statuses update quickly as bot analysis runs automatically.

In **Version2:** status may show as "AwaitingInvestigation"
until an investigator initiates the process.

<br />

<img src="./images/Usecase2.png"
style="width:7.26806in;height:2.00555in" />

<br />

---

### Use Case 3: Analyse Forensic

**User Perspective:**

The Investigator logs in to review assigned or submitted domain reports.They
access metadata, interpret bot analysis results,and provide a final analysis.

 **System Role:**

• Authenticates the investigator with secure access

• Displays report information and metadata

• Runs or fetches bot out put depending on the version

• Supports visual analysis tools,export features,and escalation options

<br />

**Version 1: Bot is Auto Triggered**

• Investigator accesses already-analysed results

• Main task is interpretation and risk assessment

<br />

<img src="./images/Usecase3V1.png"
style="width:7.26805in;height:2.30069in" />

<br />
<br />

**Version 2: Bot is Manually Triggered**

• Investigator must explicitly launch the bot from the dashboard

• Once results are ready,analysis and reporting proceed as usual

<br />

<img src="./images/Usecase3V2.png"
style="width:7.26805in;height:4.41944in" />

<br />

---

### Complete use cases daigrams:

**Version 1** is ideal for
rapid,scalable analysis where automation speeds up feedback loops.

<br />

<img src="./images/Version1.png"
style="width:7.26805in;height:4.41944in" />

<br />
<br />

**Version 2** introduces flexibility and manual control for nuanced investigations.

<br />

<img src="./images/Version2.png"
style="width:7.26805in;height:4.41944in" />

 <br />
 
<p align="right"><a href="#table-of-contents">⬆️ Back to Table of Contents</a></p>

<br />
<br />

# Functional Requirements

<br />

## Core Requirements

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

<br />

## Optional Features

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

<br />

## 3. Wow Factors

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
3.6.2. Flag domains associated with underground activity

 <br />
 
<p align="right"><a href="#table-of-contents">⬆️ Back to Table of Contents</a></p>

<br />
<br />

# Service Contracts

<br />

## 1. User Authentication

### Login

**Service Contract Name:** `POST /api/auth/login`

**Parameters:**
{ "email": "string", "password": "string" }

**Pre-conditions:**

- The user must be a registered user.
- A valid registered email address and password must be provided.

**Post-conditions:**

- The user is signed into the system and navigated to one of the two dashboards based on their access role.
  

**Scenario:**
The user enters their email and password on the login page. The system verifies the credentials and either grants access, navigating the user to one of the two dashboards, or denies access and prompts them to try again.

---

### Register

**Service Contract Name:** `POST /api/auth/register`

**Parameters:**
{ "name": "string", "email": "string", "password": "string" }

**Pre-conditions:**

- The email must not already be registered.
- All fields must be filled in with valid values:

  - **email:** Valid email format
  - **name:** Minimum length (e.g., 2 characters)
  - **password:** Meets security requirements (e.g., min 8 characters, mix of letters/numbers)

**Post-conditions:**

- A new user account is created and stored in the database.
- The user receives a confirmation (auto-login or verification link).
- A token is returned to start the user session (used in API header).



**Scenario:**
A new user accesses the registration page and fills in their name, email, and password. The system validates the input, creates the account, and either logs the user in or sends a verification email. If the email already exists or input is invalid, an error message is shown.

<br />

## 2. Domain Submission

### Submit Suspicious Domain

**Service Contract Name:** `POST /api/domains/report`

**Parameters:**
{ "domain": "string", "evidenceFile": "File (optional)" }

**Pre-conditions:**

- The domain field must be non-empty and in a valid format (e.g., begins with http\:// or https\://).
- If evidence is attached, it must be PDF, JPG, or PNG and below 10MB.

**Post-conditions:**

- The domain is stored with status "queued".
- If evidence is attached, it is securely saved and linked to the submission.
- A confirmation or error message is returned.



**Scenario:**
The reporter enters a suspicious URL, optionally uploads evidence, and submits. The system validates, queues the domain, and returns a success or failure message.

<br />

## 3. Internal Bot Analysis

### Analyze Domain (Internal)

**Service Contract Name:** `BOT /internal/analyse-domain`

**Parameters:**
{ "submissionID": "UUID" }

**Pre-conditions:**

- Domain must exist with status "queued".
- A sandboxed Docker container must be available.

**Post-conditions:**

- Metadata (IP, WHOIS, SSL, etc.) is extracted.
- Domain is checked for malware.
- Results are stored and status updated.


**Scenario:**
System detects a "queued" domain and invokes the bot. The bot analyzes the domain in a sandbox and updates the report.

<br />

## 4. Reports

### View Domain Report

**Service Contract Name:** `GET /api/reports/{domainId}`

**Parameters:**
{ "domainId": "UUID" }

**Headers:**
`Authorization: Bearer <token>`

**Pre-conditions:**

- User must be authenticated and have permission.
- Report must exist.

**Post-conditions:**

- A JSON or UI-based report is returned.
- Optional PDF/CSV download link provided.


**Scenario:**
The user selects a domain report from the dashboard. The system retrieves and displays it. Errors are shown if not found or unauthorized.

<br />

## 5. Evidence Management

### Upload Evidence

**Service Contract Name:** `POST /api/evidence/upload`

**Parameters:**
{ "submissionId": "UUID", "file": "File" }

**Pre-conditions:**

- Submission must exist.
- File must be PDF, JPG, or PNG and below size limit.

**Post-conditions:**

- File is stored and linked to the domain submission.
- User receives success or failure message.


**Scenario:**
User uploads additional proof. The system validates and stores the file, linking it to the submission.

 <br />
 
<p align="right"><a href="#table-of-contents">⬆️ Back to Table of Contents</a></p>

<br />
<br />
<br />
<br />

# Domain Model
<div style="text-align: center;">
  <img src="./images/DomainModelV2.jpg" style="max-width:100%; height:auto;" />
</div>

<br />
 
<p align="right"><a href="#table-of-contents">⬆️ Back to Table of Contents</a></p>

<br />
<br />

# Architecture Requirements

<br />

## Quality Requirements

### 1. Security (Most Important)

Security is the foundation of the B.R.A.D system, given its handling of sensitive data like user-submitted URLs, forensic metadata, and potentially malicious content. Unauthorized access or breaches could lead to severe consequences such as data leaks, false reports, or misuse of the system for cyber-attacks. Therefore, security controls, encrypted storage, secure APIs, role-based access control, and container isolation must be thoroughly enforced to protect both user and system integrity. 


| Stimulus <br>Source  | Stimulus  | Response  | Response <br>Measure  | Environment  | Artifact  |
:--------: | :--------: | :-------------: | :-------------: | :-------------: | :-------------: |
| Malicious actors/ <br>Attackers.  | Attempt to compromise data or infrastructure.  | System should block unauthorized access and encrypt sensitive information.  | 100% of sensitive data encrypted<br> at rest and in transit. <br>All RBAC (Role Based Access Control) and MFA (Multi-Factor Authentication) enforced.  | Production environment.  | BRAD Backend/API System  |

<br />

### 2. Compliance

Compliance ensures that the system operates within the legal and ethical boundaries defined by regulations like GDPR and POPIA. This is especially important for a tool that collects and processes potentially identifiable or legally sensitive data. Compliance includes implementing consent mechanisms, depersonalizing data when possible, logging access to personal data, and providing the right to be forgotten. 


| Stimulus <br>Source  | Stimulus  | Response  | Response <br>Measure  | Environment  | Artifact  |
:--------: | :--------: | :-------------: | :-------------: | :-------------: | :-------------: |
| Legal/ <br>Regulatory Bodies.  | Data privacy and <br>regulatory audits.  | System should ensure legal <br>compliance in data handling and provide <br>user data control mechanisms.  | GDPR and POPIA checklists passed; <br> audit logs maintained;<br> user data deletion <br>supported.  | Production <br>environment.  | Data <br>Processing <br>Components.  |

<br />

### 3. Reliability

The reliability of B.R.A.D ensures that forensic investigations can be conducted consistently and accurately. The system should gracefully handle failed URL submissions, avoid crashes during analysis, and recover from bot failures without corrupting data. High reliability builds trust in the system’s outputs and enables analysts to depend on its results for critical decision-making. 


| Stimulus <br>Source  | Stimulus  | Response  | Response <br>Measure  | Environment  | Artifact  |
:--------: | :--------: | :-------------: | :-------------: | :-------------: | :-------------: |
| System Users.  | Submission of various <br>domains, including malformed <br>or malicious ones.  | System hould maintain stable <br>operation and report errors clearly.  | 99.9% uptime, bot recovers <br>from crashes within 60 seconds.  | Production <br>environment.  | Bot Engine <br>and <br>Report System.  |

<br />

### 4. Scalability

Scalability is essential to support the analysis of many domain reports simultaneously. B.R.A.D must be able to grow with demand, especially during cyber incident spikes. It should process multiple domain submissions concurrently without bottlenecking the system or slowing down analysis pipelines. By ensuring scalability, the system can maintain optimal performance under high loads, enabling faster processing and quicker turnaround times for forensic results. 


| Stimulus <br>Source  | Stimulus  | Response  | Response <br>Measure  | Environment  | Artifact  |
:--------: | :--------: | :-------------: | :-------------: | :-------------: | :-------------: |
| Multiple <br>Users.  | Submission of multiple<br> links at the same time.  | System should scale horizontally <br>to handle multiple concurrent analyses.  | Supports 500+ concurrent domain <br>submissions with average <br>analysis &lt; 10s/domain.  | Production <br>environment.  | Domain Analysis <br>Pipeline.  |

<br />


###  5. Maintainability 

B.R.A.D’s architecture must allow for frequent updates such as patching vulnerabilities, integrating new threat intelligence feeds or adapting AI models. The system must be designed with modularity and clear interfaces between components (e.g., scrapers, AI, storage) so developers can make targeted changes without affecting the whole system.


| Stimulus <br>Source  | Stimulus  | Response  | Response <br>Measure  | Environment  | Artifact  |
:--------: | :--------: | :-------------: | :-------------: | :-------------: | :-------------: |
| Development <br>Team.  | Requirement to update <br>scraping logic or AI model.  | System should allow modular, <br>low-risk updates <br>with minimal downtime.  | Docker-based components, <br>automated deployment <br>pipeline, &lt;5 min rollout  | Development <br>environment.  | Bot Container <br>&<br> AI Modules.  |

 <br />
 
<p align="right"><a href="#table-of-contents">⬆️ Back to Table of Contents</a></p>

<br />
<br />

## Architectural Patterns

In developing the BRAD (Bot to Report Abusive Domains) system, several
architectural patterns have been chosen to support the project’s
critical quality requirements.

### Gatekeeper Pattern

The Gatekeeper Pattern is implemented in BRAD as a dedicated security
layer that mediates all incoming traffic to the system. This component
acts as a centralized entry point that handles user authentication,
enforces role-based access control (RBAC), and verifies that each
request meets the system's security and compliance policies. By
introducing this pattern, BRAD directly addresses security, reliability,
and compliance requirements. Unauthorized or malformed requests are
blocked before reaching sensitive backend services such as the scraper
or AI classifier. The Gatekeeper also integrates multi-factor
authentication (MFA) for investigator accounts, further securing access
to forensic data. In high-traffic or adversarial scenarios, it supports
rate limiting, input sanitization, and logging to mitigate threats such
as denial-of-service (DoS) attacks or injection attempts.

**Quality Requirements Addressed:**

1. **Security**: All requests are authenticated, authorized, and
validated before reaching internal services, preventing unauthorized
access and injection attacks.

2. **Reliability**: The Gatekeeper handles rate limiting, failover
routing, and input filtering to protect internal services from
overload or failure.

3. **Compliance**: Every access attempt is logged and checked against
regulatory rules, ensuring adherence to GDPR and POPIA obligations.

<br />
<br />

### Event-Driven Architecture (EDA)

The Event-Driven Architecture (EDA) enables BRAD to process large
volumes of domain investigation requests by allowing system components
to operate asynchronously in response to discrete events. When a user
submits a suspicious URL, this event triggers a pipeline of subsequent
actions such as scraping, malware scanning, AI-based risk scoring, and
report generation each executed by specialized services. This pattern
enhances scalability by enabling horizontal scaling of event consumers,
allowing the system to handle multiple investigations concurrently. It
also improves performance by decoupling producers (e.g., the submission
module) from consumers (e.g., the scraper bot), enabling real-time,
non-blocking execution. Reliability is also addressed through persistent
event logs, which ensure that failed or interrupted processes can be
recovered and replayed without data loss.

**Quality Requirements Addressed:**

1. **Scalability**: New event consumers can be added horizontally to
meet increased demand during peak investigation periods.

 2. **Performance**: Asynchronous processing enables faster throughput
for multiple domain investigations running in parallel.

3. **Reliability**: Persistent queues and event logs allow retries
and recovery if services fail mid-process.


<br />
<br />

### Service-Oriented Architecture (SOA)

The Service-Oriented Architecture (SOA) is used to decompose BRAD into
modular services such as Scrape-Service, Analyse-Service, and
Report-Service, each responsible for a well-defined function. These
services interact via standardized RESTful APIs, allowing them to
operate independently and be developed, deployed, or scaled without
disrupting the system as a whole. This directly improves
maintainability, as updates or bug fixes in one service do not cascade
into others. It also improves interoperability, enabling future
integration with external systems such as threat intelligence databases
or registrar reporting interfaces. Moreover, scalability is enhanced by
the ability to scale only the services under load (e.g., multiple
scraper instances during high-volume submissions) rather than the entire
system.

**Quality Requirements Addressed:**

1. **Scalability**: Each service can be scaled based on load without
affecting the others. 

2. **Maintainability**: Services can be
independently updated or replaced, supporting long-term evolution.

3. **Interoperability**: Services follow standard formats and
 protocols (e.g., JSON, HTTP), enabling integration with external
 threat intel APIs.

<br />
<br />

### Micro-services Architecture

The Micro-services Architecture builds on SOA by containerizing each
service using Docker. Every component whether it's the AI classifier,
scraper bot, or report builder is packaged and deployed as a separate
micro-service, running in isolated environments. This structure directly
improves portability, as each micro-service can be run consistently
across local, staging, and production environments. It also enhances
fault tolerance and maintainability, because issues in one micro-service
(e.g., an AI crash) are isolated from others and can be fixed or
redeployed independently. Finally, micro-services improve scalability by
enabling fine-grained control over the system’s resource usage, ensuring
efficient operation under varying load conditions.

**Quality Requirements Addressed:**

1. **Scalability**: Each micro-service (e.g., a scraping worker) can
be replicated independently for load distribution.

2. **Maintainability**: Faults or updates are isolated to a single
service, minimizing system-wide impact.

3. **Portability**: Docker containers ensure that services run
 reliably across different environments (development, testing,
 deployment).

<br />
<br />


### Client-Server Model

The Client-Server Model is employed in BRAD to separate the frontend
interfaces (client) from backend processing (server). The frontend
includes the public user submission portal and the investigator
dashboard, both of which communicate with backend services over secured
APIs. This pattern strengthens security, as all critical logic and
sensitive data processing are centralized on the server, where access
can be tightly controlled. It also supports compliance by allowing the
server to enforce data validation, consent mechanisms, and logging in
accordance with regulations like POPIA and GDPR. Additionally, the model
enhances usability, as the client can be optimized for user experience
without compromising backend integrity.

**Quality Requirements Addressed:**

1. **Usability**: A clear separation between UI and backend enables
focused UX design for investigators and general users.

2. **Security**: The server centralizes sensitive operations,
 enforcing access control and API authentication.

3. **Compliance**: Client submissions are sanitized and validated on
 the server to meet data protection regulations.

<br />
<br />

### Layered Architecture

The system adopts a Layered Architecture to structure its internal logic
into four distinct layers: the presentation layer (UI), application
layer (API gateway and authentication), business logic layer (scraping
and risk analysis), and data layer (databases and logs). This separation
improves maintainability, because changes in one layer (e.g., updating
the UI) do not ripple across unrelated layers. It also supports security
by isolating sensitive logic in backend layers that are not exposed to
users. Furthermore, reliability is strengthened, as each layer is
testable in isolation, reducing the likelihood of cascading failures.

**Quality Requirements Addressed:**

1. **Maintainability**: Developers can make changes to one layer
 (e.g., UI) without affecting others.

2. **Security**: Sensitive operations are encapsulated in deeper
 layers, reducing attack surface.

3. **Reliability**: Layered isolation makes failures easier to
 contain and debug.

<br />
<br />


### Pipe and Filter Pattern

The Pipe and Filter Pattern underpins BRAD’s core investigation
pipeline, where data flows through a series of processing components
(filters), each performing a specific task in the investigation
pipeline:

**Scrape → Detect Malware → AI Risk Analysis → Metadata Logging → Report Generation**

Each component (filter) transforms the input and passes it along the
pipeline. This modular design improves maintainability, as filters can
be added, replaced, or removed without redesigning the entire flow. It
also improves reliability by allowing error handling and fallback
mechanisms at each stage. Additionally, performance benefits from
clearly defined processing stages, which can be parallelized or scaled
independently when needed.

**Quality Requirements Addressed:**

1. **Maintainability**: Each step can be updated or replaced
independently.

2. **Reliability**: The pipeline can resume at failed steps without
 reprocessing the entire chain.

3. **Performance**: Processing is streamlined through well-defined
 input/output interfaces.

<br />
<br />

### Model-View-Controller (MVC)

On the frontend, the Model-View-Controller (MVC) pattern is applied to
the investigator dashboard to cleanly separate concerns. The model holds
domain data and system state, the view renders the UI (e.g., graphs,
logs, alerts), and the controller handles user input and orchestrates
responses. This structure enhances usability by ensuring that the
interface is responsive and intuitive. It also improves maintainability,
as frontend developers can update visual components, logic, or data
handling independently reducing the likelihood of bugs and simplifying
testing.

**Quality Requirements Addressed:**

1. **Usability**: MVC supports responsive, interactive UIs.

2. **Maintainability**: Clearly separated concerns improve code
modularity and testability.

Together, these architectural patterns form a unified blueprint for
BRAD’s development. Each pattern was chosen not only for technical
elegance, but for its direct and measurable impact on the system’s
critical quality requirements. This ensures that BRAD is not only
functional but secure, adaptable, and resilient in the face of
ever-evolving cyber-security threats.

 <br />
 
<p align="right"><a href="#table-of-contents">⬆️ Back to Table of Contents</a></p>
<br />
<br />

## Design Patterns

### 1. Factory Pattern

 • **Use Case**: Creating different types of bot agents or report
 objects depending on domain content (e.g., malware, phishing, scam).

 • **Benefit**: Encapsulates object creation, improves scalability when
 new domain types are introduced.

<br />

### 2. Strategy Pattern

 • **Use Case**: Switching between scraping techniques (e.g.,
 simple scraper vs. headless browser) or classification models.

 • **Benefit**: Makes it easy to plug in new algorithms or scraping
 methods without altering the core logic.

<br />

### 3. Observer Pattern

 • **Use Case**: Real-time alerting system notify investigators
 when a high-risk domain is flagged.

• **Benefit**: Decouples alert logic from the classification engine.

<br />

### 4. Singleton Pattern

• **Use Case**: Global configuration manager (e.g., for API keys,
 ML model paths, threat intelligence feeds).

• **Benefit**: Ensures a single point of configuration and avoids
conflicting settings. 

<br />

### 5. Decorator Pattern

 • **Use Case**: Enriching domain reports dynamically with new
 metadata like threat score, WHOIS, SSL info, etc.

• **Benefit**: Adds functionality without modifying existing report
structures. 

<br />

### 6. Command Pattern

 • **Use Case**: Encapsulating user actions like "submit report,"
 "analyse domain," "override AI decision" as objects.

• **Benefit**: Supports undo, logging, and replay features. 

<br />

### 7. Builder Pattern

 • **Use Case**: Constructing complex domain reports step by step
 (text, screenshots, metadata, scores).

• **Benefit**: Separates construction logic from representation. 

<br />

### 8. Chain of Responsibility Pattern

 • **Use Case**: Processing a domain through a pipeline (e.g.,
 scraping → analysis → risk scoring → report generation).

• **Benefit**: Each step handles the task it’s responsible for or passes
it to the next step. 

<br />

### 9. Adapter Pattern

 • **Use Case**: Integrating with various external threat
 intelligence APIs or WHOIS lookup tools.

• **Benefit**: Converts incompatible interfaces into one that fits your
system. 

<br />

### 10. Proxy Pattern

 • **Use Case**: For secure access to the scraper bot or AI module
 (e.g., rate-limiting, authentication).

• **Benefit**: Adds a layer of control and security around sensitive
components. 

<br />

### 11. Mediator Pattern

 • **Use Case**: Manages communication between reporters and
 investigators through an Admin. Reporters submit reports, and the
 Admin assigns them to available investigators.

 • **Benefit**: Prevents direct communication between parties, improves
 coordination, and keeps the workflow secure and organized.

<br />
 
<p align="right"><a href="#table-of-contents">⬆️ Back to Table of Contents</a></p>

<br />

## Architectural Constraints

• **Legal & Compliance Risks**: Must comply with GDPR,
 POPIA.

 • **Domain Blocking & Evasion**: Some sites may block
 scraping; might require headless browsers or IP rotation. Some
 websites don’t want to be automatically scanned or scraped by bots. So
 they use techniques to block your bot from accessing their content. To
 work around this tools like Headless browsers and IP rotation may be
 used. They prevent the bot from being blocked by making it seem like
 it is a normal user when it is fact not a normal user.

 • **False Positives in AI Classification**: May
 require manual override or verification, i.e. AI might incorrectly
 flag a safe domain as malicious. Since AI isn't perfect, there’s a
 chance it could make mistakes. That’s why you might need a manual
 override or human verification, where a security analyst or
 investigator reviews the case and decides if the AI's decision was
 actually correct.

 • **Data Privacy & Ethics**: Need secure storage,
 depersonalization, and ethical data handling practices.

 • **Budgetary Limits**: Although a server and some funds are
 provided, the project must stay within the allocated budget.

 <br />
 
<p align="right"><a href="#table-of-contents">⬆️ Back to Table of Contents</a></p>

 <br />
 <br />

# Technology Requirements


| **Component**                   | **Proposed Technology / Framework**         | **Use Case**                                                   | **Reasons for Choosing**                                                    |
| :------------------------------- | ------------------------------------------- | -------------------------------------------------------------- | --------------------------------------------------------------------------- |
| **Frontend (Web UI)**           | React.js                                    | Build user submission portal and investigator dashboard        | Lightweight, responsive UI, wide ecosystem, fast development                |
| **Backend API**                 | Node.js + Express                           | Receive domain reports, serve dashboard data, manage incidents | Non-blocking I/O ideal for async tasks, scalable microservices architecture |
| **Bot Execution**               | Docker                                      | Run headless browser (e.g., Puppeteer) in a sandbox            | Isolated environment for malware safety, consistent deployment              |
| **Web Scraping**                | Puppeteer (Headless Chrome)                 | Visit and interact with reported domains                       | Full JavaScript rendering, strong integration with Node.js                  |
| **AI for Risk Scoring**         | Python + Scikit-learn / TensorFlow          | Classify threat levels, detect phishing/malware patterns       | Mature ecosystem, strong model support in Python                            |
| **Threat Intelligence**         | AbuseIPDB, VirusTotal, Google Safe Browsing | Check domains against known blacklists                         | Established APIs with strong data coverage                                  |
| **Forensics & Metadata**        | python-whois, dnspython                     | Retrieve ownership, DNS, and SSL details                       | Reliable open-source libraries, no external cost                            |
| **Dashboard & Graphs**          | D3.js, Chart.js                             | Visualize DNS abuse, malware trends, incident timelines        | Interactive, customizable graphs; seamless React integration                |
| **Authentication**              | OAuth 2.0 + JWT + MFA                       | Secure system access for investigators/admins                  | Token-based, secure access control, widely adopted standards                |
| **Database**                    | PostgreSQL + MongoDB                        | Store reports, metadata, logs, AI results                      | Relational + NoSQL hybrid for structured and flexible data storage          |
| **CI/CD & DevOps**              | GitHub Actions, Docker, Kubernetes (opt.)   | Automated testing and deployment                               | Cloud-native workflows, scalable deployments                                |
| **Logging & Auditing**          | ELK Stack (Elasticsearch, Logstash, Kibana) | Track activity and monitor abuse trends                        | Real-time log indexing, visual dashboards, flexible open-source stack       |
| **Report Generation**           | Python + ReportLab                          | Generate downloadable PDF reports                              | High-quality PDF generation with layout control                             |
| **Blockchain Storage** *(opt.)* | Hyperledger Fabric                          | Immutable storage for critical incidents                       | Permissioned blockchain, good for compliance and audit trails               |
| **Dark Web Analysis** *(opt.)*  | TOR Scraper, OnionScan                      | Check if domains appear on the dark web                        | Enhances threat detection by scanning hidden services                       |

 <br />

<p align="right"><a href="#table-of-contents">⬆️ Back to Table of Contents</a></p>

 <br />
 <br />

# Appendices

No content yet.
Previous versions of the SRS will be added here as they become available.

 <br />
 
<p align="right"><a href="#table-of-contents">⬆️ Back to Table of Contents</a></p>
