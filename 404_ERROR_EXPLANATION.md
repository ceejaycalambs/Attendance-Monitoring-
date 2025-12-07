# Complete Guide: Understanding and Fixing the 404 NOT_FOUND Error

## 1. The Fix Applied ✅

**What Changed:**
- Added error handling for the `get_event_from_pin` RPC function call
- Added fallback to active event when the function doesn't exist or fails
- Made the code resilient - it works even if the function isn't deployed yet
- Added proper TypeScript type assertions to handle missing function types

**Files Modified:**
- `src/pages/Scanner.tsx` - Added error handling and fallback logic
- `src/contexts/AuthContext.tsx` - Added try-catch around RPC call

## 2. Root Cause Analysis

### What Was Actually Happening:
1. **Code Flow:**
   - Officer logs in with PIN → Code calls `get_event_from_pin` RPC function
   - Page refreshes → Code tries to call `get_event_from_pin` again
   - Function doesn't exist in Supabase → Returns 404 NOT_FOUND
   - Error wasn't caught → `selectedEvent` stays `null`
   - User scans → Code checks `if (!selectedEvent) return` → Scan fails silently

2. **The Problem Chain:**
   ```
   RPC Call → 404 Error → No Event Selected → Scan Fails
   ```

### What It Needed to Do:
- Handle the 404 error gracefully
- Fall back to the active event if RPC function fails
- Ensure scans work even without the RPC function
- Provide clear error messages for debugging

### Conditions That Triggered This:
- The `get_event_from_pin` function wasn't deployed to Supabase
- The code didn't handle the error case
- After refresh, the same error occurred again
- No fallback mechanism existed

### The Misconception:
**"If I create a SQL file, the function automatically exists in the database"**

**Reality:** SQL files are just code - they must be executed in Supabase SQL Editor to create the function.

## 3. Understanding the Concept

### Why Does This Error Exist?

**404 NOT_FOUND** is an HTTP status code that means:
- The requested resource (in this case, an RPC function) doesn't exist
- The server (Supabase) can't find what you're asking for
- It's a client error - you're asking for something that isn't there

### What Is It Protecting You From?

1. **Silent Failures:** Without 404, you might think the function worked when it didn't
2. **Security:** Prevents calling non-existent functions that might have been deleted
3. **Debugging:** Clear indication that something is missing

### The Correct Mental Model:

**RPC Functions = API Endpoints in Your Database**
- They're like functions you can call remotely
- They must be created/deployed before you can use them
- They're part of your database schema, not your frontend code
- TypeScript types are generated from your database schema

**The Flow:**
```
1. Write SQL function → 2. Deploy to Supabase → 3. Generate Types → 4. Use in Code
```

### How This Fits Into the Framework:

**Supabase Architecture:**
- **Frontend (React)** → Calls RPC functions via `supabase.rpc()`
- **Supabase API** → Routes RPC calls to PostgreSQL functions
- **PostgreSQL** → Executes the function and returns results

**The Gap:**
- Your code assumes the function exists
- But it hasn't been created in PostgreSQL yet
- Supabase returns 404 because PostgreSQL says "function doesn't exist"

## 4. Warning Signs to Recognize

### Code Smells That Indicate This Issue:

1. **Missing Error Handling:**
   ```typescript
   // ❌ BAD - No error handling
   const { data } = await supabase.rpc("my_function");
   
   // ✅ GOOD - Handles errors
   const { data, error } = await supabase.rpc("my_function");
   if (error) { /* handle it */ }
   ```

2. **No Fallback Logic:**
   ```typescript
   // ❌ BAD - Fails if function doesn't exist
   const eventId = await getEventFromPin();
   setEvent(eventId); // Might be null/undefined
   
   // ✅ GOOD - Has fallback
   const eventId = await getEventFromPin();
   setEvent(eventId || activeEvent); // Falls back
   ```

3. **TypeScript Errors About Missing Functions:**
   - If TypeScript complains about a function not existing in types
   - It means the function likely doesn't exist in the database either

4. **Silent Failures:**
   - Code runs but doesn't work
   - No error messages shown
   - State doesn't update as expected

### Similar Mistakes You Might Make:

1. **Assuming Migrations Ran:**
   - Creating migration files but not running them
   - Assuming database changes are automatic

2. **Not Checking Function Existence:**
   - Calling functions without verifying they exist
   - Not testing in development first

3. **Missing Error Boundaries:**
   - Not handling API errors gracefully
   - Not providing user feedback on failures

4. **Type Mismatches:**
   - Using functions that aren't in TypeScript types
   - Not regenerating types after database changes

## 5. Alternative Approaches and Trade-offs

### Approach 1: Deploy Function First (Recommended)
**How:**
- Run SQL file in Supabase before deploying frontend
- Function exists when code calls it
- No error handling needed for missing function

**Pros:**
- Clean code, no workarounds
- Type-safe (function in types)
- Better performance (no error handling overhead)

**Cons:**
- Requires database access
- Deployment order matters
- Can't test frontend without backend

### Approach 2: Graceful Degradation (Current Fix)
**How:**
- Handle 404 errors gracefully
- Fall back to alternative logic
- Code works even if function doesn't exist

**Pros:**
- Resilient to missing functions
- Frontend can be deployed independently
- Better user experience (no crashes)

**Cons:**
- More complex code
- Might hide real issues
- Requires fallback logic

### Approach 3: Feature Flags
**How:**
- Check if function exists before calling
- Use feature flag to enable/disable feature
- Show UI based on availability

**Pros:**
- Explicit control
- Can enable features gradually
- Clear user feedback

**Cons:**
- More code complexity
- Requires additional checks
- More state to manage

### Approach 4: Health Checks
**How:**
- Check function existence on app startup
- Show warnings if functions are missing
- Disable features that require missing functions

**Pros:**
- Early detection of issues
- Clear developer feedback
- Prevents runtime errors

**Cons:**
- Additional startup time
- More complex initialization
- Requires health check endpoint

## Best Practices Going Forward

1. **Always Handle RPC Errors:**
   ```typescript
   const { data, error } = await supabase.rpc("function_name");
   if (error) {
     console.error("RPC Error:", error);
     // Handle gracefully
   }
   ```

2. **Deploy Functions Before Frontend:**
   - Run SQL migrations first
   - Verify functions exist
   - Then deploy frontend code

3. **Use TypeScript Types:**
   - Regenerate types after database changes
   - Let TypeScript catch missing functions
   - Use type assertions only when necessary

4. **Test Error Cases:**
   - Test what happens when functions don't exist
   - Test network failures
   - Test invalid inputs

5. **Provide User Feedback:**
   - Show loading states
   - Display error messages
   - Offer fallback options

## Next Steps

1. **Deploy the Function:**
   - Run `GET_EVENT_FROM_PIN.sql` in Supabase SQL Editor
   - Verify it exists: `SELECT routine_name FROM information_schema.routines WHERE routine_name = 'get_event_from_pin';`

2. **Regenerate Types (Optional):**
   - Run `npx supabase gen types typescript --project-id YOUR_PROJECT_ID > src/integrations/supabase/types.ts`
   - This will add `get_event_from_pin` to your types

3. **Test the Fix:**
   - Clear browser cache
   - Log in as officer
   - Verify event is selected
   - Test scanning multiple times
   - Test after refresh

4. **Monitor for Similar Issues:**
   - Check browser console for 404 errors
   - Look for missing function warnings
   - Verify all RPC calls have error handling

