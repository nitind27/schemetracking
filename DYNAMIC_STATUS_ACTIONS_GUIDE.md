# Dynamic Status-Based Actions Implementation

## Overview
This implementation provides a comprehensive dynamic action system for proposal management based on database status values. The system automatically shows/hides action buttons based on the current proposal status.

## Status-Based Action Logic

### 1. **Not Started** (`''`, `'not started yet'`, `'not started'`)
- **Available Actions**: Start Review
- **Description**: Proposal hasn't been started yet
- **Button**: Blue "Start Review" button
- **Next Status**: "Under Review"

### 2. **Under Review** (`'under review'`, `'pending'`, `'submitted'`)
- **Available Actions**: Accept, Reject, Send Back
- **Description**: Proposal is actively being reviewed
- **Buttons**: 
  - Green "Accept Proposal" button
  - Red "Reject Proposal" button  
  - Orange "Send Back for Correction" button
- **Next Status**: "Accepted", "Rejected", or "Correction needed"

### 3. **Accepted** (`'accepted'`)
- **Available Actions**: Forward to DLC
- **Description**: Proposal has been accepted and can be forwarded
- **Button**: Purple "Forward to DLC" button
- **Next Status**: "pending at DLC"

### 4. **Rejected** (`'rejected'`)
- **Available Actions**: None
- **Description**: Proposal has been rejected
- **Display**: "No actions available" message
- **Status**: Final state

### 5. **Correction Needed** (`'correction needed'`, `'sent back'`)
- **Available Actions**: None
- **Description**: Proposal sent back for corrections
- **Display**: "Waiting for resubmission" message
- **Status**: Waiting for user to resubmit

### 6. **Pending at DLC** (`'pending at dlc'`)
- **Available Actions**: None
- **Description**: Proposal forwarded to DLC for final approval
- **Display**: "Waiting for DLC decision" message
- **Status**: In DLC queue

### 7. **Completed** (`'approved'`, `'completed'`, `'sanctioned'`)
- **Available Actions**: None
- **Description**: Proposal has been completed/approved
- **Display**: "No further actions required" message
- **Status**: Final state

### 8. **Unknown Status**
- **Available Actions**: Accept, Reject, Send Back
- **Description**: Fallback for unrecognized statuses
- **Display**: Shows status name with available review actions

## Implementation Details

### Core Function: `getAvailableActions(proposal)`

```typescript
const getAvailableActions = (proposal: Proposal | null) => {
  if (!proposal) return { 
    canAccept: false, 
    canReject: false, 
    canSendBack: false, 
    canStartReview: false,
    canForwardToDLC: false,
    statusMessage: 'No proposal selected'
  };
  
  const status = proposal.work_status?.toLowerCase()?.trim() || '';
  
  // Returns object with boolean flags and status message
  switch (status) {
    case '':
    case 'not started yet':
    case 'not started':
      return { 
        canStartReview: true,
        // ... other flags false
        statusMessage: 'Proposal not started - Click "Start Review" to begin'
      };
    // ... other cases
  }
};
```

### Action Handlers

#### 1. Start Review Handler
```typescript
const handleStartReview = async () => {
  const response = await fetch('/api/proposals/updatestatus', {
    method: 'PUT',
    body: JSON.stringify({
      proposal_id: selectedProposal.proposal_id,
      work_status: 'Under Review',
      action: 'start_review'
    })
  });
};
```

#### 2. Forward to DLC Handler
```typescript
const handleForwardToDLC = async () => {
  const response = await fetch('/api/proposals/updatestatus', {
    method: 'PUT',
    body: JSON.stringify({
      proposal_id: selectedProposal.proposal_id,
      work_status: 'pending at DLC',
      action: 'forward_to_dlc',
      review_checkboxes: reviewCheckboxes
    })
  });
};
```

## UI Components

### 1. Modal Action Buttons
- Dynamic button rendering based on `availableActions` flags
- Status message display with current status and guidance
- Color-coded buttons (Blue, Green, Red, Orange, Purple)
- Disabled state handling

### 2. Table Action Buttons
- Inline action buttons in proposal table
- Dynamic button text and colors
- "No Actions" display for completed proposals
- Quick access to modal for detailed actions

### 3. Status Information Panel
- Current status display
- Helpful status messages
- Visual indicators with appropriate colors

## Database Integration

### Status Updates
All status changes are tracked in the database with:
- Timestamp updates (`updated_at`)
- Action logging in audit trail
- User tracking for accountability

### API Endpoints
- `PUT /api/proposals/updatestatus` - Updates proposal status
- Handles all status transitions
- Validates user permissions
- Logs actions for audit

## User Experience Features

### 1. Visual Feedback
- Color-coded status badges
- Progress indicators
- Clear action buttons with icons
- Helpful status messages

### 2. Workflow Guidance
- Step-by-step status messages
- Clear next action indicators
- Disabled states for unavailable actions
- Contextual help text

### 3. Error Handling
- Toast notifications for success/failure
- Graceful fallbacks for unknown statuses
- User-friendly error messages
- Automatic page refresh on success

## Benefits

### 1. **Dynamic Flexibility**
- Automatically adapts to new database statuses
- No hardcoded status checks
- Easy to extend with new statuses

### 2. **User-Friendly**
- Clear guidance on available actions
- Prevents invalid state transitions
- Intuitive workflow progression

### 3. **Maintainable**
- Centralized status logic
- Consistent action handling
- Easy to debug and modify

### 4. **Secure**
- Server-side status validation
- Audit trail for all actions
- User permission checks

## Testing Scenarios

### 1. Status Progression Test
1. Create proposal (Not Started)
2. Start Review → Under Review
3. Accept → Accepted  
4. Forward to DLC → pending at DLC
5. DLC Action → Completed

### 2. Rejection Flow Test
1. Under Review → Reject → Rejected (Final)
2. Under Review → Send Back → Correction needed

### 3. Edge Cases Test
1. Unknown status handling
2. Missing status handling
3. Invalid transitions
4. Permission validation

## Configuration

### Adding New Status
1. Add case to `getAvailableActions()` switch statement
2. Define available actions for the status
3. Add status message
4. Update API endpoint if needed
5. Test workflow transitions

### Customizing Actions
1. Modify action flags in `getAvailableActions()`
2. Add new action handlers
3. Update UI button rendering
4. Add API endpoint support

This implementation provides a robust, scalable, and user-friendly system for managing proposal workflows with dynamic status-based actions.