# Proposal Error Handling Guide

## Overview
This guide covers the error handling improvements made to the proposal management system, specifically addressing JSON parsing errors and API failures.

## Fixed Issues

### 1. **JSON Parsing Error in work_status_record**

**Problem**: 
```
PUT /api/proposals/updatestatus 500
Error at line 39: JSON.parse(existingRecord[0][0].work_status_record)
```

**Root Cause**: 
The `work_status_record` field contained plain text data (like rejection reasons) that couldn't be parsed as JSON.

**Solution**:
```typescript
// Before (Caused Error)
const recordData = existingRecord[0]?.[0]?.work_status_record 
  ? JSON.parse(existingRecord[0][0].work_status_record) 
  : {};

// After (Safe Parsing)
let recordData: any = {};
if (existingRecord[0]?.[0]?.work_status_record) {
  try {
    recordData = JSON.parse(existingRecord[0][0].work_status_record);
  } catch (parseError) {
    console.log('Failed to parse work_status_record as JSON, treating as plain text');
    recordData = {
      reason: existingRecord[0][0].work_status_record
    };
  }
}
```

### 2. **Enhanced API Error Handling**

**Improvements Made**:
- Added comprehensive logging for debugging
- Better error messages with details
- Graceful handling of checkbox saving failures
- Support for forward_to parameter
- Timestamp tracking for actions

## API Enhancements

### Updated Parameters
```typescript
// New API parameters supported
{
  proposal_id: number;
  work_status: string;
  reason?: string;           // For reject/send back
  review_checkboxes?: object; // Review checklist data
  action?: string;           // Action type for logging
  forward_to?: string;       // User ID to forward to
}
```

### Enhanced Response
```typescript
// API now returns more detailed response
{
  success: true,
  message: 'Proposal status updated successfully',
  affectedRows: number,
  proposal_id: number,
  new_status: string
}
```

### Error Response
```typescript
// Detailed error information
{
  error: 'Failed to update proposal status',
  details: 'Specific error message'
}
```

## Database Cleanup

### Fix Invalid JSON Records
Created cleanup endpoint: `POST /api/fix-work-status-records`

**What it does**:
1. Scans all proposals with work_status_record data
2. Identifies invalid JSON entries
3. Converts plain text to proper JSON format
4. Preserves original data in structured format

**Usage**:
```bash
# Run once to fix existing data
curl -X POST http://localhost:3000/api/fix-work-status-records
```

**Response**:
```json
{
  "success": true,
  "message": "Work status records cleanup completed",
  "total_checked": 150,
  "fixed_count": 23,
  "error_count": 0
}
```

## Frontend Error Handling

### Enhanced Error Display
```typescript
// Before
if (response.ok) {
  toast.success('Success');
} else {
  toast.error('Failed');
}

// After
const result = await response.json();
if (response.ok) {
  toast.success('Proposal forwarded to DLC successfully');
} else {
  console.error('API Error:', result);
  toast.error(result.error || 'Failed to forward to DLC');
}
```

### Better User Feedback
- Specific error messages from API
- Console logging for debugging
- Graceful fallbacks for network issues
- Loading states during API calls

## Logging and Debugging

### Server-Side Logging
```typescript
console.log('Update proposal request:', { proposal_id, work_status, action, forward_to });
console.log('Status update result:', result);
console.log('Review checkboxes saved successfully');
console.log('Forward_to updated:', forward_to);
```

### Client-Side Logging
```typescript
console.error('API Error:', result);
console.error('Error forwarding proposal:', error);
```

## Error Prevention Strategies

### 1. **Data Validation**
- Validate required parameters before API calls
- Check data types and formats
- Sanitize user input

### 2. **Safe JSON Operations**
- Always use try-catch for JSON.parse()
- Provide fallback values for invalid data
- Log parsing errors for debugging

### 3. **Database Integrity**
- Use transactions for multi-step operations
- Add constraints to prevent invalid data
- Regular data validation checks

### 4. **API Resilience**
- Graceful error handling
- Detailed error messages
- Retry mechanisms for transient failures

## Testing Scenarios

### 1. **JSON Parsing Tests**
```typescript
// Test cases for work_status_record
const testCases = [
  { input: '{"valid": "json"}', expected: 'success' },
  { input: 'plain text reason', expected: 'converted' },
  { input: '', expected: 'empty_object' },
  { input: null, expected: 'empty_object' }
];
```

### 2. **API Error Tests**
- Missing required parameters
- Invalid proposal IDs
- Database connection failures
- Network timeouts

### 3. **Frontend Error Tests**
- API server down
- Invalid responses
- Network connectivity issues
- User permission errors

## Monitoring and Alerts

### Key Metrics to Monitor
1. **API Error Rate**: Track 500 errors in updatestatus endpoint
2. **JSON Parse Failures**: Monitor parsing error logs
3. **Database Timeouts**: Track slow queries
4. **User Error Reports**: Frontend error tracking

### Alert Thresholds
- Error rate > 5% in 5 minutes
- JSON parse failures > 10 in 1 hour
- Database timeout > 30 seconds
- User complaints about proposal forwarding

## Recovery Procedures

### 1. **If JSON Parsing Fails**
1. Run the cleanup script: `POST /api/fix-work-status-records`
2. Check database for corrupted records
3. Manually fix any remaining issues
4. Restart application if needed

### 2. **If API Calls Fail**
1. Check server logs for specific errors
2. Verify database connectivity
3. Check user permissions
4. Validate request parameters

### 3. **If Frontend Errors Occur**
1. Check browser console for errors
2. Verify API endpoint availability
3. Clear browser cache if needed
4. Check network connectivity

## Best Practices

### 1. **Error Handling**
- Always use try-catch blocks
- Provide meaningful error messages
- Log errors with context
- Fail gracefully with fallbacks

### 2. **Data Management**
- Validate data before storage
- Use consistent data formats
- Regular data integrity checks
- Backup before major changes

### 3. **User Experience**
- Show loading states
- Provide clear error messages
- Allow retry mechanisms
- Maintain application state

### 4. **Development**
- Test error scenarios
- Use TypeScript for type safety
- Document error handling
- Monitor production errors

This comprehensive error handling system ensures robust proposal management with graceful failure handling and detailed debugging information.