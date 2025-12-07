    -- VERIFY_DELETE_FUNCTION.sql
    -- Run this to check if the delete function is working correctly

    -- ============================================
    -- STEP 1: Check the function definition
    -- ============================================
    SELECT 
    'Function Definition' as check_type,
    routine_name,
    routine_type,
    security_type,
    data_type as return_type
    FROM information_schema.routines
    WHERE routine_schema = 'public'
    AND routine_name = 'delete_officer_role';

    -- ============================================
    -- STEP 2: Check current officer roles
    -- ============================================
    SELECT 
    'Current Officers' as check_type,
    ur.id,
    ur.user_id,
    ur.role,
    u.email,
    p.name,
    ur.created_at
    FROM public.user_roles ur
    LEFT JOIN auth.users u ON u.id = ur.user_id
    LEFT JOIN public.profiles p ON p.id = ur.user_id
    WHERE ur.role IN ('rotc_officer', 'usc_officer')
    ORDER BY ur.created_at DESC;

    -- ============================================
    -- STEP 3: Check for any triggers on user_roles that might recreate rows
    -- ============================================
    SELECT 
    'Triggers on user_roles' as check_type,
    trigger_name,
    event_manipulation,
    action_timing,
    action_statement
    FROM information_schema.triggers
    WHERE event_object_table = 'user_roles'
    ORDER BY trigger_name;

    -- ============================================
    -- STEP 4: Check RLS policies on user_roles
    -- ============================================
    SELECT 
    'RLS Policies' as check_type,
    policyname,
    cmd,
    roles,
    qual,
    with_check
    FROM pg_policies
    WHERE tablename = 'user_roles'
    ORDER BY cmd, policyname;

    -- ============================================
    -- STEP 5: Test the function directly (replace with actual values)
    -- ============================================
    -- Uncomment and replace with actual officer user_id and role:
    -- SELECT * FROM public.delete_officer_role(
    --   'OFFICER_USER_ID_HERE'::UUID,
    --   'rotc_officer'::app_role
    -- );

    -- ============================================
    -- STEP 6: Check if there are foreign key constraints that might prevent deletion
    -- ============================================
    SELECT
    'Foreign Keys' as check_type,
    tc.constraint_name,
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name,
    rc.delete_rule
    FROM information_schema.table_constraints AS tc
    JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
    JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = tc.table_schema
    JOIN information_schema.referential_constraints AS rc
    ON rc.constraint_name = tc.constraint_name
    WHERE tc.constraint_type = 'FOREIGN KEY'
    AND tc.table_name = 'user_roles'
    ORDER BY tc.constraint_name;

    -- ============================================
    -- STEP 7: Check function permissions
    -- ============================================
    SELECT 
    'Function Permissions' as check_type,
    routine_name,
    grantee,
    privilege_type
    FROM information_schema.routine_privileges
    WHERE routine_schema = 'public'
    AND routine_name = 'delete_officer_role';


