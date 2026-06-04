# n8n Ingestion Workflows — Complete Import Package

This package contains 5 fully functional workflows to ingest metrics from all social platforms.

## Workflows Included

1. `ingest-meta-nightly.json` — Facebook & Instagram metrics (Nightly, 2:00 AM UTC)
2. `ingest-linkedin-nightly.json` — LinkedIn metrics (Nightly, 2:10 AM UTC)
3. `ingest-tiktok-nightly.json` — TikTok metrics (Nightly, 2:20 AM UTC)
4. `ingest-youtube-nightly.json` — YouTube metrics (Nightly, 2:30 AM UTC)
5. `ingest-whatsapp-nightly.json` — WhatsApp metrics (Nightly, 2:40 AM UTC)

## Quick Import Instructions

### In n8n UI:

1. **Create New Workflow** → Click menu → **Import from File**
2. Select workflow JSON file
3. Click **Update Credentials**:
   - Select `PostgreSQL - Marketing Hub` credential
   - Select appropriate social API credential
4. Click **Save**
5. Click **Activate** to enable scheduling

### Verify Import:

```bash
# Query ingested metrics
docker compose exec postgres psql -U postgres -d marketing_hub -c "
SELECT channel_id, COUNT(*) as metrics_count, MAX(metric_date) as latest_date 
FROM post_metrics 
GROUP BY channel_id;"
```

## Pre-Import Setup

### 1. Create PostgreSQL Credential in n8n

1. n8n → **Credentials** (bottom-left) → **Create new**
2. Type: **PostgreSQL**
3. Fill in:
   - **Host**: `postgres` (Docker service name)
   - **Port**: `5432`
   - **Database**: `marketing_hub`
   - **Username**: `postgres`
   - **Password**: (from .env `DB_PASSWORD`)
4. **Save** as: `PostgreSQL - Marketing Hub`

### 2. Create Social Platform Credentials

For each platform, create **HTTP Header Auth** credential:

**Meta API** (Facebook + Instagram):
```
Type: HTTP Header Auth
Name: Meta Graph API
Headers:
  Authorization: Bearer YOUR_META_ACCESS_TOKEN
```

**LinkedIn API**:
```
Type: HTTP Header Auth
Name: LinkedIn API
Headers:
  Authorization: Bearer YOUR_LINKEDIN_ACCESS_TOKEN
```

**TikTok API**:
```
Type: HTTP Header Auth
Name: TikTok API
Headers:
  Authorization: Bearer YOUR_TIKTOK_ACCESS_TOKEN
```

**YouTube API**:
```
Type: API Key
Name: YouTube API
API Key: YOUR_YOUTUBE_API_KEY
```

**WhatsApp API**:
```
Type: HTTP Header Auth
Name: WhatsApp API
Headers:
  Authorization: Bearer YOUR_WHATSAPP_ACCESS_TOKEN
```

## Workflow Specifications

### Ingestion - Meta (Facebook + Instagram)

**File**: `ingest-meta-nightly.json`

**Schedule**: Daily 2:00 AM UTC

**Flow**:
1. Get all connected Facebook Pages and Instagram Accounts from DB
2. For each account:
   - Call Meta Insights API: `/insights`
   - Call: `/posts` → get all posts from past 24h
   - For each post: Get post-level insights
3. Transform metrics to schema
4. Upsert to `post_metrics` table
5. Notify Slack on success/failure
6. Log to `action_log`

**Metrics Collected**:
- reach
- impressions
- engagement
- clicks
- likes
- comments
- shares
- saves
- video_views
- watch_time_seconds

---

### Ingestion - LinkedIn

**File**: `ingest-linkedin-nightly.json`

**Schedule**: Daily 2:10 AM UTC (staggered)

**Flow**:
1. Get connected LinkedIn Organization accounts
2. Call LinkedIn Marketing API: `/posts`
3. Get engagement metrics: `/analytics`
4. Transform and insert to `post_metrics`
5. Handle API limitations (requires org admin access)

---

### Ingestion - TikTok

**File**: `ingest-tiktok-nightly.json`

**Schedule**: Daily 2:20 AM UTC

**Flow**:
1. Get TikTok Business Account ID from DB
2. Call TikTok Content Posting API: `/video/list`
3. For each video: `/video/analytics`
4. Collect: views, likes, comments, shares, watch_time

---

### Ingestion - YouTube

**File**: `ingest-youtube-nightly.json`

**Schedule**: Daily 2:30 AM UTC

**Flow**:
1. Get YouTube Channel ID from DB
2. Call YouTube Data API: `channels.list` → get stats
3. Call: `videos.list` → get all videos (paginated)
4. For each video: `videos.list` with statistics
5. Collect: views, likes, comments, dislikes, watch_time

---

### Ingestion - WhatsApp

**File**: `ingest-whatsapp-nightly.json`

**Schedule**: Daily 2:40 AM UTC

**Flow**:
1. Get WhatsApp Business Phone ID
2. Call WhatsApp Cloud API: `/messages?limit=100`
3. Get conversation metrics: thread count, response rates
4. Collect: sent, delivered, read, failed

---

## Error Handling

### Retry Logic

All workflows implement 3-attempt retry:
- Attempt 1: Immediate
- Attempt 2: +30 seconds
- Attempt 3: +5 minutes

### Failure Alerts

On persistent failure:
- Log to `action_log` with full error
- Send Slack alert to #marketing-alerts
- Include: workflow name, error message, last attempted time

### API Rate Limit Handling

Workflows implement exponential backoff:
- 429 response → Wait 60 seconds → Retry
- 503 response → Wait 120 seconds → Retry

---

## Monitoring

### Check Ingestion Status

```sql
-- Latest metrics by channel
SELECT 
  c.platform,
  MAX(pm.metric_date) as latest_sync,
  COUNT(*) as metric_records
FROM post_metrics pm
JOIN channels c ON pm.channel_id = c.id
GROUP BY c.platform
ORDER BY c.platform;

-- Failed ingestions
SELECT * FROM action_log 
WHERE action_type LIKE '%ingest%' 
AND status = 'failure'
AND created_at > NOW() - INTERVAL '24 hours'
ORDER BY created_at DESC;
```

### Dashboard Query

```sql
-- Daily ingestion summary
SELECT 
  DATE(created_at) as date,
  action_type,
  COUNT(CASE WHEN status = 'success' THEN 1 END) as success_count,
  COUNT(CASE WHEN status = 'failure' THEN 1 END) as failure_count
FROM action_log
WHERE action_type LIKE '%ingest%'
GROUP BY DATE(created_at), action_type
ORDER BY date DESC, action_type;
```

---

## Troubleshooting

### Workflow won't start

```bash
# Check n8n logs
docker compose logs n8n | grep -i "error\|ingest"

# Restart n8n
docker compose restart n8n
```

### No metrics in database

```bash
# Verify channels exist and are connected
SELECT platform, account_id, connected_status FROM channels;

# Check if any post_metrics exist
SELECT COUNT(*) FROM post_metrics;

# Query action_log for errors
SELECT * FROM action_log WHERE action_type LIKE '%ingest%' ORDER BY created_at DESC LIMIT 5;
```

### API authentication errors

1. Verify credentials in n8n are correct
2. Check tokens haven't expired
3. For Meta: Verify Page access token scope includes `pages_read_engagement`
4. For LinkedIn: Verify org admin access

---

## Next Steps

1. **Import all 5 workflows** using n8n UI
2. **Test one workflow manually** (click play button)
3. **Verify data** in PostgreSQL using queries above
4. **Activate schedules** for nightly runs
5. **Monitor Slack channel** for alerts

Once ingestion is working, proceed to **Publishing Workflows** (Phase 2).

---

Last updated: June 3, 2026
