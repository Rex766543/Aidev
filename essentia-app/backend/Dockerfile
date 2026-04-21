# backend/Dockerfile
# Essentia は公式イメージを使用 (Ubuntu 22.04 ベース)
FROM python:3.10-slim

# システム依存ライブラリ (Essentia / librosa に必要)
RUN apt-get update && apt-get install -y \
    ffmpeg \
    libsndfile1 \
    libfftw3-dev \
    libyaml-dev \
    git \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# requirements を先にコピーしてキャッシュを活用
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

# 開発時はリロード有効、本番は CMD を上書き
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--reload"]
