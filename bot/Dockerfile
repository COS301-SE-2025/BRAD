# Use the official Playwright image with Python already set up
FROM mcr.microsoft.com/playwright/python:v1.44.0-jammy

# Set working directory
WORKDIR /app

# Copy dependencies first
COPY requirements.txt .

# Install Python dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Copy the full source code
COPY . .

# Ensure output isn't buffered
ENV PYTHONUNBUFFERED=1

# Start the bot
CMD ["python", "src/bot.py", "pytest", "tests/integration/test_bot_integration.py", "-v"]