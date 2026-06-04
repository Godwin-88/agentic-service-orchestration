-- ================================================================
-- DIGITAL MARKETING HUB — POSTGRES SCHEMA
-- Normalized schema for posts, metrics, leads, conversations, campaigns
-- ================================================================

-- Enable extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";
CREATE EXTENSION IF NOT EXISTS "btree_gin";

-- ================================================================
-- FOUNDATION TABLES
-- ================================================================

-- Channels (Facebook, Instagram, LinkedIn, TikTok, YouTube, WhatsApp)
CREATE TABLE channels (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  platform VARCHAR(50) NOT NULL,
  account_name VARCHAR(255) NOT NULL,
  account_id VARCHAR(255) UNIQUE NOT NULL,
  connected_status VARCHAR(20) DEFAULT 'connected' CHECK (connected_status IN ('connected', 'disconnected', 'reconnect_needed')),
  access_token_encrypted TEXT,
  access_token_expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  last_sync_at TIMESTAMP WITH TIME ZONE,
  CONSTRAINT unique_platform_account UNIQUE (platform, account_id)
);

-- ================================================================
-- CONTENT & PUBLISHING
-- ================================================================

-- Posts (published or drafts)
CREATE TABLE posts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  channel_id UUID NOT NULL REFERENCES channels(id) ON DELETE CASCADE,
  external_post_id VARCHAR(255),
  content_text TEXT NOT NULL,
  media_urls TEXT[], 
  post_type VARCHAR(50) DEFAULT 'text' CHECK (post_type IN ('text', 'image', 'video', 'carousel', 'link', 'story', 'reel')),
  status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'scheduled', 'published', 'failed')),
  scheduled_at TIMESTAMP WITH TIME ZONE,
  published_at TIMESTAMP WITH TIME ZONE,
  scheduled_by VARCHAR(255), 
  format_metadata JSONB, 
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_status ON posts (status);
CREATE INDEX idx_published_at ON posts (published_at);
CREATE INDEX idx_channel_id ON posts (channel_id);

-- Daily post metrics (impressions, reach, engagement, clicks)
CREATE TABLE post_metrics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  metric_date DATE NOT NULL,
  impressions BIGINT DEFAULT 0,
  reach BIGINT DEFAULT 0,
  clicks BIGINT DEFAULT 0,
  engagements BIGINT DEFAULT 0,
  likes BIGINT DEFAULT 0,
  comments BIGINT DEFAULT 0,
  shares BIGINT DEFAULT 0,
  saves BIGINT DEFAULT 0,
  video_views BIGINT DEFAULT 0,
  watch_time_seconds BIGINT DEFAULT 0,
  profile_visits BIGINT DEFAULT 0,
  follower_count BIGINT DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT unique_post_date UNIQUE (post_id, metric_date)
);

CREATE INDEX idx_post_id ON post_metrics (post_id);
CREATE INDEX idx_metric_date ON post_metrics (metric_date);

-- ================================================================
-- LEADS & CONTACTS
-- ================================================================

-- Leads (captured from social, DMs, form fills)
CREATE TABLE leads (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR(255) NOT NULL UNIQUE,
  first_name VARCHAR(255),
  last_name VARCHAR(255),
  phone VARCHAR(20),
  source_channel VARCHAR(50), 
  source_channel_id UUID REFERENCES channels(id),
  lead_stage VARCHAR(50) DEFAULT 'new' CHECK (lead_stage IN ('new', 'engaged', 'product_interest', 'proposal_sent', 'customer', 'dormant')),
  lead_score DECIMAL(5, 2) DEFAULT 0.0, 
  score_updated_at TIMESTAMP WITH TIME ZONE,
  interaction_history TEXT[], 
  last_interaction_at TIMESTAMP WITH TIME ZONE,
  content_interests TEXT[], 
  utm_source VARCHAR(255),
  utm_medium VARCHAR(255),
  utm_campaign VARCHAR(255),
  crm_id VARCHAR(255), 
  crm_system VARCHAR(50), 
  assigned_to VARCHAR(255), 
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_email ON leads (email);
CREATE INDEX idx_lead_stage ON leads (lead_stage);
CREATE INDEX idx_lead_score ON leads (lead_score);
CREATE INDEX idx_source_channel ON leads (source_channel);
CREATE INDEX idx_crm_id ON leads (crm_id);

-- Lead interactions (DMs, comments, link clicks)
CREATE TABLE lead_interactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  interaction_type VARCHAR(50) NOT NULL CHECK (interaction_type IN ('dm', 'comment', 'link_click', 'form_fill', 'email_open', 'email_click', 'whatsapp_message', 'call')),
  post_id UUID REFERENCES posts(id),
  message_text TEXT,
  interaction_metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_lead_id ON lead_interactions (lead_id);
CREATE INDEX idx_interaction_type ON lead_interactions (interaction_type);
CREATE INDEX idx_created_at ON lead_interactions (created_at);

-- ================================================================
-- WHATSAPP & CONVERSATIONS
-- ================================================================

-- WhatsApp conversations (threads of messages with leads)
CREATE TABLE whatsapp_conversations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  thread_id VARCHAR(255) UNIQUE NOT NULL,
  status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'closed', 'awaiting_response', 'resolved')),
  intent VARCHAR(50), 
  sentiment VARCHAR(20), 
  message_count INT DEFAULT 0,
  last_message_at TIMESTAMP WITH TIME ZONE,
  last_message_direction VARCHAR(20) CHECK (last_message_direction IN ('inbound', 'outbound')),
  requires_human_handoff BOOLEAN DEFAULT FALSE,
  handoff_to VARCHAR(255), 
  resolved_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_lead_id_wa ON whatsapp_conversations (lead_id);
CREATE INDEX idx_thread_id ON whatsapp_conversations (thread_id);
CREATE INDEX idx_status_wa ON whatsapp_conversations (status);
CREATE INDEX idx_last_message_at_wa ON whatsapp_conversations (last_message_at);

-- WhatsApp messages (individual messages in a conversation)
CREATE TABLE whatsapp_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  conversation_id UUID NOT NULL REFERENCES whatsapp_conversations(id) ON DELETE CASCADE,
  direction VARCHAR(20) NOT NULL CHECK (direction IN ('inbound', 'outbound')),
  message_type VARCHAR(50) DEFAULT 'text' CHECK (message_type IN ('text', 'image', 'document', 'template', 'interactive')),
  content TEXT NOT NULL,
  external_message_id VARCHAR(255) UNIQUE,
  template_name VARCHAR(255), 
  media_url TEXT,
  read_at TIMESTAMP WITH TIME ZONE,
  delivered_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_conversation_id ON whatsapp_messages (conversation_id);
CREATE INDEX idx_direction ON whatsapp_messages (direction);
CREATE INDEX idx_created_at_wa ON whatsapp_messages (created_at);

-- WhatsApp opt-ins (compliance tracking)
CREATE TABLE whatsapp_optins (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  phone_number VARCHAR(20) NOT NULL,
  opt_in_date TIMESTAMP WITH TIME ZONE NOT NULL,
  opt_in_method VARCHAR(50) CHECK (opt_in_method IN ('double_opt_in_form', 'code_based', 'api', 'qr_code')),
  consent_recorded BOOLEAN DEFAULT TRUE,
  consent_timestamp TIMESTAMP WITH TIME ZONE,
  opt_out_date TIMESTAMP WITH TIME ZONE,
  opt_out_reason VARCHAR(255),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT unique_lead_phone UNIQUE (lead_id, phone_number)
);

CREATE INDEX idx_lead_id_optin ON whatsapp_optins (lead_id);
CREATE INDEX idx_phone_number_optin ON whatsapp_optins (phone_number);
CREATE INDEX idx_opt_in_date_optin ON whatsapp_optins (opt_in_date);

-- ================================================================
-- CAMPAIGNS & BROADCASTS
-- ================================================================

-- Campaigns (content marketing, broadcast, retargeting)
CREATE TABLE campaigns (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  objective VARCHAR(50) NOT NULL CHECK (objective IN ('awareness', 'engagement', 'lead_generation', 'nurture', 'conversion', 'retention')),
  status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'scheduled', 'live', 'paused', 'completed')),
  description TEXT,
  start_date DATE NOT NULL,
  end_date DATE,
  budget_usd DECIMAL(12, 2),
  target_audience_segment VARCHAR(255),
  channels_included VARCHAR(50)[], 
  created_by VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_status_campaign ON campaigns (status);
CREATE INDEX idx_start_date_campaign ON campaigns (start_date);

-- WhatsApp broadcast sequences (templates + scheduling)
CREATE TABLE whatsapp_broadcasts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  campaign_id UUID REFERENCES campaigns(id),
  name VARCHAR(255) NOT NULL,
  template_name VARCHAR(255) NOT NULL, 
  trigger_condition VARCHAR(255), 
  trigger_value JSONB, 
  sequence_order INT DEFAULT 0, 
  delay_hours INT DEFAULT 0, 
  status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'approved', 'live', 'paused')),
  sent_count INT DEFAULT 0,
  read_count INT DEFAULT 0,
  reply_count INT DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_campaign_id_wa ON whatsapp_broadcasts (campaign_id);
CREATE INDEX idx_trigger_condition_wa ON whatsapp_broadcasts (trigger_condition);

-- Track which leads received which broadcasts
CREATE TABLE broadcast_recipients (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  broadcast_id UUID NOT NULL REFERENCES whatsapp_broadcasts(id) ON DELETE CASCADE,
  lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  sent_at TIMESTAMP WITH TIME ZONE,
  delivered_at TIMESTAMP WITH TIME ZONE,
  read_at TIMESTAMP WITH TIME ZONE,
  replied BOOLEAN DEFAULT FALSE,
  reply_message_id UUID REFERENCES whatsapp_messages(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT unique_broadcast_lead UNIQUE (broadcast_id, lead_id)
);

CREATE INDEX idx_broadcast_id_rec ON broadcast_recipients (broadcast_id);
CREATE INDEX idx_lead_id_rec ON broadcast_recipients (lead_id);

-- ================================================================
-- AI CONTENT BRIEFS
-- ================================================================

-- Content briefs (AI-generated, for creative team)
CREATE TABLE content_briefs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  brief_date DATE NOT NULL,
  topic VARCHAR(255) NOT NULL,
  hook VARCHAR(500), 
  content_format VARCHAR(50) CHECK (content_format IN ('short_text', 'image', 'video', 'carousel', 'story', 'reel')),
  target_channels VARCHAR(50)[], 
  call_to_action VARCHAR(255),
  estimated_performance_band VARCHAR(20) CHECK (estimated_performance_band IN ('low', 'medium', 'high')),
  reasoning TEXT, 
  generated_by_agent VARCHAR(50) DEFAULT 'content_brief_gen',
  status VARCHAR(20) DEFAULT 'generated' CHECK (status IN ('generated', 'approved', 'declined', 'executed')),
  approved_by VARCHAR(255),
  approved_at TIMESTAMP WITH TIME ZONE,
  executed_post_id UUID REFERENCES posts(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_brief_date ON content_briefs (brief_date);
CREATE INDEX idx_status_briefs ON content_briefs (status);
CREATE INDEX idx_generated_by_agent ON content_briefs (generated_by_agent);

-- ================================================================
-- ANALYTICS & AGGREGATIONS
-- ================================================================

-- Daily KPI summary (pre-aggregated for dashboard performance)
CREATE TABLE daily_kpi_summary (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  metric_date DATE NOT NULL,
  channel_id UUID REFERENCES channels(id),
  total_reach BIGINT DEFAULT 0,
  total_impressions BIGINT DEFAULT 0,
  total_engagements BIGINT DEFAULT 0,
  total_clicks BIGINT DEFAULT 0,
  new_leads_captured INT DEFAULT 0,
  whatsapp_messages_sent INT DEFAULT 0,
  whatsapp_messages_received INT DEFAULT 0,
  follower_growth INT DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT unique_date_channel UNIQUE (metric_date, channel_id)
);

CREATE INDEX idx_metric_date_kpi ON daily_kpi_summary (metric_date);
CREATE INDEX idx_channel_id_kpi ON daily_kpi_summary (channel_id);

-- Content performance rankings (top/bottom posts by metric)
CREATE TABLE content_performance_ranking (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  ranking_date DATE NOT NULL,
  channel_id UUID REFERENCES channels(id),
  post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  metric_type VARCHAR(50) CHECK (metric_type IN ('reach', 'engagement', 'clicks', 'saves')),
  ranking INT,
  metric_value BIGINT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_ranking_date_perf ON content_performance_ranking (ranking_date);
CREATE INDEX idx_channel_id_perf ON content_performance_ranking (channel_id);
CREATE INDEX idx_metric_type_perf ON content_performance_ranking (metric_type);

-- Anomalies detected (for alerting)
CREATE TABLE anomalies (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  channel_id UUID REFERENCES channels(id),
  anomaly_type VARCHAR(50) NOT NULL CHECK (anomaly_type IN ('reach_drop', 'engagement_collapse', 'negative_spike', 'follower_spike', 'unusual_activity')),
  severity VARCHAR(20) CHECK (severity IN ('low', 'medium', 'high')),
  metric_name VARCHAR(100),
  expected_value DECIMAL(15, 2),
  actual_value DECIMAL(15, 2),
  anomaly_description TEXT,
  ai_diagnostic TEXT, 
  alert_sent_at TIMESTAMP WITH TIME ZONE,
  resolved BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_channel_id_anom ON anomalies (channel_id);
CREATE INDEX idx_anomaly_type_anom ON anomalies (anomaly_type);
CREATE INDEX idx_resolved_anom ON anomalies (resolved);

-- ================================================================
-- AUDIT & COMPLIANCE
-- ================================================================

-- Action log (for audit trail and debugging)
CREATE TABLE action_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  action_type VARCHAR(100) NOT NULL,
  resource_type VARCHAR(50),
  resource_id UUID,
  actor VARCHAR(255), 
  actor_type VARCHAR(20) CHECK (actor_type IN ('user', 'system', 'agent')),
  details JSONB,
  status VARCHAR(20) CHECK (status IN ('success', 'failure')),
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_action_type_log ON action_log (action_type);
CREATE INDEX idx_resource_type_log ON action_log (resource_type);
CREATE INDEX idx_actor_log ON action_log (actor);
CREATE INDEX idx_created_at_log ON action_log (created_at);

-- GDPR consent records
CREATE TABLE gdpr_consents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  consent_type VARCHAR(100) NOT NULL CHECK (consent_type IN ('marketing_email', 'marketing_sms', 'whatsapp_marketing', 'data_processing', 'cookies', 'analytics')),
  consent_given BOOLEAN NOT NULL,
  consent_date TIMESTAMP WITH TIME ZONE NOT NULL,
  consent_method VARCHAR(100) CHECK (consent_method IN ('web_form', 'api', 'email', 'whatsapp', 'import')),
  ip_address INET,
  user_agent TEXT,
  revocation_date TIMESTAMP WITH TIME ZONE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_lead_id_gdpr ON gdpr_consents (lead_id);
CREATE INDEX idx_consent_type_gdpr ON gdpr_consents (consent_type);
CREATE INDEX idx_consent_date_gdpr ON gdpr_consents (consent_date);

-- ================================================================
-- INDEXES FOR COMMON QUERIES
-- ================================================================

-- Full-text search on post content
CREATE INDEX idx_posts_content_trgm ON posts USING gin (content_text gin_trgm_ops);

-- Lead search by name or email
CREATE INDEX idx_leads_name_trgm ON leads USING gin (first_name gin_trgm_ops, last_name gin_trgm_ops);

-- WhatsApp message search
CREATE INDEX idx_messages_content_trgm ON whatsapp_messages USING gin (content gin_trgm_ops);

-- Performance: metrics queries by date range
CREATE INDEX idx_post_metrics_range ON post_metrics (post_id, metric_date DESC);
CREATE INDEX idx_daily_kpi_range ON daily_kpi_summary (metric_date DESC, channel_id);

-- ================================================================
-- VIEWS FOR COMMON QUERIES
-- ================================================================

-- Total leads captured by channel
CREATE OR REPLACE VIEW leads_by_channel AS
  SELECT
    source_channel,
    COUNT(*) as total_leads,
    COUNT(CASE WHEN lead_stage != 'dormant' THEN 1 END) as active_leads,
    AVG(lead_score) as avg_score
  FROM leads
  GROUP BY source_channel;

-- Content performance summary (top 10 posts by engagement)
CREATE OR REPLACE VIEW top_performing_content AS
  SELECT
    p.id,
    p.channel_id,
    p.content_text,
    p.post_type,
    p.published_at,
    SUM(pm.reach) as total_reach,
    SUM(pm.engagements) as total_engagements,
    SUM(pm.clicks) as total_clicks,
    ROUND(CAST(SUM(pm.engagements) AS DECIMAL) / NULLIF(SUM(pm.reach), 0) * 100, 2) as engagement_rate
  FROM posts p
  LEFT JOIN post_metrics pm ON p.id = pm.post_id
  WHERE p.status = 'published'
    AND p.published_at > CURRENT_TIMESTAMP - INTERVAL '30 days'
  GROUP BY p.id
  ORDER BY total_engagements DESC
  LIMIT 10;

-- WhatsApp funnel (opt-ins, messages sent, replies)
CREATE OR REPLACE VIEW whatsapp_funnel AS
  SELECT
    COALESCE(DATE(wo.opt_in_date), CURRENT_DATE) as date,
    COUNT(DISTINCT wo.lead_id) as opted_in_leads,
    COUNT(DISTINCT CASE WHEN wm.direction = 'outbound' THEN wm.conversation_id END) as conversations_with_messages,
    COUNT(DISTINCT CASE WHEN wm.direction = 'inbound' THEN wm.conversation_id END) as conversations_with_replies
  FROM whatsapp_optins wo
  LEFT JOIN whatsapp_conversations wc ON wo.lead_id = wc.lead_id
  LEFT JOIN whatsapp_messages wm ON wc.id = wm.conversation_id
  GROUP BY DATE(wo.opt_in_date);

-- Lead stage distribution
CREATE OR REPLACE VIEW lead_stage_distribution AS
  SELECT
    lead_stage,
    COUNT(*) as count,
    ROUND(CAST(COUNT(*) AS DECIMAL) / (SELECT COUNT(*) FROM leads) * 100, 2) as percentage
  FROM leads
  GROUP BY lead_stage
  ORDER BY count DESC;

-- ================================================================
-- TIMESTAMPS & TRIGGERS
-- ================================================================

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to all tables with updated_at
DROP TRIGGER IF EXISTS update_channels_timestamp ON channels;
CREATE TRIGGER update_channels_timestamp BEFORE UPDATE ON channels
  FOR EACH ROW EXECUTE FUNCTION update_timestamp();

DROP TRIGGER IF EXISTS update_posts_timestamp ON posts;
CREATE TRIGGER update_posts_timestamp BEFORE UPDATE ON posts
  FOR EACH ROW EXECUTE FUNCTION update_timestamp();

DROP TRIGGER IF EXISTS update_leads_timestamp ON leads;
CREATE TRIGGER update_leads_timestamp BEFORE UPDATE ON leads
  FOR EACH ROW EXECUTE FUNCTION update_timestamp();

DROP TRIGGER IF EXISTS update_campaigns_timestamp ON campaigns;
CREATE TRIGGER update_campaigns_timestamp BEFORE UPDATE ON campaigns
  FOR EACH ROW EXECUTE FUNCTION update_timestamp();

DROP TRIGGER IF EXISTS update_whatsapp_conversations_timestamp ON whatsapp_conversations;
CREATE TRIGGER update_whatsapp_conversations_timestamp BEFORE UPDATE ON whatsapp_conversations
  FOR EACH ROW EXECUTE FUNCTION update_timestamp();

DROP TRIGGER IF EXISTS update_whatsapp_optins_timestamp ON whatsapp_optins;
CREATE TRIGGER update_whatsapp_optins_timestamp BEFORE UPDATE ON whatsapp_optins
  FOR EACH ROW EXECUTE FUNCTION update_timestamp();

DROP TRIGGER IF EXISTS update_whatsapp_broadcasts_timestamp ON whatsapp_broadcasts;
CREATE TRIGGER update_whatsapp_broadcasts_timestamp BEFORE UPDATE ON whatsapp_broadcasts
  FOR EACH ROW EXECUTE FUNCTION update_timestamp();

DROP TRIGGER IF EXISTS update_content_briefs_timestamp ON content_briefs;
CREATE TRIGGER update_content_briefs_timestamp BEFORE UPDATE ON content_briefs
  FOR EACH ROW EXECUTE FUNCTION update_timestamp();

-- ================================================================
-- SCHEMA METADATA
-- ================================================================

-- Track schema version for migrations
CREATE TABLE IF NOT EXISTS schema_version (
  id SERIAL PRIMARY KEY,
  version VARCHAR(20) NOT NULL UNIQUE,
  description TEXT,
  applied_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO schema_version (version, description) 
VALUES ('1.0.0', 'Initial schema: channels, posts, leads, conversations, campaigns, briefs, analytics')
ON CONFLICT (version) DO NOTHING;
