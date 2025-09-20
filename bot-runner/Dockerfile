# bot-runner/Dockerfile
FROM mcr.microsoft.com/playwright/python:v1.44.0-jammy

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY ./src ./src

RUN mkdir -p /app/screenshots /app/logs

ENV PYTHONUNBUFFERED=1
ENV PYTHONPATH=/app

# Runner entrypoint — pulls TARGET_URL + REPORT_ID from env
CMD ["python", "-m", "src.runner"]
