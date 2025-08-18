# B.R.A.D. Installation Guide

# Introduction

**BRAD** is a web-based system that consists of a front-end application and a back-end API. The system uses a MongoDB database and includes bot integration and email services. To run BRAD, you need to install Docker and Node.js, clone the repository, configure environment variables, and start the Docker containers. This guide covers installation on **Windows**, **macOS**, and **Linux**, and ensures all required dependencies are correctly set up.

<!-- --- -->

# Prerequisites

Before installing BRAD, ensure you have the following software installed:

| Software       | Version | Installation Instructions                                                    |
| -------------- | ------- | ---------------------------------------------------------------------------- |
| Git            | ≥ 2.40  | [Install Git](https://git-scm.com/book/en/v2/Getting-Started-Installing-Git) |
| Docker         | ≥ 24.0  | [Install Docker](https://www.docker.com/products/docker-desktop/)            |
| Docker Compose | ≥ 2.20  | Usually bundled with Docker; verify using `docker-compose --version`         |
| Node.js        | ≥ 20.0  | [Install Node.js](https://nodejs.org/en/download/)                           |
| npm            | ≥ 9.0   | Installed with Node.js                                                       |
| Text Editor    | Any     | Recommended: [VS Code](https://code.visualstudio.com/download)               |

> **Note:** For Windows users, enable WSL 2 if running Linux containers. For macOS, ensure Docker Desktop has proper permissions.

<!-- --- -->

# Installation

## 1. Clone the Repository

Open your terminal and run:

```bash
git clone https://github.com/COS301-SE-2025/BRAD.git
cd BRAD
```

## 2. Setup Environment Variables

Copy the example environment file and fill in your secrets:

```bash
cp .env.example .env
```

Open .env in your favorite text editor and update the values as needed, for example:

```bash
JWT_SECRET=your_jwt_secret_here
BOT_ACCESS_KEY=your_bot_access_key_here
EMAIL_USER=your_email@example.com
EMAIL_PASS=your_email_password
```

_Important:_ To get the correct keys and passwords, contact a contributer of the BRAD project

## 3. Start the Docker Containers

Make sure you have Docker installed. Then run:

(showing container logs)

```bash
docker-compose up --build
```

_or_

(faster startup if volumes already exist)

```bash
docker-compose up
```

_or_

(running in the background)

```bash
docker-compose up --build -d
```

## 4. Accessing the Application in Your Browser

Once Docker has started all services successfully, open your browser and go to the following URL:

```bash
http://localhost:5173
```

_If you are running this on a remote server, replace `localhost` with the server’s IP or domain name._

## 5. Stopping the Containers

To stop the running containers, run:

(simple shutdown)

```bash
docker-compose down
```

_or_

(keyboard shortcut)

```bash
CTRL + C
```

_or_

(removes docker volumes)

```bash
docker-compose down -v
```

## 6. Optional

Our previous installation is also accessible that shows installation of individual components to run without docker.

[BRAD-Developer-Guide](versions/version2/BRAD-Developer-Guide.pdf)
