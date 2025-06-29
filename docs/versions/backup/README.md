<div align="center">

# Hello World Inc - B.R.A.D - COS301 Capstone

</div>

<p style="text-align: center;">

<div align="center">
    <img src="docs/svgs/hello-world-logo.png" alt="Hello-World-Logo" width="300" height="300">
</div>

</p>

<div align="center">

# B.R.A.D Tyto Insights x DNS.Business

</div>

<!-- [![License: MIT](https://cdn.prod.website-files.com/5e0f1144930a8bc8aace526c/65dd9eb5aaca434fac4f1c34_License-MIT-blue.svg)](/LICENSE)
[![Deps](https://cdn.prod.website-files.com/5e0f1144930a8bc8aace526c/65dd9eb5aaca434fac4f1c9e_Deps-Up--to--date-brightgreen.svg)]()
[![Build Status](https://cdn.prod.website-files.com/5e0f1144930a8bc8aace526c/65dd9eb5aaca434fac4f1c7c_Build-Passing-brightgreen.svg)]()
![Static Badge](https://img.shields.io/badge/Coverage-83%25-brightgreen) -->

# Overview

This repository contains our team's **B.R.A.D. (Bot to Report Abusive Domains)** project, **a cybersecurity web application** that automates the analysis of potentially malicious URLs. Users can submit suspicious links through the website, where an AI-powered bot safely visits and analyzes the domain. The system extracts metadata, detects threats like malware, and compiles forensic reports. All findings are aggregated into a centralized platform that supports **incident reporting, dashboard visualization, and historical threat analysis**.

## Contents:

- [Documentation](#documentation)
- [Demo videos](#demo-videos)
- [Installation](#installation)
- [Technologies used](#technologies-used)
- [Team](#team-members)
- [Contact Us](#contact-us)

## Repository Structure

```
📂 MP4
├── 📂 frontend/            # UI
├── 📂 docs/                # Documentation
├── 📄 README.md            # Project overview
├── 📄 docker-compose.yml   # Docker setup
├── 📄 .gitignore           # Ignore unnecessary files
├── 📄 .dockerignore        # Ignore unnecessary files
```

## Documentation

- [SRS Document](/docs/SRS_Document.md)
  <!-- - [Design specifications](/docs/DesignRequirements.md) -->
  <!-- - [Service Contract](/docs/Service_Contracts.md) -->
  <!-- - [User Stories](/docs/User_Stories.md) -->
  <!-- - [Architectural Requirements](/docs/Architectural_Requirements.md) -->
  <!-- - [Quality Requirements](/docs/Quality_Requirements.pdf) -->
- [Github Contributions](/docs/GitHub_Contributions.md)
    <!-- - [Github Contributions](/docs/requirement-specs/GitHub-contributions.pdf) -->
    <!-- - [API Documentation](/docs/requirement-specs/API_Documentation.md) -->
- [Older Versions](/docs/versions/)

## Demo Videos

<!-- - [MP4-Demo1](https://drive.google.com/file/d/17mjbkHNwQ7dw3W5S9SFvYshkr1r34ICE/view?usp=sharing)
- [MP4-Demo1.pdf](/docs/requirement-specs/MP4-Demo1.pdf)
- [MP4-Demo2](https://drive.google.com/file/d/19o50OhefAFh2qgN6Zg8dnNXcm8-NMJCH/view?usp=sharing)
- [MP4-Demo2.pdf](/docs/requirement-specs/MP4-Demo2.pdf) -->

## Installation

### **1. Clone the Repository**

```sh
git clone https://github.com/COS301-SE-2025/BRAD.git

cd BRAD
```

### **2. Running the Project (Docker)**

Ensure you have **Docker** installed, then run:

(first time only)

```sh
docker compose build
```

then

```sh
docker compose up
```

<!-- This will start the **daemon, API, CLI, and UI**. -->

### **3. Viewing the Project**

You should see a message similar to this:

```sh
Local: http://localhost:5173/
```

Simply type this link into a browser to view the project.

### **4. Running Tests**

<!-- Tests can be run locally using [Act](https://github.com/nektos/act), which provides developers with the ability to run GitHub workflows locally.
To do this, first install Act and then simply run the `act` command. To run specific tests the `-W` can be specified as follows:

```sh
act -W path/to/workflow.yml
``` -->

## Technologies used

<p style="text-align: center;">
    <img src="docs/svgs/docker.svg" alt="Docker" width="50" height="50">
    <img src="docs/svgs/figma.svg" alt="Figma" width="50" height="50">
    <img src="docs/svgs/git.svg" alt="Git" width="50" height="50">
    <img src="docs/svgs/github-color.svg" alt="GitHub" width="50" height="50">
    <!-- <img src="docs/svgs/java.svg" alt="GitHub" width="50" height="50"> -->
    <img src="docs/svgs/react.svg" alt="GitHub" width="50" height="50">
    <!-- <img src="docs/svgs/tailwind.svg" alt="GitHub" width="50" height="50"> -->
    <!-- <img src="docs/svgs/typescript.svg" alt="GitHub" width="50" height="50"> -->
    <img src="docs/svgs/vscode.svg" alt="VSCode" width="50" height="50">
</p>

## CI/CD & GitHub Actions

- **CI/CD** is handled using **GitHub Actions**.
- On each push, the pipeline will:
  - **Run tests** (unit, integration, E2E)
  - **Build the project**
  - **Deploy to a containerized environment**

## Contribution Outline

1. **Create a branch** for your feature: `git checkout -b feature-name`
2. **Commit changes** with clear messages.
3. **Open a Pull Request (PR)** for review.
4. **Ensure tests pass** before merging. -->

## Team members

| Name                              | Primary roles           | Links                                                                                                                                                                                                                                               |
| --------------------------------- | ----------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| E (Ethan) Vletter u22497082       | Project Manager, DevOps | [<img src="docs/svgs/linkedin.svg" alt="Linkedin" width="30" height="30">](https://www.linkedin.com/in/ethan-vletter/) [<img src="docs/svgs/github-color.svg" alt="Github" width="30" height="30">](https://github.com/EthanVletter)                |
| TS (Tebatso) Mahlathini u22611704 | API, DevOps             | [<img src="docs/svgs/linkedin.svg" alt="Linkedin" width="30" height="30">](https://www.linkedin.com/in/tebatso-mahlathini-30864b256/) [<img src="docs/svgs/github-color.svg" alt="Github" width="30" height="30">](https://github.com/tebatsoSophy) |
| C (Carinda) Smith u22652974       | API                     | [<img src="docs/svgs/linkedin.svg" alt="Linkedin" width="30" height="30">](http://www.linkedin.com/in/carinda-smith-a01a9430a) [<img src="docs/svgs/github-color.svg" alt="Github" width="30" height="30">](https://github.com/carinda-smith)       |
| M (Megan) Pretorius u23708833     | UI                      | [<img src="docs/svgs/linkedin.svg" alt="Linkedin" width="30" height="30">]() [<img src="docs/svgs/github-color.svg" alt="Github" width="30" height="30">]()                                                                                         |
| S (Salome) Kalaka u19364742       | API                     | [<img src="docs/svgs/linkedin.svg" alt="Linkedin" width="30" height="30">]() [<img src="docs/svgs/github-color.svg" alt="Github" width="30" height="30">]()                                                                                         |

## Contact Us

cos301.cap2@gmail.com
