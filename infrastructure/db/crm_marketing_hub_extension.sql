-- Marketing Hub Schema Extensions
-- Tables required for Channel Analytics, Publishing, and Content Intelligence

-- 1. Campaigns: Track performance objectives across channels
CREATE TABLE IF NOT EXISTS campaigns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    objective VARCHAR(100),
    budget DECIMAL(12, 2),
    start_date TIMESTAMP WITH TIME ZONE,
    end_date TIMESTAMP WITH TIME ZONE,
    status VARCHAR(50) DEFAULT 'planned',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Posts: Content repository for publishing and performance tracking
CREATE TABLE IF NOT EXISTS posts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    campaign_id UUID REFERENCES campaigns(id),
    channel VARCHAR(50) NOT NULL, -- facebook, instagram, linkedin, tiktok, youtube
    content_id VARCHAR(255), -- ID from the platform API
    content_text TEXT,
    content_type VARCHAR(50), -- image, video, carousel, link
    scheduled_time TIMESTAMP WITH TIME ZONE,
    published_time TIMESTAMP WITH TIME ZONE,
    status VARCHAR(50) DEFAULT 'draft',
    topic_tags TEXT[],
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Post Metrics: Daily snapshots of platform engagement
CREATE TABLE IF NOT EXISTS post_metrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    post_id UUID REFERENCES posts(id) ON DELETE CASCADE,
    snapshot_date DATE NOT NULL,
    impressions INTEGER DEFAULT 0,
    reach INTEGER DEFAULT 0,
    engagements INTEGER DEFAULT 0,
    clicks INTEGER DEFAULT 0,
    video_views INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(post_id, snapshot_date)
);

-- 4. Content Briefs: AI-generated output for creative teams
CREATE TABLE IF NOT EXISTS content_briefs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    campaign_id UUID REFERENCES campaigns(id),
    topic TEXT NOT NULL,
    hook TEXT,
    format VARCHAR(50),
    target_channel VARCHAR(50),
    status VARCHAR(50) DEFAULT 'pending',
    estimated_performance_band VARCHAR(50),
    generated_content JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. WhatsApp Conversations: Threaded conversational data
CREATE TABLE IF NOT EXISTS whatsapp_conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    contact_id UUID REFERENCES contacts(id), -- Assuming contacts table exists
    thread_id VARCHAR(255) UNIQUE NOT NULL,
    last_interaction_time TIMESTAMP WITH TIME ZONE,
    classification VARCHAR(50), -- e.g., 'support', 'sales', 'nurture'
    sentiment_score DECIMAL(3, 2),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_posts_channel ON posts(channel);
CREATE INDEX IF NOT EXISTS idx_posts_status ON posts(status);
CREATE INDEX IF NOT EXISTS idx_post_metrics_date ON post_metrics(snapshot_date);
CREATE INDEX IF NOT EXISTS idx_campaigns_status ON campaigns(status);
