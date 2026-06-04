-- ================================================================
-- VECTOR EXTENSION FOR AI SEARCH
-- ================================================================

-- Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- Table to store embeddings for RAG (Knowledge Base, FAQ, etc.)
CREATE TABLE knowledge_base (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  content TEXT NOT NULL,
  metadata JSONB,
  embedding vector(1536), -- 1536 is standard for OpenAI/Claude embeddings
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Add embedding column to leads for semantic lead matching
ALTER TABLE leads ADD COLUMN lead_summary_embedding vector(1536);

-- Add embedding column to posts for semantic content search
ALTER TABLE posts ADD COLUMN content_embedding vector(1536);

-- HNSW index for fast vector search
CREATE INDEX idx_knowledge_embedding ON knowledge_base USING hnsw (embedding vector_cosine_ops);
CREATE INDEX idx_leads_embedding ON leads USING hnsw (lead_summary_embedding vector_cosine_ops);
CREATE INDEX idx_posts_embedding ON posts USING hnsw (content_embedding vector_cosine_ops);

-- Log update
INSERT INTO schema_version (version, description) VALUES
  ('1.2.0', 'Vector search support via pgvector');
