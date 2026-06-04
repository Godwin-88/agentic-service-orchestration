-- Marketing Hub Schema Updates
-- Tables needed to support Hub specification that weren't fully aligned

-- 1. Campaigns: Track performance objectives across channels
CREATE TABLE IF NOT EXISTS campaigns (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    objective VARCHAR(100),
    budget DECIMAL(12, 2),
    start_date TIMESTAMP WITH TIME ZONE,
    end_date TIMESTAMP WITH TIME ZONE,
    status VARCHAR(50) DEFAULT 'planned',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Content Briefs: Align with existing table, adding missing fields if needed
-- The existing table seems to exist but we need to ensure it supports the new Hub requirements
ALTER TABLE content_briefs ADD COLUMN IF NOT EXISTS campaign_id UUID REFERENCES campaigns(id);
ALTER TABLE content_briefs ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'pending';
ALTER TABLE content_briefs ADD COLUMN IF NOT EXISTS estimated_performance_band VARCHAR(50);
ALTER TABLE content_briefs ADD COLUMN IF NOT EXISTS generated_content JSONB;
ALTER TABLE content_briefs ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- 3. WhatsApp Conversations: Ensure it matches the spec fully
-- The existing table exists, let's ensure it has all required fields for Hub analytics
ALTER TABLE whatsapp_conversations ADD COLUMN IF NOT EXISTS classification VARCHAR(50);
ALTER TABLE whatsapp_conversations ADD COLUMN IF NOT EXISTS sentiment_score DECIMAL(3, 2);
ALTER TABLE whatsapp_conversations ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE;

-- Create indexes for performance on the existing and updated tables
CREATE INDEX IF NOT EXISTS idx_posts_channel ON posts(channel_id); -- Using channel_id as that's what's in the actual table
CREATE INDEX IF NOT EXISTS idx_campaigns_status ON campaigns(status);
