Architectural Requirements:

– **Quality** **Requirements**

> • **Security**: Critical due to the nature of cybersecurity work and
> sensitive data. • **Reliability**: Bot and system should perform
> consistently under various inputs. • **Scalability**: Ability to
> analyse many domains simultaneously.
>
> • **Maintainability**: Dockerised components support modular updates
> and bug fixes.
>
> • **Usability**: Web interface must be user-friendly, optionally
> mobile-friendly, and support dark mode.
>
> • **Performance**: Fast threat analysis and report generation.
>
> • **Compliance**: Adherence to GDPR, POPIA, and Cybersecurity ethics.
>
> • **Portability**: The software should run on different platforms and
> devices with minimal changes. It must be compatible with various
> operating systems and environments.
>
> • **Interoperability**: The system should exchange data and work with
> other services easily. It must follow standard formats (e.g., JSON)
> and protocols (e.g., HTTP/REST).

– **Architectural** **Patterns**

> • **Microservices** **Architecture** (implied by Dockerization &
> modular roles)
>
> – Each component (scraper, AI module, dashboard, API) could be
> deployed independently. • **Client-Server** **Model**
>
> – Frontend UI as the client; backend services/API as the server. •
> **Service-Oriented** **Architecture** **(SOA)**
>
> – System is decomposed into interoperable services (e.g.,
> ScrapeService, AnalyzeService, ReportService) with defined contracts
> (e.g., REST APIs), enabling loose coupling and reusability.
>
> • **Layered** **Architecture**
>
> – System logic is organized into layers (e.g., presentation,
> application, business logic, and data), improving separation of
> concerns, maintainability, and security.
>
> • **Pipe** **and** **Filter** **Pattern**
>
> – Data flows through a sequence of processing steps (filters), such as
> Scrape → Detect Malware → AI Analysis → Log → Report, allowing
> modular, reusable components with clear I/O boundaries.
>
> • **Model-View-Controller** **(MVC)** *(Optional* *for* *Frontend)*
>
> – Used in the dashboard to separate user interface (view), user input
> handling (controller), and data (model), improving UI maintainability
> and testability.

– **Design** **Patterns**

**1.** **Factory** **Pattern**

> • **Use** **Case**: Creating different types of bot agents or report
> objects depending on domain content (e.g., malware, phishing, scam).
>
> • **Benefit**: Encapsulates object creation, improves scalability when
> new domain types are introduced.

**2.** **Strategy** **Pattern**

> • **Use** **Case**: Switching between scraping techniques (e.g.,
> simple scraper vs. headless browser) or classification models.
>
> • **Benefit**: Makes it easy to plug in new algorithms or scraping
> methods without altering the core logic.

**3.** **Observer** **Pattern**

> • **Use** **Case**: Real-time alerting system—notify investigators
> when a high-risk domain is flagged.

• **Benefit**: Decouples alert logic from the classification engine.
**4.** **Singleton** **Pattern**

> • **Use** **Case**: Global configuration manager (e.g., for API keys,
> ML model paths, threat intelligence feeds).

• **Benefit**: Ensures a single point of configuration and avoids
conflicting settings. **5.** **Decorator** **Pattern**

> • **Use** **Case**: Enriching domain reports dynamically with new
> metadata like threat score, WHOIS, SSL info, etc.

• **Benefit**: Adds functionality without modifying existing report
structures. **6.** **Command** **Pattern**

> • **Use** **Case**: Encapsulating user actions like "submit report,"
> "analyze domain," "override AI decision" as objects.

• **Benefit**: Supports undo, logging, and replay features. **7.**
**Builder** **Pattern**

> • **Use** **Case**: Constructing complex domain reports step by step
> (text, screenshots, metadata, scores).

• **Benefit**: Separates construction logic from representation. **8.**
**Chain** **of** **Responsibility** **Pattern**

> • **Use** **Case**: Processing a domain through a pipeline (e.g.,
> scraping → analysis → risk scoring → report generation).

• **Benefit**: Each step handles the task it’s responsible for or passes
it to the next step. **9.** **Adapter** **Pattern**

> • **Use** **Case**: Integrating with various external threat
> intelligence APIs or WHOIS lookup tools. • **Benefit**: Converts
> incompatible interfaces into one that fits your system.

**10.** **Proxy** **Pattern**

> • **Use** **Case**: For secure access to the scraper bot or AI module
> (e.g., rate-limiting, authentication).

• **Benefit**: Adds a layer of control and security around sensitive
components. **11**. **Mediator** **Pattern**

> • **Use** **Case**: Manages communication between reporters and
> investigators through an Admin. Reporters submit reports, and the
> Admin assigns them to available investigators.
>
> • **Benefit**: Prevents direct communication between parties, improves
> coordination, and keeps the workflow secure and organized.

– **Constraints**

> • **Legal** **&** **Compliance** **Risks**: Must comply with GDPR,
> POPIA.
>
> • **Domain** **Blocking** **&** **Evasion**: Some sites may block
> scraping; might require headless browsers or IP rotation. Some
> websites don’t want to be automatically scanned or scraped by bots. So
> they use techniques to block your bot from accessing their content. To
> work around this tools like Headless browsers and IP rotation may be
> used. They prevent the bot
>
> from being blocked by making it seem like it is a normal user when it
> is fact not a normal user.
>
> • **False** **Positives** **in** **AI** **Classification**: May
> require manual override or verification, i.e. AI might incorrectly
> flag a safe domain as malicious. Since AI isn't perfect, there’s a
> chance it could make mistakes. That’s why you might need a manual
> override or human verification, where a security analyst or
> investigator reviews the case and decides if the AI's decision was
> actually correct.
>
> • **Data** **Privacy** **&** **Ethics**: Need secure storage,
> anonymization, and ethical data handling practices.
>
> • **Budgetary** **Limits**: Although a server and some funds are
> provided, the project must stay within the allocated budget.
