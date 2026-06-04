-- ================================================================
-- INITIAL DATA (Reference data and defaults)
-- ================================================================

-- Insert supported channels (for reference, will be populated via OAuth)
-- These are seed records; real data comes from OAuth setup
INSERT INTO channels (platform, account_name, account_id, connected_status)
VALUES
  ('facebook', 'Your Facebook Page', 'pending', 'disconnected'),
  ('instagram', 'Your Instagram Account', 'pending', 'disconnected'),
  ('linkedin', 'Your LinkedIn Page', 'pending', 'disconnected'),
  ('tiktok', 'Your TikTok Account', 'pending', 'disconnected'),
  ('youtube', 'Your YouTube Channel', 'pending', 'disconnected'),
  ('whatsapp', 'Your WhatsApp Business Account', 'pending', 'disconnected')
ON CONFLICT (account_id) DO NOTHING;

-- Insert default lead stages and their descriptions
INSERT INTO action_log (action_type, resource_type, actor, actor_type, status)
VALUES ('schema_initialized', 'database', 'system', 'system', 'success')
ON CONFLICT DO NOTHING;
