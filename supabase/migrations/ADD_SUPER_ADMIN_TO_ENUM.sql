-- Add super_admin to app_role enum
-- Run this FIRST before assigning the super_admin role

-- Check current enum values (for reference)
-- SELECT e.enumlabel
-- FROM pg_type t
-- JOIN pg_enum e ON t.oid = e.enumtypid
-- WHERE t.typname = 'app_role'
-- ORDER BY e.enumsortorder;

-- Add super_admin to the enum
-- Note: Adding enum values cannot be done inside a transaction in older PostgreSQL versions
DO $$ 
BEGIN
    -- Check if super_admin already exists
    IF NOT EXISTS (
        SELECT 1 
        FROM pg_type t 
        JOIN pg_enum e ON t.oid = e.enumtypid 
        WHERE t.typname = 'app_role' 
        AND e.enumlabel = 'super_admin'
    ) THEN
        -- Add the enum value
        ALTER TYPE app_role ADD VALUE 'super_admin';
    END IF;
END $$;

-- Verify it was added
SELECT e.enumlabel
FROM pg_type t
JOIN pg_enum e ON t.oid = e.enumtypid
WHERE t.typname = 'app_role'
ORDER BY e.enumsortorder;

