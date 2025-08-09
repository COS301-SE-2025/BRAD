# Use the official Playwright image with Python and Chromium
FROM mcr.microsoft.com/playwright/python:v1.44.0-jammy

# Set working directory
WORKDIR /app

# Copy dependency list and install
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy source code
COPY ./src ./src

# Unbuffer Python output for real-time logs
ENV PYTHONUNBUFFERED=1

# Install Playwright dependencies
RUN playwright install --with-deps

# Run the bot
CMD ["dramatiq", "src.worker", "--processes", "1", "--threads", "1"]