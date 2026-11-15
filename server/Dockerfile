FROM python:3.12-slim
WORKDIR /app
COPY server.py /app/server.py
COPY public /app/public
ENV PUBLIC_DIR=/app/public HISTORY_DB=/data/history.sqlite3 PORT=8080 PYTHONDONTWRITEBYTECODE=1 PYTHONUNBUFFERED=1
EXPOSE 8080
VOLUME ["/data"]
CMD ["python", "/app/server.py"]
