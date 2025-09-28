FROM python:3.11-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY . .
RUN python train_model.py  # Add this line
CMD ["uvicorn", "domain_api:app", "--host", "0.0.0.0", "--port", "8000"]