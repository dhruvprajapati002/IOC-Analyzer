# VirusTotal IOC Graph Feature

## Overview

Complete implementation of VirusTotal-style IOC Graph visualization with ReactFlow, supporting FILE/IP/DOMAIN/URL relationship mapping exactly like VirusTotal's Graph Summary.

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Frontend Layer                           │
│  /graph page with VT Graph mode + DB Graph mode             │
│  - ReactFlow visualization (radial layout)                   │
│  - IOC selector dropdown (from history)                      │
│  - Custom nodes (root + summary circles)                     │
│  - Dark theme (#1e293b, #6366f1)                            │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                      API Layer                               │
│  GET /api/ioc/graph?value=<ioc>                             │
│  - Validates IOC type (hash/ip/domain/url)                  │
│  - Calls VT API v3 relationships                            │
│  - Normalizes to graph format                               │
│  - Returns nodes/edges + metadata                           │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                  VirusTotal API v3                           │
│  - /files/{hash}/execution_parents                          │
│  - /files/{hash}/dropped_files                              │
│  - /files/{hash}/contacted_ips                              │
│  - /files/{hash}/contacted_domains                          │
│  - /domains/{domain}/communicating_files                    │
│  - /domains/{domain}/resolutions                            │
│  - /ip_addresses/{ip}/communicating_files                   │
│  - ... and 20+ other relationship endpoints                 │
└─────────────────────────────────────────────────────────────┘
```

## Features

### ✅ Implemented

1. **Backend API** (`/api/ioc/graph`)
   - Automatic IOC type detection (MD5/SHA1/SHA256 → file, IPv4 → ip, domain, URL)
   - Fetches ALL VT relationship types (10+ for files, 8+ for domains, 7+ for IPs)
   - Normalizes raw VT responses to clean graph structure
   - Error handling for missing/404 responses
   - Returns empty arrays when no data (never undefined)

2. **Frontend Visualization** (ReactFlow)
   - **Root Node**: Large card with IOC value + type icon + total relationship count
   - **Summary Nodes**: Circular nodes showing "10+" for counts > 10
   - **Radial Layout**: Evenly distributed around center using `radialPosition()`
   - **Interactive**: Hover to see sample items, drag nodes, zoom/pan
   - **Dark Theme**: Matches VT aesthetic (#1e293b, #6366f1, #475569)

3. **IOC Selection**
   - Dropdown populated from recent analysis history
   - Select any previous IOC to view its graph
   - Displays current IOC with type badge

4. **View Modes**
   - **VT Graph**: VirusTotal relationship graph
   - **DB Graph**: Database IOC graph (existing feature)
   - Toggle between modes seamlessly

## API Endpoints

### GET /api/ioc/graph?value={ioc}

**Request:**
```bash
GET /api/ioc/graph?value=84c82835a5d21bbcf75a61707d8bd3fd1f46b8490fe95edc05fae5e23f4188ab
Authorization: Bearer <token>
```

**Response:**
```json
{
  "root": {
    "id": "root",
    "label": "84c82835a5d21bbcf75a61707d8bd3fd1f46b8490fe95edc05fae5e23f4188ab",
    "type": "file",
    "value": "84c82835a5d21bbcf75a61707d8bd3fd1f46b8490fe95edc05fae5e23f4188ab"
  },
  "nodes": [
    {
      "id": "execution_parents",
      "label": "Execution Parents",
      "count": 12,
      "items": ["parent1.exe", "parent2.exe", ...]
    },
    {
      "id": "dropped_files",
      "label": "Dropped Files",
      "count": 45,
      "items": ["file1.dll", "file2.sys", ...]
    },
    {
      "id": "contacted_ips",
      "label": "Contacted IPs",
      "count": 23,
      "items": ["192.168.1.1", "8.8.8.8", ...]
    },
    {
      "id": "contacted_domains",
      "label": "Contacted Domains",
      "count": 34,
      "items": ["malware.com", "c2server.net", ...]
    }
  ],
  "edges": [
    { "source": "root", "target": "execution_parents" },
    { "source": "root", "target": "dropped_files" },
    { "source": "root", "target": "contacted_ips" },
    { "source": "root", "target": "contacted_domains" }
  ],
  "metadata": {
    "totalRelationships": 114,
    "vtLink": "https://www.virustotal.com/gui/file/{hash}/relations",
    "timestamp": "2025-12-02T10:30:00.000Z"
  }
}
```

## Supported Relationship Types

### FILE (Hash)
- ✅ `execution_parents` - Parent processes that executed this file
- ✅ `pe_resource_parents` - PE resources that contain this file
- ✅ `dropped_files` - Files dropped by this malware
- ✅ `contacted_ips` - IP addresses contacted
- ✅ `contacted_domains` - Domains contacted
- ✅ `contacted_urls` - URLs accessed
- ✅ `similar_files` - Similar malware samples
- ✅ `bundled_files` - Files bundled within archive
- ✅ `embedded_domains` - Domains embedded in binary
- ✅ `embedded_ips` - IPs embedded in binary

### DOMAIN
- ✅ `communicating_files` - Files communicating with domain
- ✅ `downloaded_files` - Files downloaded from domain
- ✅ `referrer_files` - Files that reference this domain
- ✅ `resolutions` - DNS resolution history (IPs)
- ✅ `subdomains` - Subdomains discovered
- ✅ `siblings` - Sibling domains (same IP/infrastructure)
- ✅ `urls` - URLs on this domain
- ✅ `related_comments` - Community comments

### IP ADDRESS
- ✅ `communicating_files` - Files communicating with IP
- ✅ `downloaded_files` - Files downloaded from IP
- ✅ `referrer_files` - Files referencing this IP
- ✅ `resolutions` - Reverse DNS (hostnames)
- ✅ `urls` - URLs hosted on IP
- ✅ `historical_whois` - WHOIS history
- ✅ `related_comments` - Community comments

### URL
- ✅ `downloaded_files` - Files downloaded from URL
- ✅ `last_serving_ip_address` - Serving IP addresses
- ✅ `network_location` - Network location metadata
- ✅ `redirecting_urls` - URLs redirecting to this
- ✅ `related_comments` - Community comments

## Usage

### 1. Navigate to Graph Page
```
http://localhost:9000/graph
```

### 2. Select Mode
- Click **"VT Graph"** button for VirusTotal relationship graph
- Click **"DB Graph"** button for database IOC graph

### 3. Select IOC
- Choose IOC from "Select IOC" dropdown (populated from history)
- Graph auto-loads on selection

### 4. Interact with Graph
- **Hover** over summary nodes to see sample items
- **Drag** nodes to reposition
- **Zoom** with mouse wheel
- **Pan** by dragging background
- **Click** "View on VirusTotal" to open VT GUI

## Code Structure

```
src/
├── app/
│   ├── api/
│   │   └── ioc/
│   │       └── graph/
│   │           └── route.ts              # Backend API handler
│   └── graph/
│       ├── page.tsx                      # Main graph page
│       └── components/
│           └── VTGraphFlow.tsx           # ReactFlow graph component
```

### Key Functions

#### Backend (`route.ts`)

```typescript
// Detect IOC type from value
function detectIOCType(value: string): IOCType

// VT API client
class VirusTotalGraphClient {
  async fetchFileRelationships(hash: string): Promise<GraphNode[]>
  async fetchDomainRelationships(domain: string): Promise<GraphNode[]>
  async fetchIPRelationships(ip: string): Promise<GraphNode[]>
  async fetchURLRelationships(urlId: string): Promise<GraphNode[]>
}
```

#### Frontend (`VTGraphFlow.tsx`)

```typescript
// Radial layout positioning
function radialPosition(index: number, total: number, radius: number): { x, y }

// Custom node components
function RootNode({ data }: NodeProps)
function SummaryNode({ data }: NodeProps)

// Main graph component
export default function VTGraphFlow({ graphData, loading }: VTGraphFlowProps)
```

## Error Handling

### Backend
- ✅ Returns 200 with empty graph if VT API fails
- ✅ Handles 404 gracefully (IOC not in VT database)
- ✅ Promise.allSettled for parallel relationship fetches
- ✅ Individual relationship failures don't break entire graph

### Frontend
- ✅ Loading state with spinner
- ✅ "No graph data available" message
- ✅ Empty state with instructions
- ✅ Console logging for debugging

## Performance

- **Parallel Fetching**: 10+ VT API calls in parallel with `Promise.allSettled`
- **Limit**: 40 items per relationship type (VT API default)
- **Caching**: Client-side React state caching
- **Rate Limiting**: Respects VT API rate limits (handled by VT orchestrator)

## Styling

### Colors
- Background: `#0f172a` (slate-950)
- Cards: `#1e293b` (slate-800)
- Borders: `#475569` (slate-600)
- Primary: `#6366f1` (indigo-500)
- Text: `#ffffff` (white)
- Muted: `#94a3b8` (slate-400)

### Node Styles
- **Root**: Rectangle, gradient `from-slate-800 to-slate-900`, 2px indigo border, shadow
- **Summary**: Circle, 128px diameter, gradient background, 2px indigo border
- **Edges**: Straight, animated, 2px width, indigo color, arrow markers

## Testing

### Test IOCs

**Malware Hash (WannaCry):**
```
84c82835a5d21bbcf75a61707d8bd3fd1f46b8490fe95edc05fae5e23f4188ab
```

**Malicious Domain:**
```
malware-traffic-analysis.net
```

**Suspicious IP:**
```
185.254.97.6
```

### Expected Results
- File hash: 10+ relationship types (execution parents, dropped files, contacted IPs, etc.)
- Domain: 5-8 relationship types (communicating files, resolutions, subdomains, etc.)
- IP: 4-7 relationship types (communicating files, resolutions, URLs, etc.)

## Troubleshooting

### "No graph data available"
- **Cause**: IOC not found in VirusTotal database
- **Solution**: Try a different IOC from test set above

### "VirusTotal API key not configured"
- **Cause**: Missing `VT_API_KEY` in `.env`
- **Solution**: Add your VT API key to `.env` file

### Empty relationship nodes
- **Cause**: VT returned 404 for specific relationship type
- **Solution**: Normal behavior - not all IOCs have all relationship types

### Slow loading
- **Cause**: 10+ parallel VT API calls
- **Solution**: VT API rate limits may throttle requests (wait ~60 seconds)

## Future Enhancements

- [ ] Node expansion (click to fetch detailed items)
- [ ] Search/filter nodes
- [ ] Export graph as image/JSON
- [ ] Graph clustering by relationship type
- [ ] Real-time updates via WebSocket
- [ ] Graph comparison (diff two IOCs)
- [ ] Custom layout algorithms (force-directed, hierarchical)
- [ ] Node detail panel with full metadata

## License

Part of IOC-Analyzer-Pro platform.
