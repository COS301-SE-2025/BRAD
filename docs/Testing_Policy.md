# BRAD Testing Policy Document

## Table of Contents

* [Introduction](#introduction)
* [Purpose](#purpose)
* [Objectives](#objectives)
* [Testing Process](#testing-process)

  * [Unit Testing](#unit-testing)
  * [Integration Testing](#integration-testing)
  * [Automation and CI Pipeline](#automation-and-ci-pipeline)
* [Quality Assurance Metrics and Testing](#quality-assurance-metrics-and-testing)

  * [Security](#security)
  * [Compliance](#compliance)
  * [Reliability](#reliability)
  * [Scalability](#scalability)
  * [Maintainability](#maintainability)
* [Frontend Testing (UI Testing)](#frontend-testing-ui-testing)
* [Backend Testing (API Testing)](#backend-testing-api-testing)
* [Bot Testing](#bot-testing)
* [Tools Used](#tools-used)
* [Conclusion](#conclusion)

---

## Introduction

The BRAD system automates the investigation of suspicious domains, securely collecting and analyzing content to detect threats. Centralized reporting and dashboards provide insight for effective incident analysis.

## Purpose

This Testing Policy defines the processes, objectives and strategies required to ensure that the BRAD system functions correctly, remains secure and delivers a reliable and high-quality experience. It establishes a clear framework for testing all components including the Bot, API and frontend, ensuring that suspicious domain reports are accurately analyzed, centralized dashboards operate effectively and the system consistently meets its top quality requirements.

## Objectives

The objectives of this Testing Policy are to identify and address all potential scenarios and edge cases that may arise within the BRAD system. This ensures that the Bot, API, and frontend components can correctly handle user submissions of suspicious domains, analyze and process content securely, and maintain accurate reporting in the dashboards. By implementing robust validation, error handling, and recovery strategies, the BRAD system will operate reliably, securely, and efficiently, providing investigators with consistent and trustworthy threat analysis.

## Testing Process
Our team employs Jest, MongoDB Memory Server, SuperTest, Nodemailer Mock, Pytest, Pytest-Cov, Docker Compose (test services), Dramatic Stubbroker, and React Testing Library as the primary testing tools to conduct unit and integration tests for the BRAD system. These tools ensure comprehensive coverage of individual components (Bot, API, frontend) and their interactions across the system. For automation and consistency, GitHub Actions serves as the continuous integration (CI) pipeline, ensuring all tests are executed before code merges into the main branch. For non-functional testing of reliability, scalability, and security, we use JMeter and Swagger UI. Our goal is to achieve thorough test coverage to ensure the system meets its top quality requirements.

### Unit Testing

For unit testing:

Backend/API: Jest, MongoDB Memory Server, SuperTest, and Nodemailer Mock verify that each function, service, and endpoint behaves as expected in isolation.

Bot: Pytest, Pytest-Cov, Docker Compose (test services), and Dramatic Stubbroker test the bot’s functionality and integration with system services.

Frontend: React Testing Library and Jest validate individual UI components and interactions.

These tools provide immediate feedback on any issues, ensuring that each component works correctly before integration with other modules.

### Integration Testing

Integration testing for the BRAD system ensures that the Bot, API and frontend components work together correctly when processing suspicious domain reports. We use Jest with SuperTest for API integration, Pytest with Docker Compose and Dramatic Stubbroker for the Bot, and React Testing Library with Jest for frontend interactions.

These tests simulate real-world workflows, such as a user submitting a suspicious URL, the bot analyzing the content, and the results being displayed correctly in the dashboards. Integration tests include both live tests, which interact with actual services and databases, and mocked tests, which simulate external dependencies. Mocked tests are particularly useful for handling scenarios like network issues, malware detection failures, or bot service interruptions without relying on live external resources.

### Automation and CI Pipeline

All unit and integration tests for the BRAD system are automatically executed within the GitHub Actions pipeline. This ensures that any changes to the Bot, API, or frontend are thoroughly tested before merging into the main branch. The pipeline logs all test results, providing immediate feedback on failures or issues and helping the team quickly identify and resolve bugs.

For scenarios where live integration tests require resources not available in the CI environment such as external malware analysis services or network-dependent bot operations we use mocked tests. This approach maintains consistent testing, high coverage, and code quality while keeping the CI process efficient and reliable.

## Quality Assurance Metrics and Testing

The BRAD system's top 5 quality requirements, listed from most important to least important:

## 1. Security

Security is essential to protect system data, maintain trust, and ensure compliance with regulatory standards. The BRAD system implements strong measures to prevent unauthorized access, data breaches, and other malicious activities. This includes securing user credentials, safeguarding bot operations, and protecting API endpoints.

### How We Achieve This

- **User Authentication via Hashed Passwords**: User passwords are securely hashed using bcrypt before being stored in the database, ensuring that plain-text passwords are never exposed.

  **Justification**: Hashing passwords with bcrypt ensures that credentials remain secure even if the database is compromised, protecting against brute-force attacks.

  **Measurement**: Penetration tests were conducted to verify the strength of the hashing mechanism.

- **JWT-Based Authentication for Access Control**: JSON Web Tokens (JWT) manage API sessions. Tokens are signed with a private key and required for all requests to protected endpoints.

  **Justification**: JWTs provide stateless, secure authentication and prevent session tampering, ensuring only authorized users can access sensitive functionalities.

  **Measurement**: Tests included checking for token expiration, replay attacks, and unauthorized access attempts.

- **Data Encryption for Sensitive Information**: All communication between clients, the API, and the bot is encrypted using TLS, protecting passwords, access tokens, and domain data.

  **Justification**: TLS prevents interception of sensitive data during transmission, protecting against man-in-the-middle attacks.

  **Measurement**: Network traffic monitoring and security scanning tools verified that sensitive data is transmitted securely.

- **Access Control for Sensitive Operations**: Only authorized users can submit reports, view investigation results, or access administrative functions.

  **Justification**: Role-based access ensures that sensitive information is only accessible to appropriate users, minimizing the risk of unauthorized exposure.

  **Measurement**: Role-based access control tests and security reviews confirmed proper enforcement and no unauthorized access.

![Screenshot: Password Hashing Test Results](./testing/Swagger_Security_Tests/Screenshot_(663).png)


## 2. Compliance

Compliance ensures that the BRAD system adheres to regulatory, legal, and organizational requirements. This includes responsible handling of user-submitted data, secure bot operations, and adherence to cybersecurity best practices.

### How We Achieve This

- **Data Protection and Privacy**: All evidence and submitted domains are stored securely in compliance with data protection guidelines.
  
  **Justification**: Protecting user-submitted evidence ensures that sensitive data is not mishandled or exposed.
  
  **Measurement**: Regular audits of stored evidence confirm encryption and controlled access.

- **Secure Logging and Reporting**: Investigation logs are protected and only accessible to authorized investigators.
  
  **Justification**: Ensures that investigation records are reliable, tamper-proof, and auditable.
  
  **Measurement**: Log reviews and integrity checks are performed regularly.

- **Use of Standardized Protocols**: TLS, JWT, and bcrypt are used across the system to align with industry security standards.
  
  **Justification**: Standardized practices ensure consistency, legal compliance, and reduce vulnerabilities.
  
  **Measurement**: Security scans confirm no use of deprecated or non-compliant protocols.

---

## 3. Reliability

Reliability ensures the BRAD system performs consistently under expected conditions, maintaining stability across the bot, API, and frontend.

### How We Achieve This

- **Error Handling and Recovery**: The system gracefully manages bot errors (e.g., inaccessible domains, malware detection) without crashing.
  
  **Justification**: Ensures uninterrupted investigations even when certain URLs or services fail.
  
  **Measurement**: Unit and integration tests simulate error scenarios to confirm consistent recovery.

- **Database Stability**: MongoDB with in-memory test servers ensures reliable operations both in production and during testing.
  
  **Justification**: Stable data handling avoids downtime and corrupted results.
  
  **Measurement**: Stress tests confirm consistent performance under normal load.

- **Monitoring and Logging**: Failures and unexpected behaviors are logged for rapid diagnosis.
  
  **Justification**: Proactive monitoring reduces downtime by enabling quick recovery from issues.
  
  **Measurement**: Reliability was tested through long-duration runs with continuous monitoring.

  <img src="./images/Usecase1V1.png"
  style="width:6.31514in;height:2.65903in" />

---

## 4. Scalability

Scalability ensures that BRAD can handle growing numbers of users, reports, and bot investigations without performance degradation.

### How We Achieve This

- **Load Testing with JMeter**: The API and bot interactions were tested under simulated high loads to ensure responsiveness under increased demand.
  
  **Justification**: Load testing validates that the system can scale with user growth and increased report submissions.
  
  **Measurement**: JMeter reports track response times, throughput, and error rates.

- **Dockerized Services**: The use of Docker Compose allows scalable deployment of API, bot, and supporting services.
  
  **Justification**: Containerization ensures BRAD can be deployed efficiently across distributed systems.
  
  **Measurement**: Scale tests simulated multiple containers under heavy traffic conditions.

- **Caching and Queuing**: The URL queue is designed to handle increasing report volumes without slowing down processing.
  
  **Justification**: Ensures fairness and efficiency in handling user reports.
  
  **Measurement**: Queue performance was measured under concurrent submissions.
<img src="./images/Usecase1V1.png"
style="width:6.31514in;height:2.65903in" />

---

## 5. Maintainability

Maintainability ensures that BRAD’s codebase and infrastructure can be easily updated, debugged, and extended by the development team.

### How We Achieve This

- **Modular Architecture**: Each system component (frontend, API, bot) is developed independently with dedicated testing.
  
  **Justification**: Makes it easier to add new features or fix bugs without affecting unrelated parts of the system.
  
  **Measurement**: Code reviews confirm separation of concerns and adherence to modular design.

- **Automated Testing with GitHub Actions**: All unit and integration tests run automatically on pull requests.
  
  **Justification**: Reduces the chance of introducing bugs into the main branch.
  
  **Measurement**: CI logs track test results for every code change.

- **Code Coverage Metrics**: Tools like `pytest-cov` and Jest coverage reports ensure meaningful test coverage.
  
  **Justification**: High test coverage provides confidence in long-term maintainability.
  
  **Measurement**: Coverage thresholds were set and validated in CI.

- **Documentation and Standards**: Swagger UI documents APIs and testing processes.
  
  **Justification**: Ensures that future developers and maintainers can understand and work with the system.
  
  **Measurement**: Documentation reviews and updates are part of sprint deliverables.


## Frontend Testing (UI Testing)

Test user interface components for correctness, usability, and integration with backend services.

## Backend Testing (API Testing)

Test all API endpoints for functionality, security, reliability, and performance.

## Bot Testing

Test the Bot module for functional correctness, security, and integration with API and frontend.

## Tools Used

* **Postman**: Functional and security testing of APIs.
* **Swagger UI**: API endpoint verification.
* **JMeter**: Reliability and scalability/load testing.
* **VS Code / Notepad**: Editing test scripts and documentation.
* **Browser Dev Tools**: Frontend testing and debugging.

## Conclusion

The testing of the BRAD system ensures that the application meets its top quality requirements and that individual components (Frontend, Backend, Bot) operate
