-- ==========================================
-- Fix NULL Metrics in code-push-server
-- ==========================================
-- Root Cause:
--   package-manager.js createPackage() creates PackagesMetrics records
--   without initializing active/downloaded/failed/installed to 0.
--   MySQL defaults these to NULL, so NULL + 1 = NULL when SDK reports back.
--
-- Fix Applied:
--   compose files now have a sed patch that adds:
--     {package_id: packages.id, active: 0, downloaded: 0, failed: 0, installed: 0}
--
-- This SQL fixes all EXISTING records that have NULL values.
-- Run this ONCE after deploying the patched code-push-server container.
-- ==========================================

-- Fix active column
UPDATE packages_metrics SET active = 0 WHERE active IS NULL;

-- Fix downloaded column
UPDATE packages_metrics SET downloaded = 0 WHERE downloaded IS NULL;

-- Fix failed column
UPDATE packages_metrics SET failed = 0 WHERE failed IS NULL;

-- Fix installed column
UPDATE packages_metrics SET installed = 0 WHERE installed IS NULL;

-- Verify no NULLs remain
SELECT COUNT(*) AS null_count FROM packages_metrics
  WHERE active IS NULL OR downloaded IS NULL OR failed IS NULL OR installed IS NULL;
