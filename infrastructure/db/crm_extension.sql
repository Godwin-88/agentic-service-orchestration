-- ================================================================
-- AGENTIC CRM EXTENSIONS
-- Tables for internal CRM management: tasks, notes, pipelines
-- ================================================================

-- Tasks for sales/marketing follow-up
CREATE TABLE tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  task_type VARCHAR(50) CHECK (task_type IN ('call', 'email', 'whatsapp', 'meeting', 'manual_review', 'content_creation')),
  priority VARCHAR(20) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  status VARCHAR(20) DEFAULT 'todo' CHECK (status IN ('todo', 'in_progress', 'completed', 'cancelled')),
  assigned_to VARCHAR(255), -- User email
  due_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_by VARCHAR(255) DEFAULT 'system', -- 'system', 'agent', or user email
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_task_lead_id (lead_id),
  INDEX idx_task_status (status),
  INDEX idx_task_assigned_to (assigned_to),
  INDEX idx_task_due_at (due_at)
);

-- Internal notes on leads
CREATE TABLE lead_notes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  author VARCHAR(255), -- User email or agent name
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_note_lead_id (lead_id)
);

-- Trigger to update updated_at for new CRM tables
CREATE TRIGGER update_tasks_timestamp BEFORE UPDATE ON tasks
  FOR EACH ROW EXECUTE FUNCTION update_timestamp();

CREATE TRIGGER update_lead_notes_timestamp BEFORE UPDATE ON lead_notes
  FOR EACH ROW EXECUTE FUNCTION update_timestamp();

-- Log initial schema update
INSERT INTO schema_version (version, description) VALUES
  ('1.1.0', 'Internal CRM extensions: tasks, lead_notes');
