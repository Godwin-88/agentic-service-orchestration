# 🚀 Quick Start — First Time Setup

Complete this checklist in order. Estimated time: 15 minutes.

---

## Step 1: Configuration (5 min)

```bash
# Clone or navigate to project
cd /home/g/projects/agenticmarcom

# Copy environment template
cp .env.example .env

# Generate secure passwords
DB_PASSWORD=$(openssl rand -base64 32)
N8N_KEY=$(openssl rand -base64 32)
AGENT_KEY=$(openssl rand -hex 32)

# Edit .env with a text editor
nano .env

# Key variables to set:
# DB_PASSWORD=<paste_generated_password>
# N8N_ENCRYPTION_KEY=<paste_generated_key>
# AGENT_API_KEY=<paste_generated_key>
# ANTHROPIC_API_KEY=sk-ant-...  (from Anthropic)
# OPENAI_API_KEY=sk-...          (from OpenAI)

# Verify no placeholder values remain
grep "change_me\|xxxx\|sk-ant" .env
# Should output nothing if clean
```

---

## Step 2: Start Services (3 min)

```bash
# Start all containers (first run builds agents image)
docker compose up -d

# Monitor startup (watch for "healthy" status)
docker compose logs -f

# Expected output after 2-3 minutes:
# postgres: "ready to accept connections"
# redis: "ready to accept connections"
# n8n: "Application startup complete"
# agents: "Application startup complete"
# metabase: "Metabase initialization complete"
# nginx: "listening on port 80"

# Press Ctrl+C to exit logs
```

---

## Step 3: Verify Services (5 min)

### Quick Health Check

```bash
# All services running?
docker ps
# Should show 6 containers, all in "Up" status

# Health check hits
curl http://localhost:5678/healthz      # n8n
curl http://localhost:8000/health       # Agents
curl http://localhost:3001/api/health   # Metabase
curl http://localhost/health            # Nginx

# All should return 200 OK
```

### Access Dashboards

Open in browser:

- **n8n**: http://localhost:5678
  - Create admin user on first visit
  - Email: `admin@example.com`
  - Password: Choose strong password

- **Agents API Docs**: http://localhost:8000/docs
  - Swagger UI with all agent endpoints
  - Try `/health` endpoint

- **Metabase**: http://localhost:3001
  - Email: `admin@metabase.local`
  - Password: `metabase` (default, change after first login)

- **PostgreSQL**: `localhost:5432`
  - User: `postgres`
  - Password: (from .env `DB_PASSWORD`)

---

## Step 4: Database Verification (2 min)

```bash
# Connect to PostgreSQL
PGPASSWORD=$(grep DB_PASSWORD .env | cut -d= -f2) \
  psql -h localhost -U postgres -d marketing_hub

# Inside psql prompt, verify schema:
\dt  # List tables (should show ~20 tables)

SELECT COUNT(*) FROM information_schema.tables 
WHERE table_schema = 'public';
# Should return ~20+

\q  # Exit
```

---

## Troubleshooting Quick Fixes

### Service won't start
```bash
# Rebuild from scratch
docker compose down -v
docker compose up -d --build
```

### Port already in use
```bash
# Find what's using port 5678 (n8n)
lsof -i :5678
# Kill the process
kill -9 <PID>
```

### Database connection failed
```bash
# Check PostgreSQL is healthy
docker compose exec postgres pg_isready -U postgres

# View PostgreSQL logs
docker compose logs postgres
```

### Agents service failing
```bash
# Rebuild agents image
docker compose up -d --build agents

# Check build errors
docker compose logs agents | grep -i error
```

---

## Next: Configure API Keys (Do This Before Phase 2)

1. **Meta (Facebook & Instagram)**
   - Go to https://developers.facebook.com
   - Create app → Select "Business"
   - Get: App ID, App Secret, Page ID, Access Token
   - Add to `.env`: `META_APP_ID`, `META_APP_SECRET`, `META_PAGE_ID`, `META_ACCESS_TOKEN`

2. **LinkedIn**
   - https://www.linkedin.com/developers
   - Create app in LinkedIn Partner Network
   - Get: Client ID, Client Secret, Access Token
   - Add to `.env`: `LINKEDIN_APP_ID`, `LINKEDIN_APP_SECRET`, `LINKEDIN_ACCESS_TOKEN`

3. **TikTok**
   - https://ads.tiktok.com/marketing_api/
   - Register for TikTok for Business API
   - Get: Client Key, Client Secret, Access Token
   - Add to `.env`: `TIKTOK_CLIENT_KEY`, `TIKTOK_CLIENT_SECRET`, `TIKTOK_ACCESS_TOKEN`

4. **YouTube**
   - https://console.cloud.google.com
   - Create project → Enable YouTube Data API
   - Create OAuth 2.0 credential (API key)
   - Add to `.env`: `YOUTUBE_API_KEY`

5. **WhatsApp**
   - https://www.whatsapp.com/business/api
   - Request business API access from Meta
   - Verify phone number
   - Get: Phone Number ID, Business Account ID, Access Token
   - Add to `.env`: `WHATSAPP_PHONE_NUMBER_ID`, `WHATSAPP_BUSINESS_ACCOUNT_ID`, `WHATSAPP_ACCESS_TOKEN`

6. **LLMs**
   - **Anthropic**: https://console.anthropic.com → Get API key
   - **OpenAI**: https://platform.openai.com → Create API key
   - Add to `.env`: `ANTHROPIC_API_KEY`, `OPENAI_API_KEY`

7. **Slack** (Optional, for notifications)
   - Create Slack app: https://api.slack.com/apps
   - Enable Incoming Webhooks
   - Create webhook URL for #alerts channel
   - Add to `.env`: `SLACK_WEBHOOK_URL`

---

## Phase 1 Completion Checklist

- [ ] All 6 containers running and healthy
- [ ] PostgreSQL schema verified (20+ tables)
- [ ] n8n accessible, admin user created
- [ ] Agents service responding to health check
- [ ] Metabase connected to database
- [ ] Nginx reverse proxy routing verified
- [ ] `.env` configured with all API keys
- [ ] Social platform OAuth completed
- [ ] Database backup tested

---

## What's Next?

Phase 1 is complete! Ready for Phase 2: **Automation — Publishing & Lead Capture**

**Phase 2 focus**:
1. Create content calendar UI (Next.js)
2. Build n8n publishing workflows (5 channels)
3. Implement lead capture webhooks
4. Set up WhatsApp opt-in flow
5. Sync leads to CRM

See [ROADMAP.md](ROADMAP.md) for detailed Phase 2 plan or jump to [docs/02-automation-workflows.md](docs/02-automation-workflows.md).

---

## Quick Reference

| Service | Port | URL | User |
|---------|------|-----|------|
| n8n | 5678 | http://localhost:5678 | admin@example.com |
| Agents API | 8000 | http://localhost:8000/docs | n/a (API key auth) |
| Metabase | 3001 | http://localhost:3001 | admin@metabase.local |
| PostgreSQL | 5432 | localhost:5432 | postgres |
| Redis | 6379 | localhost:6379 | n/a |
| Nginx | 80 | http://localhost | n/a |

---

## Help

- **Docker issues?** → Check `logs`
- **Database issues?** → See [01-infrastructure-setup.md](docs/01-infrastructure-setup.md)
- **API errors?** → View [Agent docs](http://localhost:8000/docs)
- **Full guide?** → Read [README.md](README.md)

---

**Status**: ✓ Phase 1 Complete | **Next**: Phase 2 (Automation) | **Timeline**: 4 weeks

Last updated: June 3, 2026
