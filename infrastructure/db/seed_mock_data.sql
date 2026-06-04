-- Clear old demo data first
TRUNCATE TABLE opportunities, proposals, contacts CASCADE;

-- 1. Insert Products
INSERT INTO products (id, name, price, type) VALUES 
(gen_random_uuid(), 'CRM Audit Service', 2500.00, 'service'),
(gen_random_uuid(), 'Agent Setup Workshop', 1500.00, 'service');

-- 2. Insert Contacts with mapping
WITH contact_map(mock_id, new_id) AS (
  VALUES 
    ('c-001', gen_random_uuid()), ('c-002', gen_random_uuid()), 
    ('c-003', gen_random_uuid()), ('c-004', gen_random_uuid()),
    ('c-005', gen_random_uuid()), ('c-006', gen_random_uuid())
)
INSERT INTO contacts (id, email, first_name, last_name, lifecycle_stage, health_score, company)
SELECT 
  m.new_id, 
  (ARRAY['hana.mori@nordwave.co', 'y.demir@aterra.io', 'priya@lumenlabs.in', 'm.olafsen@fjordbyte.no', 'lucia@vidacafe.mx', 'aiko.t@kintora.jp'])[row_number() OVER ()],
  (ARRAY['Hana', 'Yusuf', 'Priya', 'Magnus', 'Lucia', 'Aiko'])[row_number() OVER ()],
  (ARRAY['Mori', 'Demir', 'Shankar', 'Olafsen', 'Romero', 'Tanaka'])[row_number() OVER ()],
  'prospect', 50,
  (ARRAY['Nordwave', 'Aterra', 'Lumen', 'FjordByte', 'Vida', 'Kintora'])[row_number() OVER ()]
FROM contact_map m;

-- 3. Insert Opportunities mapped to contacts
INSERT INTO opportunities (id, contact_id, name, stage, estimated_value)
SELECT 
  gen_random_uuid(),
  c.id,
  'Q3 Campaign - ' || c.company,
  'identified',
  5000.00
FROM contacts c;

-- 4. Insert Proposals mapped to opportunities
INSERT INTO proposals (id, opportunity_id, draft_content, status)
SELECT 
  gen_random_uuid(),
  o.id,
  '{"summary": "Draft proposal for ' || o.name || '"}',
  'review'
FROM opportunities o;

-- 5. Insert Cases
INSERT INTO cases (id, subject, description, status)
VALUES 
(gen_random_uuid(), 'Issue with WhatsApp integration', 'Bot not responding', 'new'),
(gen_random_uuid(), 'Proposal review delay', 'Need clarification on terms', 'open');
