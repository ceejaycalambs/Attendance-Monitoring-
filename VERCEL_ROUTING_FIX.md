# Fix for Vercel Refresh Error (404 on Refresh)

## Problem

When you refresh a page on Vercel (e.g., `/scanner`), you get a 404 error. This works fine on localhost because the Vite dev server handles SPA routing automatically.

## Root Cause

**What's Happening:**
1. User navigates to `/scanner` → React Router handles it (works)
2. User refreshes `/scanner` → Browser requests `/scanner` from Vercel server
3. Vercel looks for a file at `/scanner` → Doesn't exist → Returns 404
4. React Router never gets a chance to handle the route

**Why Localhost Works:**
- Vite dev server has built-in SPA support
- It automatically serves `index.html` for all routes
- React Router handles routing client-side

**Why Vercel Fails:**
- Vercel needs explicit configuration for SPA routing
- Without config, it tries to find actual files
- No file exists at `/scanner` → 404 error

## The Fix

Created `vercel.json` with rewrite rules that:
- Redirect all routes (`/*`) to `/index.html`
- Let React Router handle routing client-side
- Works for all routes in your app

## How It Works

```
User requests: /scanner
     ↓
Vercel sees: vercel.json rewrite rule
     ↓
Vercel serves: /index.html
     ↓
React app loads
     ↓
React Router sees: /scanner
     ↓
Shows: Scanner component ✅
```

## Alternative Solutions

### Option 1: vercel.json (Current - Recommended)
**Pros:**
- Simple configuration
- Works for all routes automatically
- Standard Vercel approach

**Cons:**
- None really

### Option 2: _redirects file (Netlify-style)
**Pros:**
- Works on Netlify too
- Simple syntax

**Cons:**
- Not standard for Vercel
- Less flexible

### Option 3: Serverless Function
**Pros:**
- More control
- Can add custom logic

**Cons:**
- Overkill for simple SPA
- More complex
- Slower (cold starts)

## Testing

After deploying:
1. Navigate to `/scanner`
2. Refresh the page (F5 or Cmd+R)
3. Should work without 404 error
4. Try other routes: `/dashboard`, `/events`, etc.
5. All should work on refresh

## Common Issues

### Still Getting 404?
1. Make sure `vercel.json` is in the root directory
2. Redeploy after adding the file
3. Check Vercel build logs for errors

### Routes Work But Assets 404?
- Make sure asset paths are relative, not absolute
- Check `vite.config.ts` for base path settings

### Build Fails?
- Check `vercel.json` syntax (must be valid JSON)
- Ensure file is in project root

## Best Practices

1. **Always include vercel.json for SPAs**
   - React, Vue, Angular apps need this
   - Prevents refresh errors

2. **Test on Vercel Preview**
   - Don't just test locally
   - Vercel behavior differs from localhost

3. **Use HashRouter for Simple Cases** (Alternative)
   - Routes like `/#/scanner`
   - Works without server config
   - But URLs look less clean

4. **Monitor Vercel Logs**
   - Check for routing errors
   - Watch for 404s in analytics

## Related Concepts

### SPA (Single Page Application)
- All routes handled client-side
- Server only serves one HTML file
- JavaScript handles navigation

### Server-Side Routing
- Each route is a separate file/page
- Server handles routing
- Traditional web apps

### Client-Side Routing
- JavaScript handles route changes
- No page reloads
- Faster navigation
- But needs server config for refresh

## Why This Matters

**User Experience:**
- Users expect refresh to work
- 404 errors are confusing
- Breaks browser back/forward buttons

**SEO (if applicable):**
- Search engines need proper routing
- 404s hurt SEO
- Proper config helps indexing

**Development:**
- Consistent behavior across environments
- Easier debugging
- Standard practice

