# 🐛 DATA PERSISTENCE BUG - DIAGNOSTIC & FIX GUIDE

## Problem Summary
Transactions appear in the UI immediately after creation but disappear after 4-5 seconds or on page refresh.

---

## ✅ FIXES APPLIED

### 1. **SQL Script Created: `supabase_rls_fix.sql`**
   - **Location**: `./supabase_rls_fix.sql`
   - **Action Required**: 
     1. Open Supabase Dashboard → SQL Editor
     2. Copy and paste the ENTIRE contents of `supabase_rls_fix.sql`
     3. Execute the script
     4. Verify policies were created (verification queries are at the bottom)

### 2. **Code Fixed: `handleSingleTransaction` in App.tsx**
   - **What Changed**:
     - ✅ Now writes to database FIRST, before updating UI
     - ✅ Detailed error logging with specific error codes
     - ✅ Automatic rollback if database write fails
     - ✅ User-friendly error messages distinguishing RLS errors from network errors

### 3. **Existing Protection Verified**
   - ✅ `syncAll` already has 2-minute grace period for local changes
   - ✅ Realtime subscriptions handling INSERT/UPDATE/DELETE properly
   - ✅ Deduplication logic prevents ghost duplicates

---

## 🔍 HOW TO DIAGNOSE THE ROOT CAUSE

### Step 1: Open Browser Console
Open DevTools (F12) and watch the Console tab when you add a transaction.

### Step 2: Look for These Log Messages

#### ✅ **SUCCESS (Data persists correctly)**:
```
[Transaction] Attempting to save to database: {txId: "...", amount: 100, type: "spending"}
[Transaction] ✅ Database write successful
```

#### ❌ **RLS POLICY ERROR (Most likely culprit)**:
```
❌ [Transaction] DATABASE WRITE FAILED: {
  code: "42501" or "PGRST301",
  message: "...policy...",
  ...
}
🔒 RLS POLICY ERROR: Check Supabase RLS policies for transactions table
```
**FIX**: Run the `supabase_rls_fix.sql` script immediately.

#### ❌ **NETWORK ERROR**:
```
❌ [Transaction] DATABASE WRITE FAILED: {
  message: "Failed to fetch" or "network error",
  ...
}
```
**FIX**: Check internet connection or Supabase status.

#### ❌ **AUTHENTICATION ERROR**:
```
❌ [Transaction] DATABASE WRITE FAILED: {
  code: "401",
  message: "...authentication...",
  ...
}
```
**FIX**: User session may have expired. Try logging out and back in.

---

## 🧪 TESTING PROCEDURE

### Test 1: Add a Simple Transaction
1. Add a new spending transaction (e.g., 100 TL)
2. Watch the browser console
3. Wait 10 seconds
4. **Expected**: Transaction remains visible
5. **If it disappears**: Check console for error details

### Test 2: Page Refresh
1. Add a transaction
2. Wait for success confirmation
3. Hard refresh the page (Ctrl+Shift+R / Cmd+Shift+R)
4. **Expected**: Transaction is still there
5. **If it's gone**: RLS policies are likely blocking SELECT as well

### Test 3: Multi-Tab Sync
1. Open app in two browser tabs
2. Add transaction in Tab 1
3. Wait 5 seconds
4. **Expected**: Transaction appears in Tab 2 (via realtime)
5. **If not**: Realtime subscription may not be working (less critical)

---

## 🚨 COMMON ERROR PATTERNS

### Error Pattern 1: "Transaction displays → Disappears after 5 seconds"
- **Root Cause**: RLS policies blocking INSERT
- **Evidence**: Console shows "RLS POLICY ERROR" or code 42501/PGRST301
- **Fix**: Run `supabase_rls_fix.sql`

### Error Pattern 2: "Transaction never displays at all"
- **Root Cause**: Database write failing immediately + new code preventing optimistic UI
- **Evidence**: Console shows error immediately, UI shows error toast
- **Fix**: Check console for specific error, likely RLS or network

### Error Pattern 3: "Transaction persists but disappears on refresh"
- **Root Cause**: RLS SELECT policy missing (can write but can't read back)
- **Evidence**: Initial save works, but data doesn't load on refresh
- **Fix**: Run `supabase_rls_fix.sql` (includes SELECT policies)

---

## 📋 VERIFICATION CHECKLIST

After running the SQL script, verify these in Supabase Dashboard:

### Check RLS Policies (Dashboard → Authentication → Policies)
- [ ] `transactions` table has 4 policies (SELECT, INSERT, UPDATE, DELETE)
- [ ] `cards` table has 4 policies
- [ ] `categories` table has 4 policies
- [ ] Each policy checks `auth.uid() = user_id`

### Check Table Permissions (Dashboard → Table Editor → RLS)
- [ ] RLS is ENABLED on all tables
- [ ] Policies are listed as "Active"

---

## 🔧 MANUAL DEBUGGING COMMANDS

If you want to manually test Supabase writes, run this in browser console:

```javascript
// Test manual transaction insert (replace USER_ID with your actual user ID)
const testTx = {
  id: crypto.randomUUID(),
  user_id: 'YOUR_USER_ID_HERE',
  card_id: 'some-card-id',
  card_name: 'Test Card',
  type: 'spending',
  amount: 50,
  category: 'Test',
  date: new Date().toISOString(),
  description: 'Manual test',
  expense_type: 'single'
};

const { data, error } = await supabase
  .from('transactions')
  .insert(testTx);

console.log('Manual insert result:', { data, error });
// If error is null and data exists = RLS is working
// If error has "policy" message = RLS is blocking writes
```

---

## 🎯 EXPECTED OUTCOME

After applying all fixes:
1. ✅ Transactions persist to database BEFORE appearing in UI
2. ✅ If database write fails, user sees specific error message
3. ✅ Console shows detailed error for debugging
4. ✅ No "ghost data" that appears then disappears
5. ✅ Data survives page refreshes and tab switches

---

## 📞 IF ISSUE PERSISTS

If data still disappears after:
1. Running the SQL script
2. Verifying RLS policies are active
3. Confirming no console errors

Then check:
- **Supabase Project URL**: Ensure the app is connecting to the correct project
- **Environment Variables**: Verify `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` are correct
- **User ID**: Log `user.id` in the console to ensure it matches the `user_id` in the database

---

**Last Updated**: 2026-01-02  
**Status**: Critical bug fixes applied, awaiting user verification
