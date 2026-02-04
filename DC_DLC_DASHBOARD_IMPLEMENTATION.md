# DC District Collector & DLC Dashboard Implementation

## Overview
This implementation adds comprehensive dashboard functionality for District Collector (DC) and District Level Committee (DLC) users with proposal management, PDF export capabilities, and notification systems.

## Features Implemented

### 1. DC District Collector Dashboard (Category ID: 32)

#### Key Features:
- **Proposal Statistics Dashboard**
  - Total Proposals
  - Pending for Accept at RFO/DFO
  - Rejected Proposals by RFO/DFO
  - Pending at RFO/DFO
  - Pending at DLC
  - DLC Completed (Sanctioned) Proposals

- **Action Required Section**
  - Shows proposals pending for more than 1 month
  - Displays number of months and days pending
  - Sortable and filterable table

- **PDF Export Functionality**
  - Individual PDF export for each report type
  - Comprehensive data export with proper formatting
  - Includes proposal details, dates, and status information

#### Files Created:
- `src/components/common/DCDashboard.tsx` - Main DC dashboard component
- `src/app/api/dc-dashboard/route.ts` - API endpoint for DC data

### 2. DLC District Level Committee Dashboard (Category ID: 35)

#### Key Features:
- **Proposal Review System**
  - Shows proposals forwarded by RFO/DFO with status 'pending at DLC'
  - Detailed proposal information with days pending
  - Action buttons for Sanction/Send Back

- **Approval Workflow**
  - Sanction proposals with approval notes
  - Send back proposals with reasons
  - Automatic status updates and audit logging

- **Pendency Reports**
  - Export PDF reports of pending proposals
  - Statistics on average pending days
  - Overdue proposals (>30 days) tracking

- **Notification Management**
  - Upload notifications with title, description, link, and PDF
  - Display recent notifications in sidebar
  - File upload support for PDF documents

#### Files Created:
- `src/components/common/DLCDashboard.tsx` - Main DLC dashboard component
- `src/components/common/NotificationsList.tsx` - Notifications display component
- `src/app/api/dlc-dashboard/route.ts` - API endpoint for DLC data
- `src/app/api/dlc-dashboard/action/route.ts` - API for proposal actions
- `src/app/api/dlc-dashboard/notification/route.ts` - API for notifications

### 3. Database Enhancements

#### New Tables:
- `notifications` - Stores DLC notifications
- `proposal_audit_log` - Tracks all proposal actions for audit trail

#### Files Created:
- `src/app/api/create-audit-table/route.ts` - Creates necessary database tables

### 4. Integration with Main Dashboard

#### Updated Files:
- `src/components/ecommerce/DashboardTabsWrapper.tsx` - Added DC and DLC dashboard tabs

#### Tab Logic:
- District Collector (Category 32): Shows DC Dashboard as default tab
- DLC (Category 35): Shows DLC Dashboard as default tab
- Maintains existing functionality for other user categories

## API Endpoints

### DC Dashboard APIs:
- `GET /api/dc-dashboard` - Fetch DC dashboard data and statistics

### DLC Dashboard APIs:
- `GET /api/dlc-dashboard` - Fetch proposals pending at DLC
- `PUT /api/dlc-dashboard/action` - Update proposal status (sanction/send back)
- `POST /api/dlc-dashboard/notification` - Upload new notification
- `GET /api/dlc-dashboard/notification` - Fetch all notifications

### Utility APIs:
- `POST /api/create-audit-table` - Create audit and notification tables

## Database Schema

### Notifications Table:
```sql
CREATE TABLE notifications (
  id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  link VARCHAR(500),
  pdf_file VARCHAR(500),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  status ENUM('Active', 'Inactive') DEFAULT 'Active'
);
```

### Proposal Audit Log Table:
```sql
CREATE TABLE proposal_audit_log (
  id INT AUTO_INCREMENT PRIMARY KEY,
  proposal_id INT NOT NULL,
  user_id INT,
  action VARCHAR(50) NOT NULL,
  remarks TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## User Categories

- **Category 32**: District Collector - Access to DC Dashboard
- **Category 35**: DLC (District Level Committee) - Access to DLC Dashboard

## Workflow

### Proposal Flow:
1. **Initial Submission** → RFO/DFO Review
2. **RFO/DFO Approval** → Forward to DLC (status: 'pending at DLC')
3. **DLC Review** → Sanction (status: 'Completed') or Send Back (status: 'Correction needed')

### DC Dashboard View:
- Monitors all proposals across different stages
- Tracks pendency and generates reports
- Exports data for analysis

### DLC Dashboard Actions:
- Reviews proposals forwarded by RFO/DFO
- Makes final approval decisions
- Manages notifications for stakeholders

## PDF Export Features

### DC Dashboard Exports:
- Total Proposals Report
- Pending at RFO/DFO Report
- Rejected by RFO/DFO Report
- Action Required Report (>1 month pending)
- DLC Completed Report

### DLC Dashboard Exports:
- Pendency Report with all pending proposals
- Includes days pending, submission details, and priority indicators

## File Upload System

### Notification Uploads:
- Supports PDF file uploads for notifications
- Files stored in `/public/uploads/notifications/`
- Automatic filename generation with timestamps
- File size and type validation

## Testing

### Test Page:
- `src/app/(admin)/test-dashboards/page.tsx` - Test both dashboards
- Access via `/test-dashboards` route
- Switch between DC and DLC dashboard views

## Security Features

- User category-based access control
- Session validation for all API endpoints
- File upload validation and sanitization
- SQL injection prevention with parameterized queries

## Performance Optimizations

- Efficient database queries with proper indexing
- Lazy loading of dashboard components
- Optimized PDF generation with proper scaling
- Caching of frequently accessed data

## Future Enhancements

1. **Real-time Notifications** - WebSocket integration for live updates
2. **Advanced Analytics** - Charts and graphs for proposal trends
3. **Bulk Operations** - Batch approval/rejection of proposals
4. **Email Notifications** - Automatic email alerts for stakeholders
5. **Mobile Responsiveness** - Enhanced mobile dashboard experience

## Installation & Setup

1. Ensure all dependencies are installed (jspdf, jspdf-autotable already included)
2. Run the audit table creation API: `POST /api/create-audit-table`
3. Update user categories in database to assign users to Category 32 (DC) or 35 (DLC)
4. Test the implementation using `/test-dashboards` page

## Troubleshooting

### Common Issues:
1. **PDF Export Fails** - Check jspdf dependencies and browser compatibility
2. **File Upload Issues** - Verify upload directory permissions
3. **Database Errors** - Ensure audit tables are created
4. **Access Denied** - Verify user category assignments

### Debug Steps:
1. Check browser console for JavaScript errors
2. Verify API responses in Network tab
3. Check server logs for database connection issues
4. Validate user session and category data