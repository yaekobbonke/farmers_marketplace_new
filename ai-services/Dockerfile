FROM python:3.11-slim

# Install system dependencies for XGBoost and Psycopg2
RUN apt-get update && apt-get install -y \
    build-essential \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy the rest of the code
COPY . .

# Expose the FastAPI port
EXPOSE 8000

# Run Uvicorn (0.0.0.0 is required for Docker networking)
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]