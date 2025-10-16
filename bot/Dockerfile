# Use the official Playwright image with Python + Chromium preinstalled
FROM mcr.microsoft.com/playwright/python:v1.44.0-jammy

WORKDIR /app

# Copy only requirements first for better layer caching
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy source
COPY ./src ./src

# Ensure runtime dirs exist
RUN mkdir -p /data/screenshots

# Recommended env
ENV PYTHONUNBUFFERED=1
ENV PYTHONPATH=/app

# Playwright browsers are already present; if you ever need to re-install, uncomment:
# RUN playwright install chromium

# Start Dramatiq worker (make sure module name matches your actor module)
CMD ["dramatiq", "src.worker", "--processes", "1", "--threads", "1"]
