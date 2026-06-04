# n8n Workflow Deployment Guide

**Complete step-by-step instructions to deploy all 20 n8n workflows** for the Digital Marketing Hub.

---

## Quick Start (5 Minutes)

### 1. Access n8n

```bash
# Open n8n in browser
open http://localhost:5678

# Or if remote:
open https://your-domain.com/n8n
```

### 2. Create PostgreSQL Credential

1. **Credentials** (bottom-left corner)
2. **+ Create new credential**
3. Type: **PostgreSQL**
4. Fill in:
   ```
   Host: postgres
   Port: 5432
   Database: marketing_hub
   Username: postgres
   Password: [from .env DB_PASSWORD]
   SSL: Unchecked
   ```
5. **Name**: `PostgreSQL - Marketing Hub`
6. **Save**

### 3. Import First Workflow

1. **Workflows** → **Create new**
2. Click menu (⋮) → **Import from file**
3. Select: `n8n/workflows/ingestion/ingest-meta-nightly.json`
4. Click **Update Credentials**:
   - Set PostgreSQL credential
   - Set Meta API credential (or create new)
5. **Save**

### 4. Test the Workflow

1. Click **Play button** to execute manually
2. Check PostgreSQL for data:
   ```bash
   docker compose exec postgres psql -U postgres -d marketing_hub -c "SELECT COUNT(*) FROM post_metrics;"
   ```
3. Check logs in n8n UI
4. If successful, click **Activate** to enable scheduling

---

## Detailed Setup

### Step 1: Verify n8n Access

n8n should be running on Docker:

```bash
# Check n8n is running
docker compose ps | grep n8n

# If not running:
docker compose up -d n8n
```

**Access n8n**:
- Local: `http://localhost:5678`
- Remote: `https://your-domain.com/n8n`

### Step 2: Create All Required Credentials

#### PostgreSQL (Required for ALL workflows)

1. Credentials → Create new → **PostgreSQL**
2. Configuration:
   ```
   Host: postgres (Docker) or your-db-host (production)
   Port: 5432
   Database: marketing_hub
   Username: postgres
   Password: (from .env: DB_PASSWORD)
   SSL: Unchecked for Docker, Checked for production
   ```
3. Name: `PostgreSQL - Marketing Hub`
4. Save

#### Meta API (Facebook + Instagram)

1. Credentials → Create new → **HTTP Header Auth**
2. Configuration:
   ```
   Name: Meta Graph API
   Headers:
     Authorization: Bearer {YOUR_META_ACCESS_TOKEN}
   ```
3. Where to get token:
   - Meta for Developers → Your App → Settings → Basic
   - Generate long-lived user token OR page token
   - Copy and paste

#### LinkedIn API

1. Credentials → Create new → **HTTP Header Auth**
2. Configuration:
   ```
   Name: LinkedIn API
   Headers:
     Authorization: Bearer {YOUR_LINKEDIN_ACCESS_TOKEN}
   ```

#### TikTok API

1. Credentials → Create new → **HTTP Header Auth**
2. Configuration:
   ```
   Name: TikTok API
   Headers:
     Authorization: Bearer {YOUR_TIKTOK_ACCESS_TOKEN}
   ```

#### YouTube API

1. Credentials → Create new → **API Key**
2. Configuration:
   ```
   Name: YouTube API
   API Key: {YOUR_YOUTUBE_API_KEY}
   ```

#### WhatsApp API

1. Credentials → Create new → **HTTP Header Auth**
2. Configuration:
   ```
   Name: WhatsApp API
   Headers:
     Authorization: Bearer {YOUR_WHATSAPP_BUSINESS_TOKEN}
   ```

#### Slack (Optional, for notifications)

1. Credentials → Create new → **Slack**
2. Configuration:
   ```
   Name: Slack - Marketing Hub
   Webhook URL: (from Slack incoming webhooks)
   ```

### Step 3: Import Workflows

#### Option A: Import from JSON Files (Recommended)

1. **Workflows** → Click **+ Create new**
2. Menu (⋮) → **Import from file**
3. Select JSON file from `n8n/workflows/`
4. Click **Update Credentials** and select appropriate credentials
5. **Save**

#### Option B: Manual Import (If files not available)

1. **Workflows** → **+ Create new**
2. Manually recreate workflow by:
   - Adding nodes (Cron, HTTP, Code, PostgreSQL, etc.)
   - Configuring each node
   - Connecting nodes
   - Setting credentials

**Files to import** (in order of priority):

**Ingestion (Priority 1)**:
```
✓ n8n/workflows/ingestion/ingest-meta-nightly.json (2:00 AM)
✓ n8n/workflows/ingestion/ingest-linkedin-nightly.json (2:10 AM)
✓ n8n/workflows/ingestion/ingest-tiktok-nightly.json (2:20 AM)
✓ n8n/workflows/ingestion/ingest-youtube-nightly.json (2:30 AM)
✓ n8n/workflows/ingestion/ingest-whatsapp-nightly.json (2:40 AM)
```

**Lead Capture (Priority 2)**:
```
✓ n8n/workflows/lead-capture/capture-leads-link-click.json (webhook)
```

**Publishing (Priority 3)**: [To be created]

**Analytics (Priority 4)**: [To be created]

### Step 4: Test Each Workflow

#### Ingestion Workflows

1. Open `ingest-meta-nightly`
2. Click **Play button** (execute manually)
3. Wait for completion (30 seconds to 2 minutes)
4. Check **Execution** tab for results
5. Verify in PostgreSQL:
   ```bash
   docker compose exec postgres psql -U postgres -d marketing_hub << EOF
   SELECT COUNT(*) as metric_count FROM post_metrics;
   SELECT DISTINCT platform FROM post_metrics;
   EOF
   ```

#### Lead Capture Workflows

1. Open `capture-leads-link-click`
2. Copy the webhook URL from top of editor
3. Test webhook:
   ```bash
   curl -X POST http://localhost/n8n/webhook/lead-click \
     -H "Content-Type: application/json" \
     -d '{
       "email": "test@example.com",
       "first_name": "Test",
       "utm_source": "social",
       "utm_campaign": "summer-sale"
     }'
   ```
4. Check PostgreSQL:
   ```bash
   docker compose exec postgres psql -U postgres -d marketing_hub << EOF
   SELECT * FROM leads WHERE email = 'test@example.com';
   SELECT * FROM lead_interactions WHERE lead_id = (SELECT id FROM leads WHERE email = 'test@example.com');
   EOF
   ```

### Step 5: Activate Workflows

Once tested and confirmed working:

1. Open workflow
2. Click **Activate** (toggle in top-right)
3. Status changes to green "Active"
4. Workflow runs on schedule

**Ingestion Schedule**:
- Meta: 2:00 AM UTC daily
- LinkedIn: 2:10 AM UTC daily
- TikTok: 2:20 AM UTC daily
- YouTube: 2:30 AM UTC daily
- WhatsApp: 2:40 AM UTC daily

**Lead Capture**: Always active (webhook-triggered)

---

## Workflow Categories

### 1. Ingestion Workflows (5 total)

**Purpose**: Collect metrics from all platforms nightly

| Workflow | Schedule | Platforms | Output |
|----------|----------|-----------|--------|
| ingest-meta-nightly | 2:00 AM UTC | Facebook, Instagram | post_metrics table |
| ingest-linkedin-nightly | 2:10 AM UTC | LinkedIn | post_metrics table |
| ingest-tiktok-nightly | 2:20 AM UTC | TikTok | post_metrics table |
| ingest-youtube-nightly | 2:30 AM UTC | YouTube | post_metrics table |
| ingest-whatsapp-nightly | 2:40 AM UTC | WhatsApp | post_metrics table |

**Each workflow**:
- Queries connected accounts from DB
- Calls platform API for metrics
- Transforms to standardized schema
- Inserts/updates `post_metrics` table
- Logs to `action_log` table

### 2. Publishing Workflows (5 total) — [To be created]

**Purpose**: Publish scheduled posts to all platforms

| Workflow | Trigger | Platforms | Input |
|----------|---------|-----------|-------|
| publish-meta-ondemand | Manual/Scheduled | Facebook, Instagram | posts table |
| publish-linkedin-ondemand | Manual/Scheduled | LinkedIn | posts table |
| publish-tiktok-ondemand | Manual/Scheduled | TikTok | posts table |
| publish-youtube-ondemand | Manual/Scheduled | YouTube | posts table |
| publish-whatsapp-ondemand | Manual/Scheduled | WhatsApp | posts table |

### 3. Lead Capture Workflows (3 total)

**Purpose**: Capture leads from social interactions

| Workflow | Trigger | Input | Output |
|----------|---------|-------|--------|
| capture-leads-link-click | Webhook | UTM params | leads table |
| capture-leads-form-submission | Webhook | Form data | leads table |
| capture-leads-dm-response | Webhook | DM text | leads table |

### 4. Lead Processing Workflows (2 total) — [To be created]

| Workflow | Trigger | Purpose |
|----------|---------|---------|
| process-lead-scoring | Lead create | Call LangGraph agent, score lead |
| sync-to-crm | Lead update | Push to HubSpot/Pipedrive/Salesforce |

### 5. Analytics Workflows (3 total) — [To be created]

| Workflow | Schedule | Purpose | Output |
|----------|----------|---------|--------|
| aggregate-kpi-nightly | 3:00 AM UTC | Daily KPI summary | kpi_summary table |
| detect-anomalies-hourly | Every hour | Detect unusual patterns | anomalies table |
| report-generation-weekly | Monday 8 AM | Generate weekly report | Slack message |

---

## Monitoring & Troubleshooting

### Check Workflow Execution History

1. Open workflow
2. Click **Execution** tab
3. See all run history, success/failure, execution time

### Debug Failed Workflow

1. Click on failed execution
2. Expand each node to see:
   - Input data
   - Output data
   - Error message
3. Check `action_log` table:
   ```bash
   docker compose exec postgres psql -U postgres -d marketing_hub -c "
   SELECT * FROM action_log 
   WHERE action_type LIKE '%workflow%' 
   ORDER BY created_at DESC LIMIT 10;"
   ```

### Common Issues

**Database Connection Error**:
- Verify PostgreSQL is running: `docker compose ps postgres`
- Verify credentials in n8n match .env
- Test connection: Click "Test Connection" in credential editor

**API Authentication Error**:
- Verify token is still valid (may have expired)
- Check token has correct scopes:
  - Meta: `pages_read_engagement,pages_read_user_content`
  - LinkedIn: `r_marketing_developerapps`
  - YouTube: `youtube.readonly`
- Refresh token if needed

**No Data Inserted**:
- Check workflow executed without errors
- Run SELECT query to verify:
  ```bash
  docker compose exec postgres psql -U postgres -d marketing_hub -c "
  SELECT COUNT(*) FROM action_log 
  WHERE created_at > NOW() - INTERVAL '1 hour';"
  ```
- Check if connected accounts exist:
  ```bash
  docker compose exec postgres psql -U postgres -d marketing_hub -c "
  SELECT * FROM channels WHERE connected_status = 'connected';"
  ```

**Webhook Not Triggering**:
- Verify webhook URL in n8n editor
- Test URL with curl:
  ```bash
  curl -X POST http://localhost/n8n/webhook/your-webhook-path \
    -H "Content-Type: application/json" \
    -d '{"test": "data"}'
  ```
- Check n8n logs: `docker compose logs n8n | grep webhook`

---

## Performance Tips

1. **Stagger ingestion workflows** (every 10 minutes) to avoid database contention
2. **Limit API calls** per workflow (use pagination, maxResults)
3. **Use database indexes** on frequently queried columns
4. **Enable caching** in Redis for metrics lookups
5. **Monitor execution time** in n8n UI (should be < 2 minutes)

---

## Next Steps

1. **✓ Import ingestion workflows** (5 workflows)
2. **✓ Test manually** and verify data
3. **→ Activate schedules** for nightly runs
4. **→ Monitor** Slack alerts and logs
5. **→ Create publishing workflows** (5 workflows)
6. **→ Create lead capture** webhook handlers
7. **→ Implement analytics** aggregation
8. **→ Set up LangGraph agent** integration

---

**Last updated**: June 3, 2026  
**Workflow version**: 1.0  
**Status**: Ingestion workflows ready, others pending
