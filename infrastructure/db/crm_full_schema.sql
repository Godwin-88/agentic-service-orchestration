-- ================================================================
-- AGENTIC CRM FULL SCHEMA EXTENSION
-- Based on Agentic CRM Technical Specification v1.0
-- ================================================================

-- 1. Accounts (Company-level grouping)
CREATE TABLE IF NOT EXISTS accounts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_name VARCHAR(255) NOT NULL,
  domain VARCHAR(255) UNIQUE,
  industry VARCHAR(100),
  headcount INT,
  country VARCHAR(100),
  arr DECIMAL(15, 2) DEFAULT 0,
  churn_probability DECIMAL(5, 4) DEFAULT 0,
  rfm_segment VARCHAR(50),
  enrichment_raw JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. Contacts (Master record after qualification)
-- Note: We link to leads.id for attribution
CREATE TABLE IF NOT EXISTS contacts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  lead_id UUID REFERENCES leads(id) ON DELETE SET NULL,
  account_id UUID REFERENCES accounts(id) ON DELETE SET NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  phone VARCHAR(20),
  social_handles JSONB DEFAULT '{}', -- { "linkedin": "...", "twitter": "..." }
  lifecycle_stage VARCHAR(50) DEFAULT 'prospect' CHECK (lifecycle_stage IN ('prospect', 'qualified', 'engaged', 'opportunity', 'customer', 'advocate')),
  health_score DECIMAL(5, 2) DEFAULT 0,
  external_crm_id VARCHAR(255), -- HubSpot ID, etc.
  enrichment_raw JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. Lifecycle Events (Long-term agent memory & audit)
CREATE TABLE IF NOT EXISTS lifecycle_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  contact_id UUID NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
  event_type VARCHAR(100) NOT NULL, -- 'interaction', 'stage_change', 'agent_decision'
  channel VARCHAR(50),
  content JSONB,
  agent_action VARCHAR(255),
  agent_reasoning TEXT,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 4. Opportunities (Commercial pipeline)
CREATE TABLE IF NOT EXISTS opportunities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  contact_id UUID NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
  account_id UUID REFERENCES accounts(id) ON DELETE CASCADE,
  name VARCHAR(255),
  stage VARCHAR(50) DEFAULT 'identified' CHECK (stage IN ('identified', 'qualified', 'proposal_sent', 'negotiation', 'closed_won', 'closed_lost')),
  estimated_value DECIMAL(15, 2),
  probability DECIMAL(5, 4), -- 0.0 to 1.0
  expected_close DATE,
  owner_id VARCHAR(255), -- Sales rep identifier
  bant_score JSONB, -- { "budget": 0.8, "authority": 1.0, ... }
  qualification_rationale TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 5. Proposals (Agent-generated drafts)
CREATE TABLE IF NOT EXISTS proposals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  opportunity_id UUID NOT NULL REFERENCES opportunities(id) ON DELETE CASCADE,
  draft_content JSONB NOT NULL,
  status VARCHAR(50) DEFAULT 'pending_review' CHECK (status IN ('pending_review', 'approved', 'sent', 'declined')),
  pdf_url TEXT,
  reviewed_by VARCHAR(255),
  sent_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 6. Follow-up Actions (NBA Queue)
CREATE TABLE IF NOT EXISTS follow_up_actions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  contact_id UUID NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
  action_type VARCHAR(50) NOT NULL, -- 'whatsapp', 'email', 'social_dm', 'task'
  channel VARCHAR(50),
  message_draft TEXT,
  scheduled_at TIMESTAMP WITH TIME ZONE,
  executed_at TIMESTAMP WITH TIME ZONE,
  outcome VARCHAR(50),
  agent_reasoning TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 7. RFM Scores (Historical snapshots)
CREATE TABLE IF NOT EXISTS rfm_scores (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  contact_id UUID NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
  recency_score INT CHECK (recency_score BETWEEN 1 AND 5),
  frequency_score INT CHECK (frequency_score BETWEEN 1 AND 5),
  monetary_score INT CHECK (monetary_score BETWEEN 1 AND 5),
  rfm_segment VARCHAR(50),
  calculated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 8. Retention Signals (Churn prediction)
CREATE TABLE IF NOT EXISTS retention_signals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  contact_id UUID NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
  signal_type VARCHAR(100) NOT NULL,
  severity VARCHAR(20) CHECK (severity IN ('low', 'medium', 'high')),
  details JSONB,
  churn_probability DECIMAL(5, 4),
  intervention_status VARCHAR(50) DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 9. NPS & Surveys
CREATE TABLE IF NOT EXISTS nps_responses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  contact_id UUID NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
  score INT CHECK (score BETWEEN 0 AND 10),
  verbatim TEXT,
  sentiment VARCHAR(20),
  survey_type VARCHAR(50) DEFAULT 'nps',
  submitted_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 10. Indices for performance
CREATE INDEX IF NOT EXISTS idx_contacts_email ON contacts(email);
CREATE INDEX IF NOT EXISTS idx_contacts_lifecycle ON contacts(lifecycle_stage);
CREATE INDEX IF NOT EXISTS idx_opps_stage ON opportunities(stage);
CREATE INDEX IF NOT EXISTS idx_events_contact ON lifecycle_events(contact_id, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_rfm_contact ON rfm_scores(contact_id, calculated_at DESC);

-- Triggers for updated_at
CREATE TRIGGER update_accounts_timestamp BEFORE UPDATE ON accounts
  FOR EACH ROW EXECUTE FUNCTION update_timestamp();

CREATE TRIGGER update_contacts_timestamp BEFORE UPDATE ON contacts
  FOR EACH ROW EXECUTE FUNCTION update_timestamp();

CREATE TRIGGER update_opportunities_timestamp BEFORE UPDATE ON opportunities
  FOR EACH ROW EXECUTE FUNCTION update_timestamp();

CREATE TRIGGER update_proposals_timestamp BEFORE UPDATE ON proposals
  FOR EACH ROW EXECUTE FUNCTION update_timestamp();

-- Log schema update
INSERT INTO schema_version (version, description) VALUES
  ('1.2.0', 'Full Agentic CRM schema: contacts, accounts, opps, proposals, rfm, retention');
