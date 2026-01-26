# Dashboard Layout Guide

## Visual Layout Structure

```
┌─────────────────────────────────────────────────────────────┐
│                    APP HEADER                                │
│  (Blue Gradient: from-blue-700 via-blue-800 to-blue-900)    │
│  - VanSampada (वनसंपदा) - Nandurbar                         │
│  - Notifications, User Profile                               │
└─────────────────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────────────────┐
│              DISTRICT SUMMARY RIBBON                         │
│  (Blue Gradient Background with Slide-down Animation)       │
│  ┌──────┐  ┌──────┐  ┌──────┐  ┌──────┐                    │
│  │Talukas│  │Villages│ │Survey%│ │Pending│                  │
│  └──────┘  └──────┘  └──────┘  └──────┘                    │
└─────────────────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────────────────┐
│              ENHANCED KPI CARDS (5 Cards)                    │
│  ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐              │
│  │IFR   │ │Survey│ │Pending│ │Aadhaar│ │Docs  │              │
│  │Holders│ │Done  │ │Survey│ │Linked │ │Upload│              │
│  │[Ring]│ │[Ring]│ │[Ring]│ │[Ring]│ │[Ring]│              │
│  │ ↑2.5%│ │ ↑5.2%│ │ ↓3.1%│ │ ↑1.8%│ │ ↑4.5%│              │
│  └──────┘ └──────┘ └──────┘ └──────┘ └──────┘              │
└─────────────────────────────────────────────────────────────┘
┌──────────────────────────┬──────────────────────────────────┐
│   ALERTS SECTION          │   PENDING APPROVALS              │
│  ┌────────────────────┐  │  ┌────────────────────┐         │
│  │ ⚠️ Low Survey      │  │  │ ⏰ Proposal Review  │         │
│  │ ⚠️ Missing Docs    │  │  │ ⏰ Document Review  │         │
│  │ ℹ️ New Survey Data  │  │  │ ⏰ Verification     │         │
│  └────────────────────┘  │  └────────────────────┘         │
└──────────────────────────┴──────────────────────────────────┘
┌─────────────────────────────────────────────────────────────┐
│         RECENTLY UPDATED RECORDS                             │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ ✓ Farmer Name 1    | Updated: 2 hours ago            │  │
│  │ ✓ Farmer Name 2    | Updated: 5 hours ago            │  │
│  │ ✓ Farmer Name 3    | Updated: 1 day ago              │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────────────────┐
│              ADVANCED ANALYTICS                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Taluka-wise Comparison Bar Chart                     │  │
│  │  [Bar Chart: Completed vs Pending by Taluka]          │  │
│  └──────────────────────────────────────────────────────┘  │
│  ┌──────────────────────┬────────────────────────────────┐  │
│  │ Scheme Distribution  │ Monthly Survey Progress        │  │
│  │ [Horizontal Bar]     │ [Line Chart]                   │  │
│  └──────────────────────┴────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Document Availability Donut Chart                     │  │
│  │  [Pie Chart: With Docs vs Without Docs]               │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────────────────┐
│         PERFORMANCE SCORECARD TABLE                          │
│  ┌──────┬──────┬──────┬──────┬──────┬──────┬──────┐       │
│  │Taluka│Total │Survey│Aadhaar│Docs  │Score │Status│       │
│  ├──────┼──────┼──────┼──────┼──────┼──────┼──────┤       │
│  │Navapur│ 150 │ 85%  │ 90%  │ 80%  │  85  │Excel │       │
│  │Akkalkuwa│120│ 70%  │ 75%  │ 65%  │  70  │Good  │       │
│  └──────┴──────┴──────┴──────┴──────┴──────┴──────┘       │
└─────────────────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────────────────┐
│         ORIGINAL DASHBOARD CONTENT                          │
│  (Taluka Survey, Aadhaar Status, Documents, etc.)           │
└─────────────────────────────────────────────────────────────┘
```

## Component Hierarchy

```
DashboardTabsWrapper
├── DistrictSummaryRibbon
├── EnhancedKPICards (5 cards)
├── AlertsSection
├── PendingApprovalsSection
├── RecentlyUpdatedRecords
├── AdvancedAnalytics
│   ├── Taluka Comparison Bar Chart
│   ├── Scheme Distribution Bar Chart
│   ├── Monthly Progress Line Chart
│   └── Document Availability Donut Chart
├── PerformanceScorecard
└── DashboardTalukatabview (Original Content)
    ├── Taluka Wise Survey
    ├── Aadhaar Status
    ├── Document Availability
    ├── Scheme wise IFR holders
    └── General Information
```

## Color Coding

- **Blue (#3B82F6)**: Primary actions, IFR holders, government authority
- **Green (#10B981)**: Completed tasks, success states
- **Orange (#F59E0B)**: Pending items, warnings
- **Red (#EF4444)**: Errors, critical alerts
- **Purple (#8B5CF6)**: Special indicators, documents
- **Gray**: Neutral information, backgrounds

## Animation Sequence

1. **Page Load (0s)**: District Summary Ribbon slides down
2. **0.1s**: First KPI card fades in
3. **0.2s**: Second KPI card fades in
4. **0.3s**: Third KPI card fades in
5. **0.4s**: Fourth KPI card fades in
6. **0.5s**: Fifth KPI card fades in
7. **0.5s**: Alerts section fades in
8. **0.7s**: Pending Approvals fades in
9. **0.8s**: Recently Updated Records fades in
10. **0.9s**: Analytics charts animate in
11. **1.0s**: Performance Scorecard table rows stagger in

## Responsive Breakpoints

- **Mobile (< 640px)**: Single column, stacked cards
- **Tablet (640px - 1024px)**: 2-column grid for alerts/approvals
- **Desktop (1024px+)**: Full multi-column layout
- **Large (1280px+)**: Optimized spacing, 5 KPI cards in row

## Interactive Elements

- **KPI Cards**: Hover to scale (1.02x) and increase shadow
- **Alerts**: Click to view details
- **Pending Approvals**: Click "Review" button
- **Recently Updated**: Click row to view farmer details
- **Performance Table**: Hover row highlights, sticky header on scroll
- **Charts**: Interactive tooltips on hover

