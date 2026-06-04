# The Agentic CRM Handoff Pattern

This document outlines the architectural contract between **Lifecycle Management (Agent G1)** and **Pipeline Management (Agent H1)**.

## Architectural Principles
1.  **Strict Separation of Concerns:**
    *   `contacts.lifecycle_stage` governs relationship maturity.
    *   `opportunities.stage` governs deal progression.
2.  **Automated Handoffs:**
    *   The database acts as the orchestrator to prevent state drift.
    *   When an opportunity is marked `closed_won`, the database automatically promotes the associated contact to `customer` via a trigger.
3.  **UI/UX:**
    *   Pipeline view is exclusively for deal management.
    *   Contacts view is exclusively for relationship management.

## Database Automation
The following trigger is implemented in the PostgreSQL database:

```sql
CREATE OR REPLACE FUNCTION promote_contact_to_customer()
RETURNS TRIGGER AS $$
BEGIN
  IF (NEW.stage = 'closed_won' AND OLD.stage != 'closed_won') THEN
    UPDATE contacts 
    SET lifecycle_stage = 'customer',
        updated_at = CURRENT_TIMESTAMP
    WHERE id = NEW.contact_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_promote_customer
AFTER UPDATE ON opportunities
FOR EACH ROW EXECUTE FUNCTION promote_contact_to_customer();
```
