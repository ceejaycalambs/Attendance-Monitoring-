# Fix for 404 NOT_FOUND Error

## Root Cause Analysis

### 1. **What Was Happening**
- The code calls `supabase.rpc("get_event_from_pin", ...)` to get the event associated with a PIN
- This function doesn't exist in your Supabase database yet (you created the SQL file but haven't run it)
- Supabase returns a 404 NOT_FOUND error when calling a non-existent RPC function
- The error wasn't being handled, causing the event selection to fail silently
- Without a selected event, scans fail because `selectedEvent` is null

### 2. **Why It Happens After Refresh**
- On page refresh, the code tries to fetch the event from PIN again
- The same 404 error occurs
- The event never gets set
- Second scan fails because there's no event selected

### 3. **The Fix Applied**
- Added proper error handling with try-catch blocks
- Added fallback to active event when RPC function fails
- Made the code resilient - it works even if the function doesn't exist
- Added console warnings for debugging

## Solution

### Immediate Fix (Already Applied)
The code now handles the 404 error gracefully and falls back to the active event.

### Long-term Fix (Required)
**You must deploy the `get_event_from_pin` function to Supabase:**

1. Open Supabase Dashboard → SQL Editor
2. Copy the contents of `GET_EVENT_FROM_PIN.sql`
3. Paste and run it
4. Verify the function exists:
   ```sql
   SELECT routine_name 
   FROM information_schema.routines 
   WHERE routine_schema = 'public' 
   AND routine_name = 'get_event_from_pin';
   ```

## Code Changes Made

1. **Scanner.tsx**: Added error handling for RPC call with fallback to active event
2. **AuthContext.tsx**: Added try-catch around RPC call to prevent login failures

## Testing

After deploying the function:
1. Clear browser cache/sessionStorage
2. Log in as officer with PIN
3. Verify event is automatically selected
4. Scan a student - should work
5. Refresh page - event should still be selected
6. Scan again - should still work

