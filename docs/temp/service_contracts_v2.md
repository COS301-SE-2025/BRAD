# BRAD Service Contracts

<br />

## API Contract

### Communication

* **Protocol**: HTTP/HTTPS (RESTful)
* **Format**: `application/json` (except multipart for file uploads)
* **Auth**:

  * `Authorization: Bearer <JWT>` (for user endpoints)
  * `X-Bot-Key: <KEY>` (for bot endpoints)
* **Error Handling**:

  * `400` Bad Request (missing fields, invalid values)
  * `401` Unauthorized (invalid/missing auth)
  * `403` Forbidden (role-based access denial)
  * `404` Not Found (invalid report ID)
  * `500` Internal Server Error

<br />

## Report Report Management

This service handles submission, retrieval, analysis, and status updates of suspicious domain reports. It communicates with a bot (via FastAPI) for domain analysis and stores results with structured forensic data.


### Submit Report

**Endpoint**: `POST /report`

* **Description**: Submit a suspicious domain with optional screenshot/file evidence.

* **Guards**: `AuthGuard`, `RolesGuard`

* **Roles**: `general`, `admin`

* **Content-Type**: `multipart/form-data`

* **Request Body**

    | Field    | Type    | Required | Description                  |
    | -------- | ------- | -------- | ---------------------------- |
    | domain   | string  | YES       | Domain being reported        |
    | evidence | file\[] | NO       | Up to 5 files (max 5MB each) |

* **Response**

    ```json
    {
    "_id": "665c861c8b23919a3f823fa1",
    "domain": "suspicious-domain.com",
    "submittedBy": "665c84cf7b7f5b2b04117f3d",
    "evidence": ["file1.png", "file2.jpg"],
    "analyzed": false,
    "analysis": null,
    "scrapingInfo": null,
    "abuseFlags": null,
    "analysisStatus": "pending",
    "investigatorDecision": null
    }
    ```

### Get All Reports

**Endpoint**: `GET /reports`

* **Description**: Retrieve all reports (admin/investigator) or own reports (general).
* **Guards**: `AuthGuard`, `RolesGuard`
* **Roles**: `general`, `admin`, `investigator`

* **Response**

    ```json
    [
    {
        "_id": "...",
        "domain": "...",
        "submittedBy": { "username": "user123" },
        ...
    }
    ]
    ```

### Update Analysis (Bot)

**Endpoint**: `PATCH /reports/:id/analysis`

* **Description**: Update a report with analysis results.
* **Guard**: `BotGuard`

* **Request Body** (DTO: `UpdateAnalysisDto`)

    ```json
    {
    "analysis": {
        "domain": "site.com",
        "scannedAt": "2025-08-08T10:00:00Z",
        "ip": "123.45.67.89",
        "registrar": "Example Inc.",
        "whoisOwner": "John Doe",
        "sslValid": true,
        "sslExpires": "2025-12-01",
        "riskScore": 8.5,
        "summary": "Possible phishing site",
        ...
    },
    "scrapingInfo": {
        "htmlRaw": "<html>...</html>",
        "structuredInfo": {
        "headings": ["Welcome"],
        "links": ["http://..."]
        }
    },
    "abuseFlags": {
        "obfuscatedScripts": true,
        "suspiciousJS": ["eval", "atob"],
        ...
    },
    "analysisStatus": "done"
    }
    ```

* **Response**

    Returns the updated report document.


### Submit Investigator Verdict

**Endpoint**: `PATCH /report/:id/decision`

* **Description**: Investigator marks the report as either `malicious` or `benign`.
* **Guards**: `AuthGuard`, `RolesGuard`
* **Roles**: `investigator`

* **Request Body**

    ```json
    {
    "verdict": "malicious"
    }
    ```

* **Response**

    ```json
    {
    "investigatorDecision": "malicious"
    }
    ```

### Manual Forensic Analysis

**Endpoint**: `GET /forensics/:id`

* **Description**: Manually trigger forensic analysis using the `ForensicService`.

* **Guards**: `AuthGuard`, `RolesGuard`

* **Roles**: `admin`, `investigator`

<br />

## Admin Management

This service provides privileged operations to manage users in the system, such as promoting/demoting roles, creating users with one-time passwords, and deleting users. Access is restricted to users with the `admin` role.


### Add Admin

**Endpoint**: `POST /admin/add`

* **Description**: Create a new admin user.
* **Request Body**: `AddAdminDto`

    ```json
    {
    "userId": "665d5f9b3f5c2e2a88e98b91",
    "firstname": "Natasha",
    "lastname": "Romanoff",
    "email": "natasha@example.com",
    "username": "nat_romanoff",
    "password": "supersecurepassword"
    }
    ```

* **Response**:

    ```json
    {
    "_id": "665d5f9b3f5c2e2a88e98b91",
    "firstname": "Natasha",
    "lastname": "Romanoff",
    "email": "natasha@example.com",
    "username": "nat_romanoff",
    "role": "admin"
    }
    ```

### Promote User to Investigator

**Endpoint**: `PATCH /admin/promote/:userId`

* **Description**: Promote a general user to `investigator`.
* **Params**:

  * `userId` — MongoDB ObjectId of the user

* **Response**:

    ```json
    {
    "_id": "...",
    "role": "investigator"
    }
    ```


### Demote User to General

**Endpoint**: `PATCH /admin/demote/:userId`

* **Description**: Demote an `investigator` or `admin` user to `general`.
* **Params**:

  * `userId` — MongoDB ObjectId of the user

* **Response**:

    ```json
    {
    "_id": "...",
    "role": "general"
    }
    ```


### Promote User to Admin

**Endpoint**: `PATCH /admin/promote-to-admin/:userId`

* **Description**: Promote any user to `admin`.
* **Params**:

  * `userId` — MongoDB ObjectId of the user

* **Response**:

    ```json
    {
    "_id": "...",
    "role": "admin"
    }
    ```

### Get All Users

**Endpoint**: `GET /admin/users`

* **Description**: Returns all registered users (passwords excluded).
* **Response**:

    ```json
    [
    {
        "_id": "665d...",
        "firstname": "Tony",
        "lastname": "Stark",
        "email": "tony@example.com",
        "username": "tony_stark",
        "role": "admin"
    },
    ...
    ]
    ```


### Delete User

**Endpoint**: `DELETE /admin/delete/:userId`

* **Description**: Permanently delete a user by ID.
* **Params**:

  * `userId` — MongoDB ObjectId of the user

* **Response**:

    ```json
    {
    "message": "User deleted successfully"
    }
    ```


### Create New User with One-Time Password

**Endpoint**: `POST /admin/user`

* **Description**: Create a new user with a randomly generated 5-digit one-time password. The user is emailed a password reset link valid for 30 minutes.
* 
* **Request Body**: `CreateUserDto`

    ```json
    {
    "firstname": "Steve",
    "lastname": "Rogers",
    "email": "steve@example.com",
    "username": "captain_america",
    "role": "investigator"
    }
    ```

* **Response**:

    ```json
    {
    "_id": "665d...",
    "firstname": "Steve",
    "lastname": "Rogers",
    "email": "steve@example.com",
    "username": "captain_america",
    "role": "investigator",
    "mustChangePassword": true
    }
    ```

* An email will be sent to the user with the one-time password and reset link.

<br />

## Authtication Management

This module handles user registration, authentication, and password lifecycle management (reset, change). It supports login via username or email, sends secure password reset links via email, and enforces first-time password change using OTPs for users created by admins.



### Register

**Endpoint**: `POST /auth/register`

* **Description**: Register a new user (default role: investigator).
* **Public**
* **Request Body**: `RegisterDto`

    ```json
    {
    "firstname": "Tony",
    "lastname": "Stark",
    "email": "tony@example.com",
    "username": "tony_stark",
    "password": "strongPassword1!"
    }
    ```

* **Response**

    ```json
    { "userId": "665d..." }
    ```


### Login

**Endpoint**: `POST /auth/login`

* **Description**: Authenticate with username or email and return JWT token.
* **Public**
* **Request Body**: `LoginDto`

    ```json
    {
    "identifier": "tony_stark",
    "password": "strongPassword1!"
    }
    ```

* **Response**

    ```json
    {
        "token": "<JWT_TOKEN>",
        "user": {
            "_id": "665d...",
            "firstname": "Tony",
            "lastname": "Stark",
            "email": "tony@example.com",
            "username": "tony_stark",
            "role": "investigator",
            "mustChangePassword": false,
            "createdAt": "2025-08-08T14:26:34.687Z",
            "updatedAt": "2025-08-08T14:26:34.687Z",
            "__v": 0
        }
    }
    ```

* If `mustChangePassword = true`, user must change password before login.



### Forgot Password

**Endpoint**: `POST /auth/forgot-password`

* **Description**: Sends a password reset link to the user's email.
* **Public**
* **Request Body**

    ```json
    { "email": "tony@example.com" }
    ```

* **Response**

    ```json
    { "message": "Password reset email sent" }
    ```



### Reset Password (via Token)

**Endpoint**: `POST /auth/reset-password`

* **Description**: Resets password using token from email.
* **Public**
* **Request Body**: `ResetPasswordDto`

    ```json
    {
    "token": "reset_token_from_email",
    "newPassword": "newSecurePassword123"
    }
    ```

* **Response**

    ```json
    { "message": "Password has been reset successfully" }
    ```



### Change Password (First-Time OTP)

**Endpoint**: `PATCH /auth/change-password/:username`

* **Description**: Changes password using a one-time password (for first login).
* **Public**
* **Path Param**: `username` — the username of the user
* **Request Body**: `ChangePasswordDto`

    ```json
    {
    "OTP": "12345",
    "newPassword": "newSecurePassword123!"
    }
    ```

* **Response**

    ```json
    { "message": "Password changed successfully. You can now log in." }
    ```

<br />

## Queue & Redis Service Contracts

These services handle asynchronous integration between the NestJS API and the FastAPI bot, and queue-based processing via Redis. They support pushing reports into the FastAPI analysis queue and Redis-based message passing.



### Queue Service: `queueToFastAPI(domain, reportId)`

Used by: `ReportService.submitReport(...)`

* **Purpose**: Sends a report to FastAPI via HTTP POST for domain analysis.

* **Protocol**: HTTP (JSON)

* **URL**: `${FASTAPI_URL}/queue`

* **Payload**

    ```json
    {
    "domain": "example.com",
    "report_id": "665d5f9b3f5c2e2a88e98b91"
    }
    ```

* **Response**

    ```json
    {
    "status": "queued",
    "message": "Job successfully received"
    }
    ```

**Errors**:

* Connection failures or timeouts are caught and logged.
* Error message is printed: `[QueueService] Failed to queue: <message>`
* The exception is rethrown.

<br />

## Bot Service Contracts

This component is a Python-based bot system built with FastAPI + Dramatiq + Redis. It acts as an asynchronous consumer of analysis jobs pushed from the NestJS backend. The bot performs forensic and scraping analysis on domains and reports results back to the API.



### FastAPI Bot Job Endpoint

**Endpoint**: `POST /queue`
* **Description**: Accepts analysis jobs from the NestJS backend and enqueues them to Redis using   Dramatiq.

* **Request Body**

    ```json
    {
    "domain": "phishing-site.com",
    "report_id": "665d5f9b3f5c2e2a88e98b91"
    }
    ```

* **Response**

    ```json
    {
    "status": "queued"
    }
    ```


### Submit Results to API

   **Endpoint**: `PATCH /reports/{report_id}/analysis`
* **Description**: Submits the analysis results back to the NestJS API for storage and further processing.

* **Payload Example**

   ```json
   {
     "analysis": {
       "domain": "phishing-site.com",
       "ip": "123.45.67.89",
       "registrar": "ExampleRegistrar",
       "riskScore": 8.5,
       "riskLevel": "High",
       ...
     },
     "scrapingInfo": {
       "htmlRaw": "...",
       "screenshotPath": "static/screenshots/phishing-site.com.png",
       "structuredInfo": {
         "headings": ["Login", "Submit"],
         "links": ["http://malicious-link.com"]
       },
       "crawledLinks": ["http://phishing-site.com/login"]
     },
     "abuseFlags": {
       "suspiciousJS": ["eval", "atob"],
       "redirectChain": ["start.com → middle.com → end.com"],
       "obfuscatedScripts": true,
       ...
     },
     "analysisStatus": "done"
   }
   ```

* **Error Handling**

   * On failure: logs the error and raises to retry via Dramatiq
   * Retries: Up to `MAX_RETRIES = 3`
   * Timeout: 60 seconds max per job
  
<br />

## Data Schema

**Report Schema**

| Field                | Type             | Description                               |
| -------------------- | ---------------- | ----------------------------------------- |
| domain               | `string`         | Domain name submitted                     |
| evidence             | `string[]`       | Uploaded filenames                        |
| submittedBy          | `ObjectId`       | Reference to submitting user              |
| analyzed             | `boolean`        | Whether the report has been analyzed      |
| analysis             | `Record<string>` | Forensic result                           |
| scrapingInfo         | `object`         | Parsed HTML, screenshot path, links, etc. |
| abuseFlags           | `object`         | JS abuse, redirects, CAPTCHAs, etc.       |
| analysisStatus       | `enum`           | `pending`, `in-progress`, `done`, `error` |
| investigatorDecision | `enum`           | `malicious`, `benign`, or `null`          |
| createdAt/updatedAt  | `Date`           | Auto timestamps                           |

<br>

**User Schema**

| Field                | Type             | Description                               |
| -------------------- | ---------------- | ----------------------------------------- |
| id                   | `string`         | Unique user identifier                    |
| firstname            | `string`         | Users first name                          |
| lastname             | `string`         | Users last name                           |
| email                | `string`         | Users email address                       |
| username             | `string`         | Users login username                      |
| password             | `string`         | bcrypt hash of users password             |
| role                 | `enum`           | `admin`, `investigator`, `general`        |
| mustChangePassword   | `boolean`        | User must change password on first login  |
| createdAt/updatedAt  | `Date`           | Auto timestamps                           |

<br />

## DTO Reference

**AddAdminDto**

| Field     | Type   | Validation      |
| --------- | ------ | --------------- |
| userId    | string | Required        |
| firstname | string | `@IsNotEmpty`   |
| lastname  | string | `@IsNotEmpty`   |
| email     | string | `@IsEmail`      |
| username  | string | `@IsNotEmpty`   |
| password  | string | `@MinLength(6)` |

<br>

**createUserDto**

| Field     | Type   | Validation                                    |
| --------- | ------ | --------------------------------------------- |
| firstname | string | `@IsString`                                   |
| lastname  | string | `@IsString`                                   |
| email     | string | `@IsEmail`                                    |
| username  | string | `@IsString`                                   |
| role      | string | `@IsIn(['admin', 'investigator', 'general'])` |

<br>

**RegisterDto**

| Field     | Type   | Validation & Notes              |
| --------- | ------ | ------------------------------- |
| firstname | string | `@IsNotEmpty()`                 |
| lastname  | string | `@IsNotEmpty()`                 |
| email     | string | `@IsEmail()`                    |
| username  | string | `@Matches(/^[A-Za-z0-9_.-]+$/)` |
| password  | string | `@MinLength(6)`                 |

<br>

**LoginDto**

| Field      | Type   | Validation                          |
| ---------- | ------ | ----------------------------------- |
| identifier | string | `@IsNotEmpty()` (username or email) |
| password   | string | `@IsNotEmpty()`                     |

<br>

**ResetPasswordDto**

| Field       | Type   | Validation         |
| ----------- | ------ | ------------------ |
| token       | string | Provided via email |
| newPassword | string | `@MinLength(6)`    |

<br>

**ChangePasswordDto**

| Field       | Type   | Validation                   |
| ----------- | ------ | ---------------------------- |
| OTP         | string | One-time password from email |
| newPassword | string | `@MinLength(6)`              |





