# ✅ DLC Dashboard Fix

## Problem
When forwarding a proposal to category_id = 35 (DLC), the DLC Dashboard disappeared from the interface.

## Root Cause
The `DLCDashboard` component import and tab definition were missing from the main `DashboardTabsWrapper.tsx` file.

## Fix Applied

### 1. Added Missing Import
```typescript
import DLCDashboard from "@/components/common/DLCDashboard";
```

### 2. Added DLC Category Check
```typescript
// For DLC (category_id = 35) - show DLC Dashboard
const isDLC = categoryId === "35";
```

### 3. Added DLC Dashboard Tab
```typescript
// DLC Dashboard tab - only show for DLC (category_id = 35)
...(isDLC ? [{
  id: "dlc-dashboard",
  label: "DLC Dashboard",
  content: <DLCDashboard />
}] : []),
```

### 4. Updated Default Tab Selection
```typescript
// Prefer DLC Dashboard for DLC users
const defaultTabId = isDLC
  ? (tabs.find(tab => tab.id === "dlc-dashboard")?.id ?? tabs[0]?.id ?? "main-dashboard")
  : (tabs.find(tab => tab.id === "notification")?.id ?? tabs[0]?.id ?? "main-dashboard");
```

## How It Works Now

1. **Category_id = 35 users** now see the "DLC Dashboard" tab
2. **Forwarded proposals** with status "pending at DLC" appear in the DLC Dashboard
3. **Default tab** for DLC users is automatically set to "DLC Dashboard"
4. **All existing functionality** remains intact

## Verification Steps

1. Login as category_id = 35 user
2. Verify "DLC Dashboard" tab is visible
3. Check that forwarded proposals appear in the dashboard
4. Verify DLC actions (Sanction/Send Back) work correctly

The DLC Dashboard should now be fully functional and visible for category_id = 35 users.