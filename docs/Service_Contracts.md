# Service Contracts

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
