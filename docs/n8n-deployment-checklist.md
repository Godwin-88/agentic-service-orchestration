# n8n Workflow Deployment Checklist

**Use this checklist to deploy workflows step-by-step.**

---

## Pre-Deployment Setup

- [ ] Docker stack running: `docker compose ps` shows all 6 services
- [ ] n8n accessible at `http://localhost:5678`
- [ ] PostgreSQL database initialized with schema
- [ ] .env file configured with all credentials

---

## Create Credentials

### Required Credentials (All Workflows)

- [ ] PostgreSQL - Marketing Hub
  - [ ] Host: `postgres`
  - [ ] Port: `5432`
  - [ ] Database: `marketing_hub`
  - [ ] User: `postgres`
  - [ ] Password: [from .env]

### Social Platform Credentials (For ingestion workflows)

- [ ] Meta Graph API (HTTP Header Auth)
  - [ ] Header: `Authorization: Bearer {token}`
  - [ ] Test: Can access account insights
  
- [ ] LinkedIn API (HTTP Header Auth)
  - [ ] Header: `Authorization: Bearer {token}`
  - [ ] Test: Can list organization posts
  
- [ ] TikTok API (HTTP Header Auth)
  - [ ] Header: `Authorization: Bearer {token}`
  - [ ] Test: Can list videos

- [ ] YouTube API (API Key)
  - [ ] API Key: [from Google Cloud]
  - [ ] Test: Can search channel videos

- [ ] WhatsApp API (HTTP Header Auth)
  - [ ] Header: `Authorization: Bearer {token}`
  - [ ] Test: Can query messages

### Optional Credentials (For notifications)

- [ ] Slack (Slack)
  - [ ] Webhook URL: [from Slack]
  - [ ] Test: Send test message

---

## Import & Activate Ingestion Workflows

### Meta Ingestion (2:00 AM UTC)

- [ ] Import: `n8n/workflows/ingestion/ingest-meta-nightly.json`
- [ ] Credentials:
  - [ ] PostgreSQL: `PostgreSQL - Marketing Hub`
  - [ ] API: `Meta Graph API`
- [ ] Test: Click Play, wait for completion
- [ ] Verify: `SELECT COUNT(*) FROM post_metrics;`
- [ ] Activate: Toggle "Active" button
- [ ] Schedule: Cron 2:00 AM UTC

### LinkedIn Ingestion (2:10 AM UTC)

- [ ] Import: `n8n/workflows/ingestion/ingest-linkedin-nightly.json`
- [ ] Credentials:
  - [ ] PostgreSQL: `PostgreSQL - Marketing Hub`
  - [ ] API: `LinkedIn API`
- [ ] Test: Click Play, wait for completion
- [ ] Verify: `SELECT COUNT(*) FROM post_metrics WHERE created_at > NOW() - INTERVAL '5 minutes';`
- [ ] Activate: Toggle "Active" button
- [ ] Schedule: Cron 2:10 AM UTC

### TikTok Ingestion (2:20 AM UTC)

- [ ] Import: `n8n/workflows/ingestion/ingest-tiktok-nightly.json`
- [ ] Credentials:
  - [ ] PostgreSQL: `PostgreSQL - Marketing Hub`
  - [ ] API: `TikTok API`
- [ ] Test: Click Play
- [ ] Verify: Check for new post_metrics rows
- [ ] Activate: Toggle "Active" button
- [ ] Schedule: Cron 2:20 AM UTC

### YouTube Ingestion (2:30 AM UTC)

- [ ] Import: `n8n/workflows/ingestion/ingest-youtube-nightly.json`
- [ ] Credentials:
  - [ ] PostgreSQL: `PostgreSQL - Marketing Hub`
  - [ ] API: `YouTube API`
- [ ] Test: Click Play
- [ ] Verify: Check for new post_metrics rows
- [ ] Activate: Toggle "Active" button
- [ ] Schedule: Cron 2:30 AM UTC

### WhatsApp Ingestion (2:40 AM UTC)

- [ ] Import: `n8n/workflows/ingestion/ingest-whatsapp-nightly.json`
- [ ] Credentials:
  - [ ] PostgreSQL: `PostgreSQL - Marketing Hub`
  - [ ] API: `WhatsApp API`
- [ ] Test: Click Play
- [ ] Verify: Check for new post_metrics rows
- [ ] Activate: Toggle "Active" button
- [ ] Schedule: Cron 2:40 AM UTC

---

## Import & Activate Lead Capture Workflows

### Link Click Capture (Webhook)

- [ ] Import: `n8n/workflows/lead-capture/capture-leads-link-click.json`
- [ ] Credentials:
  - [ ] PostgreSQL: `PostgreSQL - Marketing Hub`
- [ ] Test webhook:
  ```bash
  curl -X POST http://localhost/n8n/webhook/lead-click \
    -H "Content-Type: application/json" \
    -d '{"email":"test@example.com","first_name":"Test","utm_source":"social"}'
  ```
- [ ] Verify: Check `leads` and `lead_interactions` tables
- [ ] Activate: Toggle "Active" button
- [ ] Note: Webhook URL is: `https://your-domain.com/webhook/lead-click`

### Form Submission Capture (Webhook) — [Coming soon]

- [ ] Import: `n8n/workflows/lead-capture/capture-leads-form-submission.json`
- [ ] Credentials: PostgreSQL
- [ ] Test: Submit form, check database
- [ ] Activate: Toggle "Active" button

### DM/Comment Response Capture (Webhook) — [Coming soon]

- [ ] Import: `n8n/workflows/lead-capture/capture-leads-dm-response.json`
- [ ] Credentials: PostgreSQL
- [ ] Test: Post comment, check database
- [ ] Activate: Toggle "Active" button

---

## Monitor Workflows

### Check Execution Status

```bash
# View all recent executions
docker compose logs n8n | tail -50

# Check action_log in database
docker compose exec postgres psql -U postgres -d marketing_hub << EOF
SELECT 
  action_type, 
  status, 
  COUNT(*) as count, 
  MAX(created_at) as last_run 
FROM action_log 
WHERE created_at > NOW() - INTERVAL '24 hours' 
GROUP BY action_type, status 
ORDER BY action_type;
EOF
```

### Troubleshoot Failed Workflows

```bash
# Find failed executions
docker compose exec postgres psql -U postgres -d marketing_hub << EOF
SELECT 
  action_type, 
  status, 
  error_message, 
  created_at 
FROM action_log 
WHERE status = 'failure' 
AND created_at > NOW() - INTERVAL '24 hours' 
ORDER BY created_at DESC;
EOF

# Check n8n logs for errors
docker compose logs n8n | grep -i error
```

### Verify Data Flow

```bash
# Metrics ingested today
docker compose exec postgres psql -U postgres -d marketing_hub << EOF
SELECT 
  DATE(created_at) as date,
  platform,
  COUNT(*) as metric_count 
FROM (
  SELECT channel_id, created_at FROM post_metrics
  JOIN channels ON post_metrics.channel_id = channels.id
) 
GROUP BY DATE(created_at), platform 
ORDER BY date DESC, platform;
EOF

# Leads captured today
docker compose exec postgres psql -U postgres -d marketing_hub << EOF
SELECT 
  DATE(created_at) as date,
  source_channel,
  lead_stage,
  COUNT(*) as lead_count 
FROM leads 
WHERE created_at > NOW() - INTERVAL '24 hours'
GROUP BY DATE(created_at), source_channel, lead_stage 
ORDER BY date DESC;
EOF
```

---

## Final Verification

- [ ] All 5 ingestion workflows are "Active"
- [ ] All lead capture workflows are "Active"
- [ ] First test run completed successfully
- [ ] Database received data from at least one workflow
- [ ] action_log shows success entries
- [ ] Slack notifications working (if enabled)
- [ ] No errors in n8n logs

---

## Next Phase

Once workflows are stable:

1. **Publishing Workflows** (5 workflows)
   - Auto-publish scheduled posts
   - Handle platform-specific formatting

2. **Analytics Workflows** (3 workflows)
   - Aggregate daily KPIs
   - Detect anomalies
   - Generate reports

3. **LangGraph Integration** (4 agents)
   - Lead scoring
   - Content brief generation
   - WhatsApp intent classification
   - Anomaly diagnostics

4. **Custom React Dashboard**
   - Content calendar
   - Analytics overview
   - Lead pipeline
   - WhatsApp broadcast

---

**Status**: Ready for deployment  
**Version**: 1.0  
**Last updated**: June 3, 2026
