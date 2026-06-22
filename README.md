<div align="center">

<img src="public/vaani-banner.png" alt="VAANI Banner" width="100%" />

# 🏛️ VAANI
### Vigilant Administration & Accountability Network Intelligence
### मुख्यमंत्री शिकायत प्रबंधन प्रणाली

[![Next.js](https://img.shields.io/badge/Next.js-16.2.9-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![Node.js](https://img.shields.io/badge/Node.js-18%2B-339933?style=for-the-badge&logo=node.js)](https://nodejs.org/)
[![MongoDB](https://img.shields.io/badge/MongoDB-8.x-47A248?style=for-the-badge&logo=mongodb)](https://mongodb.com/)
[![Socket.io](https://img.shields.io/badge/Socket.io-4.x-010101?style=for-the-badge&logo=socket.io)](https://socket.io/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=for-the-badge)](LICENSE)

**A state-of-the-art, real-time grievance redressal and war room dashboard for the Government of NCT of Delhi.**

[🔴 Live Demo](#) &nbsp;|&nbsp; [📖 Documentation](#-table-of-contents) &nbsp;|&nbsp; [🚀 Deploy to Vercel](#-deployment-guide)

---

</div>

## 📺 Demo Video

> 🎬 **Click below to watch the full system walkthrough**

<!-- VIDEO PLACEHOLDER — Replace with your YouTube/Loom embed link -->
[![VAANI Demo Video](https://img.shields.io/badge/▶_Watch_Demo-FF0000?style=for-the-badge&logo=youtube&logoColor=white)](#)

```
📌 Place your demo video link here.
   Example: [![Demo](https://img.youtube.com/vi/YOUR_VIDEO_ID/maxresdefault.jpg)](https://youtube.com/watch?v=YOUR_VIDEO_ID)
```

---

## 📸 Screenshots

> 🖼️ **System Panel Overview**

<!-- SCREENSHOT PLACEHOLDER — Add your screenshots below -->
| Panel | Screenshot |
|-------|-----------|
| 🔴 CM War Room Dashboard | ![CM Dashboard](docs/screenshots/cm_dashboard.png) |
| 🗺️ Delhi District Heatmap | ![Heatmap](docs/screenshots/heatmap.png) |
| 📊 Analytics & Reports | ![Analytics](docs/screenshots/analytics.png) |
| 🚨 DEFCON Critical Alerts | ![Critical](docs/screenshots/defcon_alerts.png) |
| 👤 Citizen Portal | ![Citizen](docs/screenshots/citizen_portal.png) |
| 🏗️ DM District Panel | ![DM Panel](docs/screenshots/dm_panel.png) |
| 🏢 Department Manager Panel | ![Dept Panel](docs/screenshots/dept_panel.png) |
| 👷 Field Officer Dashboard | ![Officer](docs/screenshots/officer_dashboard.png) |
| 📋 Complaint Detail Page | ![Complaint](docs/screenshots/complaint_detail.png) |
| ⏱️ Timeline & Closure Flow | ![Timeline](docs/screenshots/timeline_closure.png) |

```
📌 Create a /docs/screenshots/ folder and add your screenshots there.
   Recommended resolution: 1920×1080 or 1280×800 (WebP or PNG)
```

---

## 📑 Table of Contents

- [Overview](#-overview)
- [System Architecture](#-system-architecture)
- [Role-Based Portal Guide](#-role-based-portal-guide)
  - [👤 Citizen Portal](#-citizen-portal)
  - [👷 Field Officer Dashboard](#-field-officer-dashboard)
  - [🏢 Department Manager Panel](#-department-manager-panel)
  - [🏗️ District Magistrate Panel](#-district-magistrate-panel)
  - [🔴 Chief Minister War Room](#-chief-minister-war-room)
- [Departments & SLA Matrix](#-departments--sla-matrix)
- [Technology Stack](#-technology-stack)
- [Database Schema](#-database-schema)
- [Real-Time Features](#-real-time-features)
- [Complaint Lifecycle](#-complaint-lifecycle)
- [Getting Started](#-getting-started)
- [Demo Access Profiles](#-demo-access-profiles)
- [Deployment Guide](#-deployment-guide)
- [Environment Variables Reference](#-environment-variables-reference)
- [API Reference](#-api-reference)
- [Contributing](#-contributing)

---

## 🌐 Overview

**VAANI** is a full-stack, production-ready grievance management system built for the Government of NCT of Delhi. It bridges the gap between citizens and governance through a real-time, role-based platform that ensures every complaint is tracked, escalated, and resolved with full accountability.

### Why VAANI?

| Problem | VAANI's Solution |
|---------|-----------------|
| Complaints lost in bureaucracy | End-to-end digital tracking with unique Grievance IDs |
| No accountability for delays | SLA enforcement with automatic breach alerts |
| Citizens unaware of progress | Real-time push notifications at every status change |
| CM unable to monitor ground reality | Live war room dashboard with DEFCON alert system |
| Data silos between departments | Unified platform with role-based, isolated data views |
| Corruption / tampering risk | Full audit trail with timestamped activity logs |

---

## 🤖 Vigilant AI Detection & Authenticity Verification Agent

To combat spam, fraud, and maintain extreme data integrity, VAANI is equipped with a state-of-the-art **Vigilant AI Detection & Authenticity Verification Agent** that scans every complaint and piece of evidence upon submission.

### 🔍 How the AI Agent Works
When a citizen files a complaint, the AI agent performs real-time heuristic, NLP, and metadata checks:

1. **Complaint Fraud & Spam Detection**: Runs NLP classifiers to inspect text density, repeated character sequences, and a dictionary of test/fake indicators (e.g., gibberish, "asdf", mock text). If flagged, it calculates a **Spam/Fraud Probability Score**.
2. **Evidence Authenticity & GPS Verification**: Inspects uploaded media metadata. It parses EXIF coordinates and cross-references them with the citizen's declared location coords. If the photo's location is more than 1 kilometer away, it triggers an `EVIDENCE_LOCATION_MISMATCH` flag.
3. **Stock & Downloaded Image Analysis**: Checks file signatures and name queries for common stock image markers (e.g., preview, stock, download).
4. **Automated AI Verdict**: Assigns a verdict (`PASSED`, `WARNING`, `FAILED`). FAILED complaints are automatically marked as suspicious and flagged for special manual review.

The AI Agent results are stored directly in the `ai_analysis` schema, visible in the complaint's immutable timeline:
* **Verdict**: `PASSED` / `WARNING` / `FAILED`
* **Fraud Probability**: `0% - 100%`
* **Authenticity Score**: `0% - 100%`
* **Detected Flags**: `SPAM_KEYWORDS_DETECTED`, `EXIF_DATA_STRIPPED`, `EVIDENCE_LOCATION_MISMATCH`, etc.

---

## 🏆 VAANI Hero Features Matrix

Here is the complete catalog of VAANI's state-of-the-art modules and components that make it the ultimate mission control network:

### 1. Core Governance & Closure Engines
* **False Closure Detection Engine**: Prevents field officers from closing complaints prematurely by analyzing text similarity in resolution notes, checking for copy-pasted templates, and flagging after-hours resolutions.
* **Citizen Verification Before Closure**: Before a complaint is marked as closed, the citizen must verify the resolution via the citizen portal or a dynamic OTP verification workflow.
* **CM Executive Dashboard**: High-level visual interface for the Chief Minister with real-time KPI counters, DEFCON alerts, and critical alerts.
* **Commissioner Dashboard**: Isolation dashboard for the municipal commissioner to monitor all active issues across MCD departments.
* **District Officer Dashboard**: Magisterial portal for district magistrates to review all complaints raised in their respective jurisdictions.
* **Department-Specific Dashboards**: Custom portals for the 12 active departments (MCD, DJB, PWD, etc.) to manage their respective queues.
* **Live Governance Command Center**: Direct web sockets command center showing complaint feeds, incoming alerts, and real-time SLA metrics.
* **CM Visit Intelligence Mode**: A dedicated mode showing geo-coordinates, nearby complaints, and visit logs for the Chief Minister's ground inspection tours.
* **Nearby Complaints Discovery**: Automatically groups and finds active complaints within 500m of a specified location for inspection planning.
* **Visit Logs & Field Inspection Tracking**: Logs visits made by inspectors with geo-tagged logs and before/after verification details.
* **Emergency War Room Dashboard**: Activated during critical events to coordinate disaster relief, water crisis, or power grid failures.
* **Chief Minister Mission Control Center**: Central system combining command dashboards, digital twins, and direct directive overrides.
* **Mobile CM Companion Dashboard**: Responsive companion views optimized for mobile screens during live transit.

### 2. AI & Machine Learning Intelligence
* **AI Auto Complaint Classification**: Auto-determines the correct department for a complaint using an N-Gram keyword-weight NLP classifier.
* **AI Auto Routing Engine**: Automatically assigns the complaint to the most optimal field officer in the correct district and department based on current queue load.
* **AI Priority Prediction**: Instantly flags DEFCON-level emergencies (e.g. electrocution risk, collapsed flyovers) to bypass regular queues.
* **Complaint Severity Scoring**: Analyzes risk and urgency factors to assign priority scores (DEFCON Red to Green).
* **Complaint Escalation Prediction**: Predicts if an issue will breach its SLA based on historical officer resolution speed and queue density.
* **Predictive Governance Engine**: Anticipates bottleneck periods and projects future complaint patterns.
* **Early Warning System**: Identifies spike trends in specific zones (e.g. sudden water contamination reports in Shahdara).
* **Citizen Sentiment Analysis**: Scans feedback text ratings and reviews to calculate citizen satisfaction indexes and department satisfaction scores.
* **AI Governance Recommendation Engine**: Recommends administrative optimizations and reallocation of personnel to underperforming zones.
* **Governance Insights Assistant**: Generates readable summaries of weekly district activity and recommendations.
* **AI-Powered Decision Support System**: Auto-suggests solutions and standard operational procedures (SOPs) to field officers.

### 3. Performance, Metrics & Accountability
* **Governance Score Engine**: Computes daily health cards for all 11 districts and 12 departments.
* **Citizen Trust Index**: Tracking metric based on historical citizen ratings and resolved-to-disputed ratios.
* **City Health Score**: Unified index reflecting the overall municipal functioning state of NCT of Delhi.
* **District Health Score**: Comparative rating for all 11 districts of Delhi.
* **Department Performance Ranking**: Live leaderboard comparing departments (e.g., BSES vs DJB) on SLA compliance and resolution speed.
* **Officer Performance Ranking**: Leaderboard for field staff based on credibility scores, speed, and positive ratings.
* **SLA Breach Command Center**: Direct view for DMs and CM to track all pending tasks that have violated their SLA timeline.
* **Escalation Management Engine**: Handles the automated promotion of complaints to DMs (Level 1) or the CM War Room (Level 2) on SLA breaches.
* **Officer Workload Intelligence**: Monitors the number of active cases assigned to each officer to prevent burnout.
* **Resource Capacity Intelligence**: Helps planners see if department staffing levels match local complaint volume.
* **Public Impact Score**: Weights complaints by population density and type of issue (e.g. commercial area water pipe burst vs private line leak).
* **Complaint Trend Analytics**: Tracks month-on-month increases or decreases in complaint filings.
* **Reopened Complaint Analytics**: Monitors cases that were closed but disputed by citizens to identify low-quality resolutions.
* **Root Cause Analytics**: Segregates complaints by sub-categories to find chronic infrastructural problems.
* **Department Accountability Dashboard**: A performance scorecard view highlighting SLA breach ratios and open disputes.
* **Officer Accountability Dashboard**: Tracks individual officer metrics including average resolution time and verification dispute history.
* **Dynamic KPI Engine**: Updates counters (Total Filed, Pending, Resolved, SLA Breached) on all dashboards instantly.
* **Real-Time Analytics Engine**: Aggregates MongoDB database changes into frontend charts using live-updating Socket.io feeds.
* **Officer Bandwidth Monitoring**: Displays real-time dashboard grids of active vs maximum limits for field staff.
* **Complaint Aging Analysis**: Breaks down pending cases into time-buckets (e.g., <24h, 1-3 days, 3-7 days, >7 days).
* **SLA Forecasting Engine**: Predicts expected completion times for ongoing works.
* **Department Benchmarking Engine**: Side-by-side performance comparisons of agencies.
* **Governance Performance Trends**: Historical charts showing long-term trends in resolution times.
* **Historical Governance Intelligence**: Accesses archived snapshots to compare current seasons with previous years.
* **Officer Response Time Intelligence**: Computes average hours taken from complaint assignment to field arrival.
* **Resolution Quality Scoring**: Combined evaluation based on citizen feedback and photo validation.
* **Public Service Performance Index**: General standard index for public service delivery efficiency.
* **Governance Maturity Index**: Audits the digitisation level and automation efficiency of NCT departments.

### 4. GIS & Spatial Intelligence
* **Complaint Hotspot Intelligence**: Identifies spatial clusters of complaints to isolate systemic infrastructure failures.
* **Ward-Level Heatmaps**: Zoomable GIS maps showing density details at local ward levels.
* **District-Level Heatmaps**: Colored district overlays demonstrating geographic performance.
* **City-Wide Heatmaps**: Interactive SVG maps representing the overall complaint density across Delhi.
* **Delhi Digital Twin Map**: Virtual layout rendering physical complaints directly on coordinate maps.
* **GIS-Based Complaint Visualization**: Plots active complaints as color-coded pins based on coordinate telemetry.
* **Complaint Density Mapping**: Renders localized heat signatures.
* **Geo-Fencing Based Alerts**: Notifies nearby field staff when a new complaint is filed within their geo-fenced region.

### 5. Real-time Incident & Disaster Management
* **Critical Incident Detection**: Auto-detects emergency text inputs and triggers instant war-room SMS alerts.
* **High-Risk Area Detection**: Flags geographical zones showing recurring hazards (e.g. dangling live wires or open sewers).
* **Infrastructure Failure Detection**: Flags catastrophic failures (e.g., complete grid blackout or main pipeline burst).
* **Flood Risk Intelligence**: Aggregates drainage/waterlogging reports during monsoon to warn disaster response.
* **Water Crisis Intelligence**: Highlights severe water shortage reports.
* **Power Outage Intelligence**: Maps substation outages based on street light and BSES complaint clusters.
* **Sanitation Risk Intelligence**: Flags garbage dumping spots near schools or hospitals.
* **Road Infrastructure Intelligence**: Highlights cave-ins and damaged bridges.

### 6. Multi-Department Coordination & Lifecycle
* **Duplicate Complaint Clustering**: Detects and links multiple filings about the same local issue (e.g. 5 citizens reporting the same pothole).
* **Real-Time Complaint Tracking**: Follows every state change with instant dashboard notifications.
* **Complaint Lifecycle Monitoring**: Fully audits the workflow from filing to closure.
* **Multi-Department Coordination Engine**: Connects MCD and PWD when issues overlap (e.g. road excavation for sewer line laying).
* **Cross-Department Complaint Linking**: Links related cases for unified tracking.
* **Master Issue Management**: Allows resolving a parent issue to auto-resolve all linked child complaints.
* **VIP/Emergency Escalation Engine**: Fast-tracks matters affecting vital infrastructure, hospitals, or transit routes.
* **Critical Complaint Fast Track Lane**: Bypasses regular queues to assign emergency complaints in under 2 minutes.

### 7. Citizen Portals, Communication & Channels
* **Social Media Complaint Aggregator**: Simulates fetching and mapping complaints filed on platforms like X/Twitter.
* **WhatsApp Complaint Intake**: Integrates WhatsApp intake pipelines.
* **Email Complaint Intake**: Auto-processes incoming emails into formal tickets.
* **Unified Citizen Complaint Feed**: Merges inputs from all channels (web, WhatsApp, etc.) into a single, clean workspace.
* **Citizen Satisfaction Analytics**: Aggregates rating indices across demographics.
* **Smart Notification Center**: Delivers precise notifications to citizens via email, SMS, and dashboard updates.
* **Real-Time Alert Center**: Alert hub on dashboards showing instant popups for DEFCON occurrences.
* **Public Transparency Dashboard**: Public-facing portal detailing resolution metrics and performance scorecards.
* **Citizen Resolution Timeline**: Clear, bilingual status timeline accessible by citizens.
* **Open Data & Reporting Engine**: Exposes anonymized complaint datasets for researchers.
* **Citizen Engagement Analytics**: Measures citizen participation rates.

### 8. Reporting & Auditing Systems
* **Audit Trail System**: Logs every action (assignment, notes, verification, closure) with actor name and timestamp.
* **Immutable Activity Timeline**: An un-editable log embedded in every complaint.
* **Geo-Tagged Resolution Verification**: Restricts resolving complaints unless photo evidence has matching GPS coordinate proof.
* **Before/After Evidence Verification**: Shows side-by-side photo comparisons.
* **CM Daily Brief Generator**: Automatically compiles a clean summary of daily statistics for the CMO.
* **Automated Governance Reports**: Regularly generates PDF/CSV reports.
* **Executive PDF Report Generator**: Generates high-quality PDF printouts of district analytics.

---

## 🏗️ System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        VAANI Architecture                        │
├─────────────────┬───────────────────────┬───────────────────────┤
│   FRONTEND      │      BACKEND          │      DATABASE          │
│   (Next.js)     │   (Node/Express)      │     (MongoDB)          │
│                 │                       │                        │
│  ┌───────────┐  │  ┌─────────────────┐  │  ┌──────────────────┐ │
│  │ CM Panel  │──┼─▶│  REST API       │──┼─▶│  Complaints      │ │
│  │ DM Panel  │  │  │  /api/*         │  │  │  Users           │ │
│  │ Dept Panel│  │  ├─────────────────┤  │  │  Notifications   │ │
│  │ Officer   │  │  │  Socket.io      │  │  │  Escalations     │ │
│  │ Citizen   │  │  │  Real-time      │◀─┼──│  AuditEvents     │ │
│  └───────────┘  │  ├─────────────────┤  │  │  Departments     │ │
│                 │  │  JWT Auth       │  │  │  GovernanceScore │ │
│  Socket.io-     │  │  Role Guards    │  │  │  RiskScores      │ │
│  Client ◀───────┼──│  Cron Jobs      │  │  └──────────────────┘ │
└─────────────────┴──┴─────────────────┴──┴────────────────────── ┘
```

```
├── app/                          # Next.js App Router (Frontend)
│   ├── citizen/                  # Citizen Portal
│   ├── officer/                  # Field Officer Dashboard
│   ├── dashboard/                # Admin Panels (CM, DM, Dept)
│   │   ├── page.js               # Main war room overview
│   │   ├── complaints/           # Complaints list + detail view
│   │   ├── analytics/            # Charts & performance metrics
│   │   ├── critical/             # DEFCON Alerts
│   │   ├── escalated/            # Escalated complaints
│   │   ├── heatmap/              # Delhi district heatmap
│   │   ├── leaderboard/          # District & officer rankings
│   │   ├── officers/             # Officer management
│   │   ├── reports/              # Report generation
│   │   └── settings/             # System settings
│   └── lib/
│       └── api.js                # Centralized API client
│
├── backend/
│   └── src/
│       ├── controllers/          # Business logic handlers
│       ├── models/               # Mongoose schemas
│       ├── routes/               # Express route definitions
│       ├── middleware/           # Auth, role guards
│       ├── socket/               # Socket.io event handlers
│       ├── jobs/                 # Cron jobs (SLA, analytics)
│       ├── services/             # Notification service
│       └── data/seed/            # Database seed scripts
```

---

## 👥 Role-Based Portal Guide

VAANI implements a **strict 5-tier role hierarchy** with data isolation at every level.

---

### 👤 Citizen Portal

> **Who:** General public of Delhi  
> **Access URL:** `/citizen`

<!-- SCREENSHOT PLACEHOLDER -->
```
📌 Add screenshot: docs/screenshots/citizen_portal.png
   Show: Complaint filing form with category picker and image upload
```

**Features:**
- 🌐 **Bilingual Filing** — Submit grievances in English or Hindi
- 📷 **Photo Upload** — Attach photos of problems directly from device
- 🔍 **Duplicate Detection** — System warns if similar complaint exists in your area
- 📡 **Live Status Tracking** — Real-time status updates with full timeline history
- 🔔 **Push Notifications** — Notified when officer initiates closure, resolves, or DM verifies
- ⭐ **Rating System** — Rate resolution quality (1–5 stars) to trigger final complaint closure
- 🔒 **OTP Authentication** — Secure mobile number + OTP login (no passwords needed)

**Complaint Filing Flow:**
```
Select Category → Choose District/Area → Describe Problem → Upload Photo
→ System checks duplicates → Submit → Receive Grievance ID
```

**Closure Notification Flow:**
```
Officer marks "Initiate Closure" → Citizen receives notification
→ Citizen verifies resolution → Provides star rating
→ Complaint status changes to CLOSED
```

---

### 👷 Field Officer Dashboard

> **Who:** SDMs, Junior Engineers, Field Staff  
> **Access URL:** `/officer`  
> **Data Scope:** Only assigned complaints

<!-- SCREENSHOT PLACEHOLDER -->
```
📌 Add screenshot: docs/screenshots/officer_dashboard.png
   Show: Task queue with DEFCON priority badges and scorecard banner
```

**Features:**
- 📋 **Personal Task Queue** — All complaints assigned specifically to this officer
- 🎯 **DEFCON Priority Badges** — Visual priority levels (DEFCON 1–5) for each task
- 📊 **Performance Scorecard** — Real-time resolution rate, credibility score, SLA compliance
- ✅ **Resolve Complaints** — Upload resolution photo + GPS-tagged proof, add notes
- 📁 **Add Notes** — Add work-in-progress notes visible to all hierarchy levels
- 🔒 **Initiate Closure** — Trigger the multi-step closure verification workflow

**Officer Closure Workflow:**
```
Officer uploads resolution proof
  → Officer clicks "Initiate Closure"
    → Department Manager verifies
      → District Magistrate verifies
        → Citizen gets notified to rate
          → Citizen rates → CLOSED ✓
```

---

### 🏢 Department Manager Panel

> **Who:** Department heads (MCD, DJB, PWD, BSES, etc.)  
> **Access URL:** `/dashboard`  
> **Data Scope:** Only complaints belonging to their department

<!-- SCREENSHOT PLACEHOLDER -->
```
📌 Add screenshot: docs/screenshots/dept_panel.png
   Show: Department-filtered complaints list and department KPIs
```

**Features:**
- 🔒 **Department-Isolated View** — Managers ONLY see complaints assigned to their department
- 📊 **Department KPIs** — Total, resolved, pending, breach rate for their department only
- ✅ **Dept Verification** — Second-step verification in the closure workflow
- 🔀 **Reassign Within Dept** — Move complaints to different officers within department
- 📝 **Add Notes** — Annotate complaints with department-level remarks
- 🚨 **SLA Monitoring** — Track and alert on SLA breaches within department

**Departments in System:**

| # | Department | Code | Helpline | Categories |
|---|-----------|------|----------|-----------|
| 1 | Municipal Corporation of Delhi | MCD | 155305 | Sanitation, Garbage, Encroachment, Parks, Stray Dogs, Open Manholes |
| 2 | Delhi Jal Board | DJB | 1916 | Water Supply, Sewage, Drainage, Pipeline |
| 3 | Public Works Department | PWD | 1908 | Roads, Potholes, Flyovers, Bridges, Footpaths |
| 4 | BSES Electricity | BSES | 19123 | Electricity, Power Outage, Transformer, Street Lights |
| 5 | New Delhi Municipal Council | NDMC | 1533 | Sanitation, Water, Roads, Electricity (New Delhi only) |
| 6 | Delhi Development Authority | DDA | 1800110332 | Land, Housing, Park Maintenance, Encroachment |
| 7 | Delhi Transport Corporation | DTC | 1800118181 | Bus Service, Bus Stops, Conductor Behavior |
| 8 | Delhi Police | DP | 112 | Safety, Traffic, Patrolling, Noise Pollution |
| 9 | Delhi Fire Service | DFS | 101 | Fire Safety, NOC, Emergency |
| 10 | Delhi Pollution Control Committee | DPCC | 01123869286 | Air/Water/Noise Pollution, Industrial Waste |
| 11 | Delhi Urban Shelter Improvement Board | DUSIB | 01123378832 | Slum Rehab, Night Shelters, Toilet Complexes |
| 12 | Chief Minister's Office | CMO | 1031 | General, Multi-Department |

<!-- DEPARTMENT SCREENSHOT PLACEHOLDER -->
```
📌 Add department-wise screenshots here:
   docs/screenshots/dept_mcd.png  — MCD Manager panel
   docs/screenshots/dept_djb.png  — DJB Manager panel
   docs/screenshots/dept_pwd.png  — PWD Manager panel
   docs/screenshots/dept_bses.png — BSES Manager panel
```

---

### 🏗️ District Magistrate Panel

> **Who:** District Magistrates of all 11 Delhi districts  
> **Access URL:** `/dashboard`  
> **Data Scope:** Only complaints within their district

<!-- SCREENSHOT PLACEHOLDER -->
```
📌 Add screenshot: docs/screenshots/dm_panel.png
   Show: District-filtered complaints with DM verification button
```

**Features:**
- 🗺️ **District-Isolated View** — DMs ONLY see complaints within their assigned district
- ✅ **DM Verification** — Third-step verification in the multi-level closure workflow
- ⏱️ **Extend SLA** — Ability to grant additional resolution time for complex complaints
- 🚨 **DEFCON Monitoring** — View and track critical/DEFCON-level complaints in district
- 📊 **District Analytics** — Performance metrics specific to their district
- 🔀 **Reassign** — Reassign complaints to different officers or departments
- 📈 **Escalation View** — Track escalated complaints requiring urgent attention

**Delhi Districts Covered:**

| District | District | District |
|---------|---------|---------|
| Central | East | New Delhi |
| North | North East | North West |
| Shahdara | South | South East |
| South West | West | — |

<!-- DM PANEL SCREENSHOT PLACEHOLDER -->
```
📌 Add district-wise panel screenshots:
   docs/screenshots/dm_central.png   — Central District DM panel
   docs/screenshots/dm_south.png     — South District DM panel
```

---

### 🔴 Chief Minister War Room

> **Who:** CM, CMO Staff, Super Admin  
> **Access URL:** `/dashboard`  
> **Data Scope:** All complaints across all districts and departments

<!-- SCREENSHOT PLACEHOLDER -->
```
📌 Add screenshot: docs/screenshots/cm_dashboard.png
   Show: Real-time KPI counters, DEFCON panel, and analytics charts
```

**Features:**
- 📡 **Real-Time War Room** — Live counters: Active, Resolved, Critical, Escalated
- 🚨 **DEFCON Alert System** — Highest-priority alerts for life-threatening issues
- 🗺️ **Delhi Heatmap** — SVG-based district map colored by complaint density
- 📊 **Advanced Analytics** — Monthly trends, department performance, district comparison
- 🏆 **Performance Leaderboard** — District and officer rankings by resolution metrics
- 📋 **Full Complaints Access** — Browse, filter, search ALL complaints statewide
- 🚩 **CM Directive** — Issue direct orders on any complaint (CM/Super Admin only)
- ⏱️ **SLA Extension** — Override resolution deadlines (CM and DM only)
- 📄 **Report Generation** — Download CSV reports with complaint statistics
- 🌐 **Bilingual Interface** — Toggle between English and Hindi system-wide

---

## 📊 Departments & SLA Matrix

> SLA = Service Level Agreement. Breach triggers automatic escalation.

| Department | DEFCON/Critical | High Priority | Standard | Low |
|-----------|----------------|--------------|----------|-----|
| MCD | 4 hours | 24 hours | 7 days | 14 days |
| DJB | 4 hours | 24 hours | 7 days | 14 days |
| PWD | 4 hours | 24 hours | 7 days | 14 days |
| BSES | 2 hours | 12 hours | 3 days | 7 days |
| NDMC | 2 hours | 12 hours | 3 days | 7 days |
| DDA | 8 hours | 48 hours | 10 days | 21 days |
| DTC | 4 hours | 24 hours | 5 days | 10 days |
| Delhi Police | 1 hour | 6 hours | 2 days | 5 days |
| Delhi Fire Service | 1 hour | 4 hours | 1 day | 3 days |
| DPCC | 4 hours | 24 hours | 7 days | 14 days |
| DUSIB | 4 hours | 24 hours | 7 days | 14 days |
| CMO | 1 hour | 4 hours | 1 day | 3 days |

---

## 🛠️ Technology Stack

### Frontend
| Technology | Version | Purpose |
|-----------|---------|---------|
| **Next.js** | 16.2.9 | React framework with App Router |
| **React** | 19.2.4 | UI component library |
| **Socket.io-client** | 4.8.3 | Real-time WebSocket connection |
| **Vanilla CSS** | — | Custom design system, dark mode, animations |

### Backend
| Technology | Version | Purpose |
|-----------|---------|---------|
| **Node.js** | 18+ | JavaScript runtime |
| **Express** | 4.21 | REST API framework |
| **MongoDB** | — | NoSQL database |
| **Mongoose** | 8.5 | MongoDB ODM |
| **Socket.io** | 4.7.5 | Real-time bidirectional communication |
| **jsonwebtoken** | 9.0 | JWT-based authentication |
| **bcryptjs** | 2.4 | Password hashing |
| **multer** | 1.4.5 | File upload middleware |
| **cloudinary** | 1.41 | Cloud image storage |
| **node-cron** | 3.0 | Scheduled jobs (SLA checks) |
| **bull** | 4.12 | Background job queue |

---

## 🗄️ Database Schema

### Core Models

```
Complaint              Notification           User
─────────────          ────────────           ────
_id                    _id                    _id
grievanceId            userId (ref: User)     name
title                  complaintId            name_hi
description            type                   phone
category               message                role: enum[
status: enum[          isRead                   citizen
  FILED,               createdAt                field_officer
  ASSIGNED,                                     dept_manager
  IN_PROGRESS,         Escalation               dm
  RESOLVED,            ──────────               super_admin
  CLOSED               _id                    ]
]                      complaintId            department
priority: enum[        level                  district
  critical,            reason                 badge
  high,                escalatedBy            credibilityScore
  medium,              resolvedAt             isActive
  low
]                      AuditEvent             GovernanceScore
district               ──────────             ───────────────
department             actor                  district
assignedTo             action                 totalComplaints
timeline[]             target                 resolved
mediaUrls[]            metadata               slaCompliance
slaDeadline            timestamp              avgResolutionHours
slaBreach                                     citizenSatisfaction
rating
ratingText
cmFlagged
cmDirective
```

---

## ⚡ Real-Time Features

VAANI uses **Socket.io** for instant updates across all connected clients.

### Socket Events

| Event | Trigger | Recipients |
|-------|---------|-----------|
| `complaint:updated` | Any status change | All dashboard panels |
| `complaint:new` | New complaint filed | CM, DM (district), Dept Manager |
| `notification:new` | Closure initiated | Citizen who filed complaint |
| `defcon:alert` | Critical complaint filed | CM War Room |
| `sla:breach` | SLA deadline crossed | Assigned officer, DM, CM |

### Real-Time Update Flow
```
Backend Controller → Socket.io Emit → All Connected Clients Auto-Refresh
     ↓
  MongoDB save
     ↓
  notifyComplaintUpdate(complaintId)  ←── triggers socket broadcast
```

---

## 🔄 Complaint Lifecycle

```
FILED ──→ ASSIGNED ──→ IN_PROGRESS ──→ RESOLVED ──→ CLOSED
  │                                        │
  │                              ┌─────────┘
  │                              │  Multi-step Closure Flow:
  │                              │  1. Field Officer → Initiate Closure
  └──→ DEFCON/ESCALATED ──→ ────┘  2. Citizen gets notified
                                    3. Dept Manager verifies
                                    4. DM verifies
                                    5. Citizen rates (⭐ 1-5)
                                    6. Status → CLOSED ✓

Timeline recorded at every step with actor name, role, and timestamp.
```

### Closure Verification Chain

```
Field Officer                 Department Manager            District Magistrate          Citizen
─────────────                 ──────────────────            ──────────────────           ───────
Upload Resolution Proof  →    Review & Verify          →   Final Verify             →   Receive Notification
Click "Initiate Closure"      Click "Dept Verify"           Click "DM Verify"            Rate Resolution (⭐)
Timeline: "Officer            Timeline: "Dept Verified"     Timeline: "DM Verified"      Timeline: "Citizen Rated"
  Initiation"                                                                             Status → CLOSED
```

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** v18 or higher
- **MongoDB** (local instance or MongoDB Atlas cloud)
- **Git**

---

### 1. Clone the Repository

```bash
git clone https://github.com/YOUR_USERNAME/vaani.git
cd vaani
```

---

### 2. Backend Setup

```bash
# Navigate to backend
cd backend

# Install dependencies
npm install

# Create environment file
cp .env.example .env
```

Edit `backend/.env`:
```env
PORT=5001
MONGODB_URI=mongodb://localhost:27017/vaani
JWT_SECRET=your-super-secret-jwt-key-change-in-production
REFRESH_TOKEN_SECRET=your-refresh-token-secret-change-in-production
DEMO_MODE=true

# Optional: Cloudinary (for image uploads)
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

```bash
# Seed the database with demo data (departments, districts, users, sample complaints)
npm run seed

# Start backend server
npm run dev
```

> Backend will run at **http://localhost:5001**

---

### 3. Frontend Setup

```bash
# From project root
cd ..

# Install frontend dependencies
npm install
```

Create `.env.local` in root:
```env
NEXT_PUBLIC_API_URL=http://localhost:5001/api
NEXT_PUBLIC_SOCKET_URL=http://localhost:5001
NEXT_PUBLIC_DEMO_MODE=true
```

```bash
# Start Next.js development server
npm run dev
```

> Frontend will run at **http://localhost:3000**

---

## 🔑 Demo Access Profiles

Use **OTP: `123456`** for all demo accounts, or click the **Quick Demo Access** buttons on the login page.

| Role | Name | Phone | Access Scope |
|------|------|-------|-------------|
| 🔴 **Chief Minister** | CM Delhi | `+91 9999000001` | All districts, all departments |
| 🏗️ **DM Central** | DM Central District | `+91 9999000003` | Central District only |
| 🏢 **MCD Manager** | Dept Manager MCD | `+91 9999000004` | MCD department only |
| 👷 **Field Officer** | SDM Ramesh Kumar | `+91 9999000005` | Assigned complaints only |
| 👤 **Citizen** | Rajesh Kumar | `+91 9800000020` | Own complaints only |

---

## 🌐 Deployment Guide

### Option 1: Vercel + Railway (Recommended)

This is the easiest zero-config deployment option.

#### Deploy Backend to Railway

1. Go to [railway.app](https://railway.app) and sign in with GitHub
2. Click **"New Project"** → **"Deploy from GitHub repo"**
3. Select your repository and choose the `backend/` folder
4. Add environment variables in Railway dashboard:
   ```
   PORT=5001
   MONGODB_URI=<your-mongodb-atlas-uri>
   JWT_SECRET=<strong-random-secret>
   REFRESH_TOKEN_SECRET=<strong-random-secret>
   DEMO_MODE=true
   ```
5. Copy the **Railway deployment URL** (e.g., `https://vaani-backend.up.railway.app`)

#### Set Up MongoDB Atlas

1. Go to [mongodb.com/atlas](https://mongodb.com/atlas) and create a free cluster
2. Create a database user and whitelist `0.0.0.0/0` (all IPs) for Railway access
3. Copy the connection string: `mongodb+srv://user:pass@cluster.mongodb.net/vaani`
4. Set it as `MONGODB_URI` in Railway

#### Deploy Frontend to Vercel (with Subdomains)

1. Go to [vercel.com](https://vercel.com) and sign in with GitHub.
2. Click **"Add New Project"** and import your repository.
3. Set **Root Directory** to `/` (the Next.js root).
4. Add the following environment variables:
   ```env
   NEXT_PUBLIC_API_URL=https://vaani-backend.up.railway.app/api
   NEXT_PUBLIC_SOCKET_URL=https://vaani-backend.up.railway.app
   NEXT_PUBLIC_DEMO_MODE=true
   ```
5. Click **Deploy**.
6. **Configure Custom Subdomains**:
   - Go to your Project dashboard in Vercel.
   - Navigate to **Settings** ➔ **Domains**.
   - Add your main custom domain, e.g., `vaani.site`.
   - Add a wildcard domain entry: `*.vaani.site` (this enables dynamic subdomains like `citizen.vaani.site`, `cm.vaani.site`, `officer.vaani.site`, etc.).
7. **DNS Configuration**:
   In your domain registrar's DNS panel, add the following records:
   - **A Record**: Host `@` pointing to `76.76.21.21` (Vercel IP).
   - **CNAME Record**: Host `www` pointing to `cname.vercel-dns.com`.
   - **CNAME Record**: Host `*` pointing to `cname.vercel-dns.com` (for wildcard routing).

#### Seed Production Database

After deploying backend, run the seed script once:
```bash
# Set MONGODB_URI to your Atlas URI locally, then:
cd backend
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/vaani npm run seed
```

---

### Option 2: Self-Hosted VPS (DigitalOcean / AWS EC2)

#### Server Requirements
- Ubuntu 22.04 LTS
- 2 GB RAM minimum
- Node.js 18+, MongoDB, Nginx, PM2

```bash
# Install dependencies
sudo apt update && sudo apt install -y nodejs npm nginx

# Install PM2 globally
sudo npm install -g pm2

# Clone repo
git clone https://github.com/YOUR_USERNAME/vaani.git
cd vaani

# Setup backend
cd backend && npm install
echo "PORT=5001
MONGODB_URI=mongodb://localhost:27017/vaani
JWT_SECRET=your-secret
REFRESH_TOKEN_SECRET=your-refresh-secret
DEMO_MODE=true" > .env
npm run seed

# Start backend with PM2
pm2 start src/server.js --name vaani-backend
pm2 save && pm2 startup

# Setup frontend
cd .. && npm install
echo "NEXT_PUBLIC_API_URL=https://your-domain.com/api
NEXT_PUBLIC_SOCKET_URL=https://your-domain.com" > .env.local
npm run build

# Start frontend with PM2
pm2 start npm --name vaani-frontend -- start
```

#### Nginx Config (`/etc/nginx/sites-available/vaani`)

```nginx
server {
    listen 80;
    server_name your-domain.com;

    # Frontend (Next.js)
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    # Backend API
    location /api {
        proxy_pass http://localhost:5001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    # Socket.io
    location /socket.io {
        proxy_pass http://localhost:5001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
    }
}
```

```bash
sudo ln -s /etc/nginx/sites-available/vaani /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx

# Setup HTTPS with Certbot
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com
```

---

### Option 3: Docker Compose

```yaml
# docker-compose.yml
version: '3.8'

services:
  mongodb:
    image: mongo:7
    volumes:
      - mongo_data:/data/db
    environment:
      MONGO_INITDB_DATABASE: vaani

  backend:
    build: ./backend
    ports:
      - "5001:5001"
    environment:
      PORT: 5001
      MONGODB_URI: mongodb://mongodb:27017/vaani
      JWT_SECRET: your-jwt-secret
      REFRESH_TOKEN_SECRET: your-refresh-secret
      DEMO_MODE: "true"
    depends_on:
      - mongodb

  frontend:
    build: .
    ports:
      - "3000:3000"
    environment:
      NEXT_PUBLIC_API_URL: http://backend:5001/api
      NEXT_PUBLIC_SOCKET_URL: http://backend:5001
    depends_on:
      - backend

volumes:
  mongo_data:
```

```bash
docker-compose up -d
docker-compose exec backend npm run seed  # seed database
```

## 🧪 Testing & Verification

VAANI is optimized and audited for production deployment across all screen resolutions and multi-tenant subdomains.

### 📱 Responsive Targets
The application layout dynamically scales without text overlaps, clipped buttons, or horizontal scrolls on the following resolutions:
1. **Mobile**: `360x640`, `375x667`, `390x844`, `412x915`
2. **Tablet**: `768x1024`, `820x1180`, `1024x1366`
3. **Laptop**: `1366x768`, `1440x900`
4. **Desktop & Ultra-Wide**: `1920x1080`, `2560x1440`

### 💻 Local Subdomain testing
To test the dynamic role-based subdomains locally:
1. Edit your system `/etc/hosts` file:
   ```bash
   sudo nano /etc/hosts
   ```
2. Add the loopback mappings:
   ```etc
   127.0.0.1  vaani.local
   127.0.0.1  citizen.vaani.local
   127.0.0.1  officer.vaani.local
   127.0.0.1  cm.vaani.local
   ```
3. Run the Next.js local server on port 3000:
   ```bash
   npm run dev
   ```
4. Access `http://citizen.vaani.local:3000` or `http://cm.vaani.local:3000` to verify auto-detection middleware in action.

### ⚙️ Verification Checks
* **Next.js Production Compilation**: Validate frontend builds cleanly:
  ```bash
  npm run build
  ```
* **No Horizontal Scrolling**: The main wrapper (`.app-layout` and `.app-main`) enforces `max-width: 100vw; overflow-x: hidden;` to ensure it fits the viewport precisely.
* **Scrollable Data Tables**: Tabular data cells are wrapped in overflow scroll elements to support horizontal swipes on smaller mobile displays.
* **Full-Screen Mobile Modals**: Dialog screens automatically resize to full width/height on screens `<480px` with vertical body scrolling, keeping confirmation buttons visible.
* **Adaptive Accountability Podium**: Gold/Silver/Bronze leaderboard listings automatically stack vertically into horizontal rows under `580px` screen widths to prevent text cropping.

---

## 🔧 Environment Variables Reference

### Backend (`backend/.env`)

| Variable | Required | Default | Description |
|---------|----------|---------|-------------|
| `PORT` | ✅ | `5001` | Server port |
| `MONGODB_URI` | ✅ | — | MongoDB connection string |
| `JWT_SECRET` | ✅ | — | JWT signing key (use strong random string) |
| `REFRESH_TOKEN_SECRET` | ✅ | — | Refresh token signing key |
| `DEMO_MODE` | ⬜ | `false` | Enables OTP bypass (use `123456`) |
| `CLOUDINARY_CLOUD_NAME` | ⬜ | — | Cloudinary cloud name (image uploads) |
| `CLOUDINARY_API_KEY` | ⬜ | — | Cloudinary API key |
| `CLOUDINARY_API_SECRET` | ⬜ | — | Cloudinary API secret |

### Frontend (`.env.local`)

| Variable | Required | Default | Description |
|---------|----------|---------|-------------|
| `NEXT_PUBLIC_API_URL` | ✅ | — | Backend REST API base URL |
| `NEXT_PUBLIC_SOCKET_URL` | ✅ | — | Backend Socket.io URL |
| `NEXT_PUBLIC_DEMO_MODE` | ⬜ | `false` | Shows demo login buttons |

---

## 📡 API Reference

### Authentication
```
POST /api/auth/send-otp        Send OTP to phone number
POST /api/auth/verify-otp      Verify OTP & receive JWT tokens
POST /api/auth/refresh         Refresh access token
POST /api/auth/logout          Invalidate token
```

### Complaints
```
GET    /api/complaints                List complaints (role-filtered)
POST   /api/complaints                File new complaint (citizen)
GET    /api/complaints/:id            Get complaint details
PUT    /api/complaints/:id/assign     Assign to officer
PUT    /api/complaints/:id/resolve    Field officer resolve
PUT    /api/complaints/:id/dept-verify   Dept manager verify
PUT    /api/complaints/:id/dm-verify     DM verify
POST   /api/complaints/:id/timeline  Add note to timeline
PUT    /api/complaints/:id/rate       Citizen rate & close
PUT    /api/complaints/:id/extend-sla  Extend SLA deadline
PUT    /api/complaints/:id/reassign   Reassign complaint
PUT    /api/complaints/:id/cm-flag    CM flag complaint
PUT    /api/complaints/:id/cm-directive  CM directive
POST   /api/complaints/duplicate-check  Check for duplicates
```

### Dashboard & Analytics
```
GET /api/dashboard/kpis           Main KPI counters
GET /api/dashboard/recent         Recent complaints feed
GET /api/dashboard/defcon         DEFCON alert list
GET /api/analytics/detailed       Full analytics aggregation
GET /api/analytics/leaderboard    District & officer rankings
GET /api/analytics/heatmap        District complaint density
```

### Officers & Users
```
GET /api/officers                 List field officers
GET /api/users/me                 Current user profile
GET /api/notifications            User notifications
PUT /api/notifications/:id/read   Mark notification read
```

---

## 🤝 Contributing

We welcome contributions! Please follow these steps:

1. **Fork** the repository
2. **Create** a feature branch: `git checkout -b feature/amazing-feature`
3. **Commit** your changes: `git commit -m 'Add amazing feature'`
4. **Push** to the branch: `git push origin feature/amazing-feature`
5. **Open** a Pull Request

### Code Standards
- Use ES6+ syntax
- Follow existing naming conventions
- Add JSDoc comments for new API endpoints
- Test all role-based access scenarios before submitting

---

## 📜 License

This project is licensed under the **MIT License** — see the [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgements

- Government of NCT of Delhi for the grievance management framework
- Next.js, MongoDB, and Socket.io open source communities
- All contributors and beta testers

---

<div align="center">

**Built with ❤️ for the citizens of Delhi**

*VAANI — जनता की आवाज़, सरकार का जवाब*
*(The voice of the people, the response of the government)*

⭐ **If this project helped you, please give it a star!** ⭐

</div>
