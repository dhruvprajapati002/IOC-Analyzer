# IOC Analyzer - Component to Page Card Mapping

## Overview
This document details which card components are used on which pages with their functionality and data requirements.

---

## 📊 ANALYZE PAGE (`/src/app/analyze/page.tsx`)

### 1. **ThreatSearchForm Component**
- **Location**: `src/components/Analyze/ThreatSearchForm.tsx`
- **Position**: Header section
- **Purpose**: Input form for users to submit IOCs (hashes, IPs, domains)
- **Props**:
  - `onSubmit`: Callback function to process IOC analysis
  - `isSubmitting`: Loading state flag
  - `validateIOCs`: Validation function for IOC format checking
- **Features**: Multi-line text input with drag-drop support, IOC validation

---

### 2. **ThreatOverviewCard Component**
- **Location**: `src/components/Analyze/ThreatOverviewCard.tsx`
- **Position**: Main section below search form
- **Layout**: 2 columns on large screens (Takes 2/3 width on XL screens)
- **Purpose**: Displays high-level threat analysis results with visualization
- **Props**:
  - `threatOverview`: ThreatOverviewResult object with analysis data
  - `overviewLoading`: Loading state for async operations
  - `pieChartData`: Pie chart visualization data
- **Displays**:
  - IOC analysis counts (malicious, suspicious, clean)
  - Detection engine statistics
  - Threat breakdown pie chart
  - Threat detection summary

---

### 3. **Popular Threat Label Card** (Inline Card)
- **Position**: Right sidebar (1 column on XL screens)
- **Purpose**: Displays the most commonly identified threat signature
- **Displays**:
  - Alert icon with threat label
  - "CONFIRMED THREAT" badge
  - Threat classification
- **Condition**: Only shown if `vtIntelligence?.popular_threat_label` exists

---

### 4. **IPReputationCard Component**
- **Location**: `src/components/Analyze/IPReputationCard.tsx`
- **Position**: Full-width below threat overview
- **Purpose**: Shows reputation data for analyzed IP addresses
- **Props**:
  - `ipReputation`: Array of IP reputation objects with scores, geolocation, threat data
- **Displays**:
  - IP addresses with risk scores
  - Geolocation information
  - Threat categories and tags
  - Risk level indicators
- **Condition**: Only rendered if `threatOverview.ipReputation` exists

---

### 5. **DetectionNamesCard Component**
- **Location**: `src/components/Analyze/DetectionNamesCard.tsx`
- **Position**: Full-width, below IP reputation
- **Purpose**: Lists all security vendor detections
- **Props**:
  - `detections`: Array of detection objects from security vendors
- **Displays**:
  - Engine names (AntiVirus vendors)
  - Detection categories
  - Detection results/names
- **Condition**: Only shown if `threatOverview.detections` array has items

---

### 6. **ThreatIntelligenceCards Component**
- **Location**: `src/components/Analyze/ThreatIntelligenceCards.tsx`
- **Position**: Full-width, after detections
- **Purpose**: Advanced threat intelligence from VirusTotal
- **Props**:
  - `vtData`: VT intelligence object with threat categories, family labels, MITRE ATT&CK data
  - `threatOverview`: Overview data for context
- **Sub-cards**:
  - **Family Labels Card**: Shows malware families (Trojan.Win32, etc.)
  - **Threat Categories Card**: Lists detected threat types (Backdoor, Botnet, Spyware)
  - **MITRE ATT&CK Card**: Shows attack tactics and techniques
  - **Code Insights Card**: Behavioral and code-level analysis
- **Condition**: Only rendered if `vtIntelligence` object exists

---

### 7. **FileInformationCard Component**
- **Location**: `src/components/Analyze/FileInformationCard.tsx`
- **Position**: Left column in 2-column grid, below threat intelligence
- **Purpose**: File metadata and hash information
- **Props**:
  - `fileInfo`: File details object with name, size, type, hashes, timestamps
- **Displays**:
  - File name
  - File size
  - File type
  - MD5, SHA1, SHA256 hashes
  - First seen date
  - Last analysis date
  - Upload date
- **Condition**: Only shown if `fileInformation` exists

---

### 8. **BehaviorAnalysisCard Component**
- **Location**: `src/components/Analyze/BehaviorAnalysisCard.tsx`
- **Position**: Right column in 2-column grid (paired with FileInformationCard)
- **Purpose**: Sandbox behavioral analysis results
- **Props**:
  - `sandboxData`: Sandbox analysis object with behavior metrics
- **Displays**:
  - File creation activities
  - Registry modifications
  - Network communications
  - Process injections
  - Service installations
  - Severity indicators for each behavior
- **Condition**: Only shown if `sandboxData` exists

---

## 📄 FILE ANALYSIS PAGE (`/src/app/file-analysis/page.tsx`)

### Stats Section Cards (Top)
Four information cards displaying file analysis statistics:

1. **Total Files Card**
   - Icon: FileText (Blue)
   - Data: `stats.totalFilesAnalyzed`
   - Shows total files analyzed

2. **Total Detections Card**
   - Icon: Shield (Red)
   - Data: `stats.totalDetections`
   - Shows cumulative detections

3. **Detection Rate Card**
   - Icon: CheckCircle (Green)
   - Data: `stats.detectionRate`
   - Shows percentage of detected vs clean files

4. **Avg Analysis Time Card**
   - Icon: Zap (Purple)
   - Data: `stats.avgAnalysisTime`
   - Shows average analysis duration in seconds

---

### Upload Section Card
- **Title**: "Upload File for Analysis"
- **Features**:
  - Drag-and-drop zone
  - File click upload
  - Progress bar during upload
  - Format: PNG, JPG, PDF, ZIP, EXE, DLL

---

### Analysis Results Card
- **Condition**: Shown when `analysisResult` exists
- **Displays**:
  - File information grid
  - Verdict badge (Malicious/Suspicious/Clean/Unknown)
  - Detections count
  - File hash values
  - Metadata (strings, imports, sections)
  - Heuristic analysis results
  - Behavioral analysis data

---

### Detailed Analysis Results Cards (if results exist)

1. **File Verdict Card**
   - Risk score circular progress
   - Verdict badge with color coding

2. **File Metadata Grid**
   - File name, size, type
   - Creation/modification dates
   - File hashes (MD5, SHA1, SHA256)

3. **Security Vendors Analysis**
   - Vendor-by-vendor detection results
   - Detection categories
   - Detection names

---

## 🌐 GRAPH PAGE (`/src/app/graph/page.tsx`)

### Graph Visualization Components

1. **ForceGraph Component** (re-exports D3ForceGraph)
   - **Location**: `src/app/graph/components/ForceGraph.tsx`
   - **Actual Component**: `src/app/graph/components/D3ForceGraph.tsx`
   - **Purpose**: D3.js force-directed graph visualization
   - **Features**:
     - Animated force simulation
     - Draggable nodes
     - Zoom/Pan controls
     - Node color coding by verdict
     - Circular node design (radius=12px)
     - Edge arrows for relationships

---

### VTGraphFlow Component
- **Location**: `src/app/graph/components/VTGraphFlow.tsx`
- **Purpose**: VirusTotal graph mode display
- **Features**:
  - Displays VT API relationship data
  - Node relationships visualization
  - Threat level indicators

---

## 🕸️ NETWORK GRAPH PAGE (`/src/app/network-graph/page.tsx`)

### Network Visualization Card
- **Purpose**: IOC network relationship visualization
- **Features**:
  - Nodes for different IOC types (hash, IP, domain)
  - Node color coding by verdict/type
  - Interactive zoom/pan
  - Selected node highlighting
  - Tooltip on hover

---

### Filter & Controls Section
- **Verdict Filter**: Filter nodes by verdict type
- **IOC Type Filter**: Filter by IOC type (IP, domain, hash)
- **Reset Button**: Clear all filters and selections

---

## 📈 DASHBOARD PAGE (`/src/app/dashboard/page.tsx`)

### Quick Action Cards
Three linked cards with icons and descriptions:

1. **Analyze IOCs Card**
   - Icon: Search
   - Link: `/analyze`
   - Purpose: Navigate to IOC analysis

2. **Threat Hunting Card**
   - Icon: Network
   - Link: `/dashboard/threat-hunting`
   - Purpose: Threat hunting dashboard

3. **Reports & Analytics Card**
   - Icon: BarChart3
   - Link: `/dashboard/graph-analysis`
   - Purpose: Analytics and reports

---

## 🔍 COMPONENT SUMMARY TABLE

| Component | File Path | Page Used | Purpose | Key Props |
|-----------|-----------|-----------|---------|-----------|
| ThreatSearchForm | `Analyze/ThreatSearchForm.tsx` | /analyze | IOC input form | onSubmit, isSubmitting |
| ThreatOverviewCard | `Analyze/ThreatOverviewCard.tsx` | /analyze | Main analysis results | threatOverview, pieChartData |
| IPReputationCard | `Analyze/IPReputationCard.tsx` | /analyze | IP reputation data | ipReputation |
| DetectionNamesCard | `Analyze/DetectionNamesCard.tsx` | /analyze | Vendor detections | detections |
| ThreatIntelligenceCards | `Analyze/ThreatIntelligenceCards.tsx` | /analyze | Advanced threat intel | vtData, threatOverview |
| FileInformationCard | `Analyze/FileInformationCard.tsx` | /analyze | File metadata | fileInfo |
| BehaviorAnalysisCard | `Analyze/BehaviorAnalysisCard.tsx` | /analyze | Sandbox behavior | sandboxData |
| ThreatPostureCards | `Analyze/ThreatPostureCards.tsx` | Custom | Threat posture summary | threatPosture, threatOverview |
| D3ForceGraph | `graph/components/D3ForceGraph.tsx` | /graph | Force-directed graph | data, onNodeClick |
| VTGraphFlow | `graph/components/VTGraphFlow.tsx` | /graph | VT graph display | Depends on state |
| CinematicPieChart | `Analyze/CinematicPieChart.tsx` | /analyze | Pie chart visualization | data |
| ThreatTrendsCard | `Analyze/ThreatTrendsCard.tsx` | Unused | Trend display | (Unused) |
| ThreatVectorGrid | `Analyze/ThreatVectorGrid.tsx` | Unused | Vector grid display | (Unused) |

---

## 📋 DATA FLOW

### Analyze Page Data Flow:
```
User Input (IOCs)
    ↓
ThreatSearchForm (onSubmit)
    ↓
API Call (/api/ioc)
    ↓
Response Processing
    ↓
State Updates:
  - threatOverview
  - vtIntelligence
  - fileInformation
  - sandboxData
  - ipReputationData
    ↓
Component Rendering:
  - ThreatOverviewCard (threatOverview + pieChartData)
  - IPReputationCard (if ipReputation exists)
  - DetectionNamesCard (if detections exist)
  - ThreatIntelligenceCards (if vtIntelligence exists)
  - FileInformationCard (if fileInformation exists)
  - BehaviorAnalysisCard (if sandboxData exists)
```

---

## 🎨 Styling & Colors

### Color Coding System:
- **Malicious**: Red (#ef4444)
- **Suspicious**: Orange (#f97316)
- **Clean/Harmless**: Green (#22c55e)
- **Undetected**: Gray (#6b7280)
- **Info/Stats**: Blue (#3b82f6)
- **Warnings**: Amber (#f59e0b)
- **Emerald**: Green (#10b981)
- **Purple**: Violet (#8b5cf6)
- **Cyan**: Teal (#06b6d4)

---

## 🔗 Component Dependencies

- All Analyze components depend on: `Card`, `CardContent`, `CardHeader`, `CardTitle` (UI)
- Graph components depend on: D3.js library
- Network graph depends on: D3.js library
- All pages wrapped with: `ProtectedPage` component for auth

---

## 📌 Notes

1. **ThreatTrendsCard** and **ThreatVectorGrid** are imported but currently unused
2. Components automatically hide if their required data is missing (conditional rendering)
3. D3ForceGraph uses force simulation with:
   - Link distance: 150px
   - Charge strength: -400
   - Collision radius: nodeSize + 10
4. All components are "use client" components (client-side rendering)
5. Props validation ensures graceful degradation if data is incomplete
