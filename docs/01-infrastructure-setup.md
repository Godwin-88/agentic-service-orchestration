# 01 — Infrastructure Setup & Configuration

Complete walkthrough for provisioning the Digital Marketing Hub's foundational infrastructure: Docker Compose, PostgreSQL (with `pgvector`), Redis, n8n, FastAPI agents service, and Nginx.

---

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Environment Configuration](#environment-configuration)
3. [Docker Compose Deployment](#docker-compose-deployment)
4. [Database Setup & Verification](#database-setup--verification)
5. [n8n Initialization](#n8n-initialization)
6. [Agents Service Setup](#agents-service-setup)
7. [Nginx Reverse Proxy](#nginx-reverse-proxy)
8. [Health Checks & Verification](#health-checks--verification)

---

## Prerequisites

### System Requirements

- **OS**: Linux (Ubuntu 20.04+), macOS, or Windows (WSL2)
- **Docker**: 20.10+ with Docker Compose v2.0+
- **CPU**: 4+ cores recommended
- **RAM**: 8GB minimum (16GB for production)
- **Storage**: 50GB+ available (for logs, metrics, data)

### Install Docker & Docker Compose

**Ubuntu/Debian**:
```bash
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER
sudo apt-get install docker-compose-plugin
```

---

## Environment Configuration

### 1. Create `.env`

Copy the example file and update with your own secure values:

```bash
cp .env.example .env
chmod 600 .env 
```

### 2. Critical Variables

Update these in your `.env` file. **Do NOT commit `.env` to git.**

```bash
# Database (Postgres 16 + pgvector)
DB_PASSWORD=<strong_random_password>

# API Keys
GROQ_API_KEY=gsk_xxxxxxxxxxxx
AGENT_API_KEY=<generated_via_secrets>

# n8n
N8N_ENCRYPTION_KEY=<generated_via_secrets>
```

---

## Docker Compose Deployment

The project uses `pgvector/pgvector:pg16` to support AI semantic memory.

### 1. Start Services

```bash
docker compose up -d postgres redis n8n agents ui nginx
```

### 2. Monitor Startup

```bash
docker compose logs -f
```

---

## Database Setup & Verification

After starting containers, initialize the database schema and service extensions:

### 1. Run Migrations

```bash
# Base Schema
docker exec -i marketing_hub_postgres psql -U postgres -d marketing_hub < infrastructure/db/schema.sql

# CRM Extension
docker exec -i marketing_hub_postgres psql -U postgres -d marketing_hub < infrastructure/db/crm_full_schema.sql

# Service Extension (Products & Cases)
docker exec -i marketing_hub_postgres psql -U postgres -d marketing_hub < infrastructure/db/crm_service_extension.sql

# Initial Data
docker exec -i marketing_hub_postgres psql -U postgres -d marketing_hub < infrastructure/db/initial-data.sql
```

### 2. Verify Tables

```bash
docker compose exec postgres psql -U postgres -d marketing_hub -c "\dt"
```
Ensure tables like `leads`, `contacts`, `opportunities`, `proposals`, `cases`, and `products` exist.

---

## n8n Initialization

1. **Access**: http://localhost:5678
2. **Credentials**: Create a new **Generic Credential Type** -> **Header Auth** named **"PostgreSQL - Marketing Hub"** for all database nodes.
   - **Host**: `postgres`
   - **Database**: `marketing_hub`
   - **User**: `postgres`
   - **Password**: `postgres_dev`
   - **SSL**: Disable

---

## Agents Service Setup

The FastAPI service runs in a local `venv` during development (`./start-dev.sh`) or via Docker in production.

### Verify Endpoint

```bash
curl -H "X-API-Key: ${AGENT_API_KEY}" http://localhost:8000/health
```

---

## Health Checks

Use the included script to verify all services:

```bash
chmod +x ./scripts/healthcheck.sh
./scripts/healthcheck.sh
```

---

Last updated: June 2026
