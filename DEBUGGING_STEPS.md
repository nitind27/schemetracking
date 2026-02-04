# 🔍 Debugging Steps for DLC Dashboard Issue

## Problem
Proposals forwarded to category_id = 35 are not showing up in the DLC Dashboard.

## Debugging Steps

### 1. Check Debug API
Visit this URL in your browser to see proposal status:
```
http://your-domain/api/debug-proposals
```

This will show:
- Total active proposals
- Proposals with status "pending at DLC"
- Proposals forwarded to category_id = 35 users

### 2. Check Console Logs
When forwarding a proposal:
1. Open browser Developer Tools (F12)
2. Go to Console tab
3. Forward a proposal to DLC
4. Look for these logs:
   - "Forward request sent:" (from ForwardProposalModal)
   - "Forwarding to DLC - setting status to 'pending at DLC'" (from API)
   - "Update query executed:" (from API)
   - "After update - proposal status:" (from API)

### 3. Check DLC Dashboard Logs
When DLC user opens dashboard:
1. Look for these logs in console:
   - "DLC Dashboard API called"
   - "DLC Dashboard proposals found: X"
   - "Sample proposal statuses:"

### 4. Temporary Debug Component
Add this to any page to see debug info:
```tsx
import { ProposalDebugger } from "@/components/debug/ProposalDebugger";

// Add this in any component
<ProposalDebugger />
```

## What to Look For

### ✅ Expected Behavior:
1. Forward request shows: `action: "forward_to_dlc"`, `work_status: "pending at DLC"`
2. Update query shows: `UPDATE proposal SET work_status = 'pending at DLC'`
3. After update shows: `work_status: "pending at DLC"`
4. DLC Dashboard finds proposals with this status

### ❌ Possible Issues:
1. **Status Mismatch**: Status stored as different case/spelling
2. **Forward_to Issue**: forward_to field not set correctly
3. **API Error**: Update query failing silently
4. **Database Issue**: Proposal not actually updated

## Quick Fixes to Try

### Fix 1: Check Database Directly
Run this SQL query to see actual proposal status:
```sql
SELECT proposal_id, work_status, forward_to, updated_at 
FROM proposal 
WHERE status = 'Active' 
ORDER BY updated_at DESC 
LIMIT 10;
```

### Fix 2: Manual Status Update
If you find a proposal that should be "pending at DLC" but isn't:
```sql
UPDATE proposal 
SET work_status = 'pending at DLC' 
WHERE proposal_id = YOUR_PROPOSAL_ID;
```

### Fix 3: Check User Categories
Verify DLC user exists:
```sql
SELECT user_id, name, user_category_id 
FROM users 
WHERE user_category_id = 35 AND status = 'Active';
```

## Report Back
After checking, please share:
1. What the debug API shows
2. What console logs appear
3. Any error messages
4. Database query results (if you can run them)

This will help identify exactly where the issue is occurring.