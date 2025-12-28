# ⚠️ MIGRATION SAFETY WARNING

## Destructive Migration Identified

**File:** `supabase/migrations/20251225142800_eafd2d00-5d4d-441b-a0f7-5f9c82f9b41c.sql`

**Issue:** This migration contains destructive DELETE statements that wipe `publisher_books` and `publisher_series` tables.

```sql
DELETE FROM publisher_books;
DELETE FROM publisher_series;
```

## Policy: NO DESTRUCTIVE QUERIES

All enrichment and populate operations MUST follow these rules:

1. **NEVER use TRUNCATE or DELETE** in enrichment/populate edge functions
2. **Only INSERT missing rows** or **UPDATE targeted existing rows**
3. If data removal is ever necessary:
   - Use **soft delete** (add `deleted_at TIMESTAMP` column)
   - Require explicit `danger-confirmed` admin action
   - Log to `admin_data_events` with `records_deleted > 0`

## Audit Tables

New audit tables have been created:

- `admin_jobs_log` - Tracks all enrichment job runs
- `admin_data_events` - Forensic logging with delete count tracking

## Future Prevention

When reviewing migrations, **reject any PR containing**:
- `DELETE FROM`
- `TRUNCATE TABLE`
- `DROP TABLE`

Unless they are:
1. Explicitly approved by admin
2. Part of a schema evolution with data preservation plan
3. Logged with full audit trail

---

*This warning was generated as part of data integrity enforcement.*
*Date: 2024-12-28*
