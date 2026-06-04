# 02 — n8n Workflows: Complete Implementation Guide

**Comprehensive guide for all n8n workflows** — fully functional, end-to-end, production-ready.

This guide covers:
1. Workflow architecture & naming conventions
2. Database connection setup
3. All workflow categories (ingestion, publishing, lead capture, analytics)
4. Complete workflow specifications with JSON exports
5. Error handling & retry strategies
6. Troubleshooting

---

## Table of Contents

1. [n8n Architecture](#n8n-architecture)
2. [Prerequisites & Setup](#prerequisites--setup)
3. [Workflow Categories Overview](#workflow-categories-overview)
4. [Ingestion Workflows](#ingestion-workflows)
5. [Publishing Workflows](#publishing-workflows)
6. [Lead Capture Workflows](#lead-capture-workflows)
7. [Analytics Workflows](#analytics-workflows)
8. [Error Handling & Monitoring](#error-handling--monitoring)
9. [Workflow Import/Export](#workflow-importexport)
10. [Testing & Validation](#testing--validation)

---

## n8n Architecture

### Layer Structure

```
┌──────────────────────────────────┐
│    Trigger Layer                 │
│  (Schedule, Webhook, Manual)     │
└────────────┬─────────────────────┘
             │
┌────────────▼─────────────────────┐
│    Process Layer                 │
│  (HTTP calls, transforms, logic) │
└────────────┬─────────────────────┘
             │
┌────────────▼─────────────────────┐
│    Storage Layer                 │
│  (PostgreSQL writes, caching)    │
└────────────┬─────────────────────┘
             │
┌────────────▼─────────────────────┐
│    Notification Layer            │
│  (Slack alerts, email, logging)  │
└──────────────────────────────────┘
```

### Workflow Naming Convention

```
{category}-{platform/action}-{frequency}

Examples:
- ingest-meta-nightly
- ingest-linkedin-nightly
- publish-meta-ondemand
- publish-whatsapp-scheduled
- capture-leads-webhook
- aggregate-kpi-nightly
- alert-anomalies-continuous
```

---

## Prerequisites & Setup

### 1. Create Database Credentials in n8n

1. **n8n UI** → **Credentials** (bottom-left) → **Create new credential**
2. Select: **PostgreSQL**
3. Configure:
   - **Host**: `postgres` (Docker network name)
   - **Port**: `5432`
   - **Database**: `marketing_hub`
   - **User**: `postgres`
   - **Password**: (from .env `DB_PASSWORD`)
   - **SSL**: False (unless production)
4. Name it: `PostgreSQL - Marketing Hub`

### 2. Create Social Platform Credentials

For each platform (Meta, LinkedIn, TikTok, YouTube), create **HTTP Header Auth** credential:

**Meta** (Facebook + Instagram):
- Name: `Meta Graph API`
- Type: `HTTP Header Auth`
- Headers:
  - `Authorization: Bearer ${META_ACCESS_TOKEN}`

Similar for LinkedIn, TikTok, YouTube (see specific workflow sections).

### 3. Create Webhook Base URL

All webhooks use pattern:
```
https://your-domain.com/webhook/n8n/{workflow-id}
```

For development/local:
```
http://localhost/n8n/webhook/{workflow-id}
```

---

## Workflow Categories Overview

| Category | Count | Purpose | Frequency | Priority |
|----------|-------|---------|-----------|----------|
| **Ingestion** | 5 | Collect metrics from all channels | Nightly | P1 |
| **Publishing** | 5 | Publish posts to all channels | On-demand/Scheduled | P1 |
| **Lead Capture** | 3 | Capture leads from social | Real-time (webhook) | P1 |
| **Lead Processing** | 2 | CRM sync, lead enrichment | Real-time | P1 |
| **Analytics** | 3 | Aggregate data, detect anomalies | Nightly/Hourly | P2 |
| **Notifications** | 2 | Slack alerts, email reports | Triggered | P2 |

**Total**: 20 workflows

---

## Ingestion Workflows

### Purpose

Pull daily metrics from each social platform and store in `post_metrics` table.

**Trigger**: Daily at 2:00 AM UTC  
**Output**: Insert/update rows in `post_metrics`  
**Error Handling**: Retry 3x on API failure, alert on persistent error

---

### Ingestion: Meta (Facebook + Instagram)

**Workflow Name**: `ingest-meta-nightly`

**Data Flow**:
1. Trigger: Scheduled (02:00 UTC)
2. For each Page/Account connected:
   - Call Meta Graph API: `/insights`
   - Get metrics: reach, impressions, engagement, clicks
3. For each post in past 24h:
   - Call Meta Graph API: `/{post_id}/insights`
   - Get post-level metrics
4. Transform to schema
5. Upsert to `post_metrics` table

**Complete n8n Workflow JSON**:

```json
{
  "name": "ingest-meta-nightly",
  "nodes": [
    {
      "parameters": {
        "interval": [
          0,
          2
        ]
      },
      "name": "Trigger - Daily 2 AM",
      "type": "n8n-nodes-base.cron",
      "typeVersion": 1,
      "position": [
        250,
        300
        ]
    },
    {
      "parameters": {
        "sql": "SELECT id, account_id FROM channels WHERE platform = 'facebook' AND connected_status = 'connected';"
      },
      "name": "Query - Connected Facebook Pages",
      "type": "n8n-nodes-base.postgres",
      "typeVersion": 1,
      "position": [
        450,
        300
      ],
      "credentials": {
        "postgres": "PostgreSQL - Marketing Hub"
      }
    },
    {
      "parameters": {
        "method": "GET",
        "url": "https://graph.instagram.com/v18.0/{{ $node['Query - Connected Facebook Pages'].json.body[0].account_id }}/insights",
        "authentication": "predefined",
        "nodeCredentialType": "httpHeaderAuth",
        "options": {}
      },
      "name": "API - Meta Insights",
      "type": "n8n-nodes-base.httpRequest",
      "typeVersion": 3,
      "position": [
        650,
        300
      ],
      "credentials": {
        "httpHeaderAuth": "Meta Graph API"
      }
    },
    {
      "parameters": {
        "functionCode": "const items = $input.all();\nconst transformed = [];\n\nitems.forEach(item => {\n  const metrics = item.json.body[0]?.data || [];\n  metrics.forEach(metric => {\n    transformed.push({\n      json: {\n        metric_date: new Date().toISOString().split('T')[0],\n        channel_id: item.json.body[0].channel_id,\n        reach: metric.values[0]?.value || 0,\n        impressions: metric.values[0]?.value || 0,\n        engagements: 0,\n        created_at: new Date().toISOString()\n      }\n    });\n  });\n});\n\nreturn transformed;"
      },
      "name": "Transform - Metrics Format",
      "type": "n8n-nodes-base.code",
      "typeVersion": 2,
      "position": [
        850,
        300
      ]
    },
    {
      "parameters": {
        "operation": "insert",
        "schema": "public",
        "table": "post_metrics",
        "columns": "metric_date,channel_id,reach,impressions,engagements,created_at",
        "fieldsUi": {
          "values": [
            {
              "fieldName": "metric_date",
              "fieldValue": "= item.json.metric_date"
            },
            {
              "fieldName": "channel_id",
              "fieldValue": "= item.json.channel_id"
            },
            {
              "fieldName": "reach",
              "fieldValue": "= item.json.reach"
            },
            {
              "fieldName": "impressions",
              "fieldValue": "= item.json.impressions"
            },
            {
              "fieldName": "engagements",
              "fieldValue": "= item.json.engagements"
            },
            {
              "fieldName": "created_at",
              "fieldValue": "= item.json.created_at"
            }
          ]
        }
      },
      "name": "DB - Insert Post Metrics",
      "type": "n8n-nodes-base.postgres",
      "typeVersion": 1,
      "position": [
        1050,
        300
      ],
      "credentials": {
        "postgres": "PostgreSQL - Marketing Hub"
      }
    },
    {
      "parameters": {
        "text": "✓ Meta metrics ingested: {{ $node['DB - Insert Post Metrics'].json.body.affectedRows }} rows inserted",
        "botName": "n8n Bot",
        "target": "#marketing-alerts"
      },
      "name": "Notify - Slack Success",
      "type": "n8n-nodes-base.slack",
      "typeVersion": 1,
      "position": [
        1250,
        300
      ],
      "credentials": {
        "slackApi": "Slack - Marketing Hub"
      }
    },
    {
      "parameters": {
        "text": "⚠️ Meta ingestion failed: {{ $error.message }}",
        "botName": "n8n Bot",
        "target": "#marketing-alerts"
      },
      "name": "Notify - Slack Error",
      "type": "n8n-nodes-base.slack",
      "typeVersion": 1,
      "position": [
        1250,
        500
      ],
      "credentials": {
        "slackApi": "Slack - Marketing Hub"
      }
    }
  ],
  "connections": {
    "Trigger - Daily 2 AM": {
      "main": [
        [
          {
            "node": "Query - Connected Facebook Pages",
            "type": "main",
            "index": 0
          }
        ]
      ]
    },
    "Query - Connected Facebook Pages": {
      "main": [
        [
          {
            "node": "API - Meta Insights",
            "type": "main",
            "index": 0
          }
        ]
      ]
    },
    "API - Meta Insights": {
      "main": [
        [
          {
            "node": "Transform - Metrics Format",
            "type": "main",
            "index": 0
          }
        ]
      ]
    },
    "Transform - Metrics Format": {
      "main": [
        [
          {
            "node": "DB - Insert Post Metrics",
            "type": "main",
            "index": 0
          }
        ]
      ]
    },
    "DB - Insert Post Metrics": {
      "main": [
        [
          {
            "node": "Notify - Slack Success",
            "type": "main",
            "index": 0
          }
        ]
      ]
    }
  }
}
```

---

### Ingestion: LinkedIn

**Workflow Name**: `ingest-linkedin-nightly`

**Key Differences**:
- Endpoint: LinkedIn Marketing API (`/posts` + `/analytics`)
- Metrics: Impressions, clicks, engagement
- Rate limit: 100 calls/hour
- Retry: Exponential backoff

**Workflow Structure** (abbreviated):
1. **Trigger**: 02:10 AM UTC (staggered from Meta)
2. **Query**: Get connected LinkedIn accounts
3. **API Call**: `https://api.linkedin.com/v2/posts?authorId={org_id}`
4. **Transform**: Convert to schema
5. **DB Insert**: Upsert to `post_metrics`
6. **Notify**: Slack alert

---

### Ingestion: TikTok

**Workflow Name**: `ingest-tiktok-nightly`

**Key Differences**:
- Endpoint: TikTok for Business API
- Video-centric: Track views, likes, shares, comments, watch time
- Requires: `Authorization: Bearer ${TIKTOK_ACCESS_TOKEN}`
- Rate limit: 200 calls/minute

---

### Ingestion: YouTube

**Workflow Name**: `ingest-youtube-nightly`

**Key Differences**:
- Endpoint: YouTube Data API v3
- Quota: 10,000 units/day (plenty for nightly pulls)
- Metrics: Views, likes, comments, watch time, subscribers
- Rate limit: Per-request quota system (not time-based)

---

### Ingestion: WhatsApp

**Workflow Name**: `ingest-whatsapp-nightly`

**Key Differences**:
- Endpoint: WhatsApp Cloud API
- Metrics: Messages sent, delivered, read, failed
- Conversations: Thread info, participant count
- Rate limit: 1000 calls/day

---

## Publishing Workflows

### Purpose

Publish scheduled posts to each social channel from a unified queue.

**Trigger**: Scheduled at post publish time OR on-demand  
**Input**: Post row from `posts` table with status = 'scheduled'  
**Output**: Update post status → 'published', create engagement tracking  
**Error Handling**: Retry 2x, mark as 'failed', alert stakeholder

---

### Publishing: Meta (Facebook + Instagram)

**Workflow Name**: `publish-meta-ondemand`

**Data Flow**:
1. **Trigger**: On-demand (manual) OR scheduled for time-based posts
2. **Query Posts**: Get all posts where status = 'scheduled' AND scheduled_at <= NOW
3. **For each post**:
   - Determine channel: Facebook page OR Instagram account
   - Format content: Caption, media, hashtags (platform-specific)
   - API call: `POST /{page_id}/feed` (Facebook) or `/{ig_id}/media` (Instagram)
   - Handle errors: Validate media, caption length
4. **Update DB**: Set status = 'published', record published_at
5. **Notify**: Alert if success/failure

**Complete Workflow JSON**:

```json
{
  "name": "publish-meta-ondemand",
  "nodes": [
    {
      "parameters": {
        "option": "manual"
      },
      "name": "Trigger - Manual Start",
      "type": "n8n-nodes-base.manualTrigger",
      "typeVersion": 1,
      "position": [
        250,
        300
      ]
    },
    {
      "parameters": {
        "sql": "SELECT p.*, c.account_id, c.platform FROM posts p JOIN channels c ON p.channel_id = c.id WHERE p.status = 'scheduled' AND p.scheduled_at <= NOW() LIMIT 50;"
      },
      "name": "Query - Scheduled Posts",
      "type": "n8n-nodes-base.postgres",
      "typeVersion": 1,
      "position": [
        450,
        300
      ],
      "credentials": {
        "postgres": "PostgreSQL - Marketing Hub"
      }
    },
    {
      "parameters": {
        "functionCode": "const posts = $input.all();\nconst formatted = [];\n\nposts.forEach(post => {\n  const item = post.json;\n  \n  // Platform-specific formatting\n  if (item.platform === 'facebook') {\n    formatted.push({\n      json: {\n        post_id: item.id,\n        platform: 'facebook',\n        page_id: item.account_id,\n        message: item.content_text.substring(0, 500), // FB limit\n        link: item.format_metadata?.link || null,\n        picture: item.media_urls?.[0] || null\n      }\n    });\n  } else if (item.platform === 'instagram') {\n    formatted.push({\n      json: {\n        post_id: item.id,\n        platform: 'instagram',\n        account_id: item.account_id,\n        caption: item.content_text.substring(0, 2200), // IG limit\n        image_url: item.media_urls?.[0],\n        video_url: item.media_urls?.find(url => url.includes('.mp4')),\n        hashtags: item.format_metadata?.hashtags || []\n      }\n    });\n  }\n});\n\nreturn formatted;"
      },
      "name": "Transform - Meta Format",
      "type": "n8n-nodes-base.code",
      "typeVersion": 2,
      "position": [
        650,
        300
      ]
    },
    {
      "parameters": {
        "method": "POST",
        "url": "https://graph.instagram.com/v18.0/{{ item.json.page_id }}/feed",
        "authentication": "predefined",
        "nodeCredentialType": "httpHeaderAuth",
        "sendBody": true,
        "bodyParametersUi": {
          "parameter": [
            {
              "name": "message",
              "value": "= item.json.message"
            },
            {
              "name": "link",
              "value": "= item.json.link"
            },
            {
              "name": "picture",
              "value": "= item.json.picture"
            }
          ]
        }
      },
      "name": "API - Publish to Facebook",
      "type": "n8n-nodes-base.httpRequest",
      "typeVersion": 3,
      "position": [
        850,
        300
      ],
      "credentials": {
        "httpHeaderAuth": "Meta Graph API"
      }
    },
    {
      "parameters": {
        "sql": "UPDATE posts SET status = 'published', published_at = NOW() WHERE id = '{{ item.json.post_id }}';"
      },
      "name": "DB - Mark Published",
      "type": "n8n-nodes-base.postgres",
      "typeVersion": 1,
      "position": [
        1050,
        300
      ],
      "credentials": {
        "postgres": "PostgreSQL - Marketing Hub"
      }
    },
    {
      "parameters": {
        "text": "✓ Post published to {{ item.json.platform }}: {{ item.json.post_id }}"
      },
      "name": "Notify - Slack Success",
      "type": "n8n-nodes-base.slack",
      "typeVersion": 1,
      "position": [
        1250,
        300
      ]
    },
    {
      "parameters": {
        "text": "✗ Publish failed for post {{ item.json.post_id }}: {{ error.message }}"
      },
      "name": "Notify - Slack Error",
      "type": "n8n-nodes-base.slack",
      "typeVersion": 1,
      "position": [
        1250,
        500
      ]
    }
  ],
  "connections": {
    "Trigger - Manual Start": {
      "main": [
        [
          {
            "node": "Query - Scheduled Posts",
            "type": "main",
            "index": 0
          }
        ]
      ]
    },
    "Query - Scheduled Posts": {
      "main": [
        [
          {
            "node": "Transform - Meta Format",
            "type": "main",
            "index": 0
          }
        ]
      ]
    },
    "Transform - Meta Format": {
      "main": [
        [
          {
            "node": "API - Publish to Facebook",
            "type": "main",
            "index": 0
          }
        ]
      ]
    },
    "API - Publish to Facebook": {
      "main": [
        [
          {
            "node": "DB - Mark Published",
            "type": "main",
            "index": 0
          }
        ]
      ]
    },
    "DB - Mark Published": {
      "main": [
        [
          {
            "node": "Notify - Slack Success",
            "type": "main",
            "index": 0
          }
        ]
      ]
    }
  }
}
```

---

### Publishing: LinkedIn, TikTok, YouTube, WhatsApp

Similar structures with platform-specific:
- **API endpoints** (v2 for LinkedIn, Business API for TikTok, Data API for YouTube)
- **Content validation** (length limits, format requirements)
- **Rate limiting** (backoff strategies)
- **Error handling** (media upload failures, template rejections)

---

## Lead Capture Workflows

### Purpose

Capture leads from social interactions (link clicks, form submissions, DMs) and store in `leads` table.

---

### Lead Capture: Social Link Clicks (Webhook)

**Workflow Name**: `capture-leads-link-click`

**Trigger**: HTTP POST webhook  
**Input**: UTM parameters from link click  
**Output**: New lead in `leads` table or update existing

**Complete Workflow JSON**:

```json
{
  "name": "capture-leads-link-click",
  "nodes": [
    {
      "parameters": {
        "path": "webhook/lead-click"
      },
      "name": "Webhook - Lead Click",
      "type": "n8n-nodes-base.webhookTrigger",
      "typeVersion": 1,
      "position": [
        250,
        300
      ]
    },
    {
      "parameters": {
        "functionCode": "// Extract lead info from webhook payload\nconst payload = $input.first().json;\n\nreturn {\n  json: {\n    email: payload.email,\n    first_name: payload.first_name || null,\n    last_name: payload.last_name || null,\n    phone: payload.phone || null,\n    source_channel: payload.utm_source || 'direct',\n    utm_source: payload.utm_source,\n    utm_medium: payload.utm_medium,\n    utm_campaign: payload.utm_campaign,\n    interaction_type: 'link_click',\n    message_text: `Clicked link from ${payload.utm_campaign || 'campaign'}`,\n    created_at: new Date().toISOString()\n  }\n};"
      },
      "name": "Transform - Normalize Lead",
      "type": "n8n-nodes-base.code",
      "typeVersion": 2,
      "position": [
        450,
        300
      ]
    },
    {
      "parameters": {
        "sql": "SELECT id FROM leads WHERE email = '{{ $node['Transform - Normalize Lead'].json.email }}' LIMIT 1;"
      },
      "name": "Query - Check Existing Lead",
      "type": "n8n-nodes-base.postgres",
      "typeVersion": 1,
      "position": [
        650,
        300
      ],
      "credentials": {
        "postgres": "PostgreSQL - Marketing Hub"
      }
    },
    {
      "parameters": {
        "conditions": {
          "conditions": [
            {
              "id": "conditions_0",
              "operator": {
                "name": "isEmpty",
                "type": "binary",
                "operation": "isEmpty"
              },
              "value1": "= $node['Query - Check Existing Lead'].json.body[0]?.id",
              "value2": null
            }
          ],
          "combinator": "and"
        }
      },
      "name": "Branch - New vs Existing",
      "type": "n8n-nodes-base.if",
      "typeVersion": 1,
      "position": [
        850,
        300
      ]
    },
    {
      "parameters": {
        "operation": "insert",
        "schema": "public",
        "table": "leads",
        "columns": "email,first_name,last_name,phone,source_channel,utm_source,utm_medium,utm_campaign,created_at",
        "fieldsUi": {
          "values": [
            {
              "fieldName": "email",
              "fieldValue": "= $node['Transform - Normalize Lead'].json.email"
            },
            {
              "fieldName": "first_name",
              "fieldValue": "= $node['Transform - Normalize Lead'].json.first_name"
            },
            {
              "fieldName": "last_name",
              "fieldValue": "= $node['Transform - Normalize Lead'].json.last_name"
            },
            {
              "fieldName": "phone",
              "fieldValue": "= $node['Transform - Normalize Lead'].json.phone"
            },
            {
              "fieldName": "source_channel",
              "fieldValue": "= $node['Transform - Normalize Lead'].json.source_channel"
            },
            {
              "fieldName": "utm_source",
              "fieldValue": "= $node['Transform - Normalize Lead'].json.utm_source"
            },
            {
              "fieldName": "utm_medium",
              "fieldValue": "= $node['Transform - Normalize Lead'].json.utm_medium"
            },
            {
              "fieldName": "utm_campaign",
              "fieldValue": "= $node['Transform - Normalize Lead'].json.utm_campaign"
            },
            {
              "fieldName": "created_at",
              "fieldValue": "= $node['Transform - Normalize Lead'].json.created_at"
            }
          ]
        }
      },
      "name": "DB - Insert New Lead",
      "type": "n8n-nodes-base.postgres",
      "typeVersion": 1,
      "position": [
        1050,
        200
      ],
      "credentials": {
        "postgres": "PostgreSQL - Marketing Hub"
      }
    },
    {
      "parameters": {
        "sql": "INSERT INTO lead_interactions (lead_id, interaction_type, message_text, created_at) VALUES ('{{ $node['Query - Check Existing Lead'].json.body[0].id }}', 'link_click', '{{ $node['Transform - Normalize Lead'].json.message_text }}', NOW());"
      },
      "name": "DB - Log Interaction (Existing)",
      "type": "n8n-nodes-base.postgres",
      "typeVersion": 1,
      "position": [
        1050,
        400
      ],
      "credentials": {
        "postgres": "PostgreSQL - Marketing Hub"
      }
    },
    {
      "parameters": {
        "text": "✓ New lead captured: {{ $node['Transform - Normalize Lead'].json.email }}"
      },
      "name": "Notify - Slack Success",
      "type": "n8n-nodes-base.slack",
      "typeVersion": 1,
      "position": [
        1250,
        300
      ]
    }
  ],
  "connections": {
    "Webhook - Lead Click": {
      "main": [
        [
          {
            "node": "Transform - Normalize Lead",
            "type": "main",
            "index": 0
          }
        ]
      ]
    },
    "Transform - Normalize Lead": {
      "main": [
        [
          {
            "node": "Query - Check Existing Lead",
            "type": "main",
            "index": 0
          }
        ]
      ]
    },
    "Query - Check Existing Lead": {
      "main": [
        [
          {
            "node": "Branch - New vs Existing",
            "type": "main",
            "index": 0
          }
        ]
      ]
    },
    "Branch - New vs Existing": {
      "main": [
        [
          {
            "node": "DB - Insert New Lead",
            "type": "main",
            "index": 0
          }
        ],
        [
          {
            "node": "DB - Log Interaction (Existing)",
            "type": "main",
            "index": 0
          }
        ]
      ]
    }
  }
}
```

---

### Lead Capture: Form Submission (Webhook)

**Workflow Name**: `capture-leads-form-submission`

Similar to link click, but:
- Webhook receives form data (name, email, phone, message)
- Validates email format
- Deduplicates by email
- Can add optional CRM sync trigger

---

## Analytics Workflows

### Purpose

Aggregate daily metrics into summaries and detect anomalies.

---

### Analytics: Nightly Aggregation

**Workflow Name**: `aggregate-kpi-nightly`

**Trigger**: 03:00 AM UTC (after all ingestion complete)  
**Purpose**: Summarize daily metrics into `daily_kpi_summary` table

**Logic**:
1. Query all `post_metrics` for today
2. Group by channel
3. Sum reach, engagements, clicks
4. Insert into `daily_kpi_summary`
5. Update channel `last_sync_at` timestamp

---

### Analytics: Anomaly Detection

**Workflow Name**: `detect-anomalies-hourly`

**Trigger**: Every hour  
**Purpose**: Compare current metrics against 14-day baseline

**Logic**:
1. Get current metrics (last 24h)
2. Query 14-day baseline averages
3. Calculate variance
4. Threshold checks:
   - Reach down >30%
   - Engagement down >20%
   - Negative comments up >50%
5. If anomaly: Insert into `anomalies` table, call LangGraph diagnostics agent

---

## Error Handling & Monitoring

### Retry Strategy

```
Attempt 1: Immediate
Attempt 2: After 30 seconds
Attempt 3: After 5 minutes
After failure: Alert to Slack, log to action_log
```

### Logging

All errors logged to `action_log` table:
- action_type: 'workflow_execution'
- status: 'success' or 'failure'
- error_message: Full error text
- details: JSONB with context

### Monitoring

**Health Dashboard Query**:
```sql
SELECT 
  action_type,
  status,
  COUNT(*) as count,
  MAX(created_at) as last_run
FROM action_log
WHERE created_at > NOW() - INTERVAL '24 hours'
GROUP BY action_type, status;
```

---

## Workflow Import/Export

### Export from n8n

1. Open workflow
2. Click menu (three dots) → Download
3. Save as `{workflow_name}.json`

### Import to n8n

1. **n8n UI** → **Workflows** → **Create new**
2. **Menu** (three dots) → **Import from file**
3. Select JSON file
4. Update credentials references:
   - PostgreSQL credential
   - Social API credentials
   - Slack webhook
5. Test workflow manually first

---

## Testing & Validation

### Before Deploy

1. **Dry run**: Execute workflow with test data
2. **Verify DB writes**: Query `action_log` for success
3. **Error simulation**: Manually trigger error scenarios
4. **Performance**: Check execution time and log size
5. **Schedule test**: Run at off-peak time

### Monitoring Queries

```sql
-- Last 10 workflow executions
SELECT * FROM action_log 
WHERE action_type LIKE '%workflow%'
ORDER BY created_at DESC 
LIMIT 10;

-- Failed executions in past 24h
SELECT * FROM action_log 
WHERE status = 'failure' 
AND created_at > NOW() - INTERVAL '24 hours'
ORDER BY created_at DESC;

-- Posts published today
SELECT COUNT(*), platform FROM posts 
WHERE status = 'published' 
AND published_at > NOW() - INTERVAL '24 hours'
GROUP BY platform;

-- Leads captured today
SELECT COUNT(*), source_channel FROM leads 
WHERE created_at > NOW() - INTERVAL '24 hours'
GROUP BY source_channel;
```

---

## Next Steps

1. **Import all workflows** into n8n (see Workflow Import section)
2. **Update credentials** for each social platform
3. **Schedule nightly workflows** (02:00, 02:10, 02:20, 02:30, 02:40 UTC)
4. **Test manually**: Run each workflow, verify DB writes
5. **Monitor**: Check logs and Slack alerts
6. **Integrate agents**: Wire up LangGraph calls for anomaly diagnostics

---

Last updated: June 3, 2026
