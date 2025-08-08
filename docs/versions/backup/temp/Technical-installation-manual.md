# Installation Guide

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

[BRAD-Developer-Guide](../../version2/BRAD-Developer-Guide.pdf)
