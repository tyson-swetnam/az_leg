# Arizona Legislature Interactive Map & Network Visualization Website

**Date:** 2025-01-25
**Purpose:** GitHub Pages website with MapLibre GL JS interactive map and ReactJS network visualizations of Arizona State Legislature

## Overview

An interactive web application allowing users to explore Arizona's 30 legislative districts through an interactive map and network visualizations, with bidirectional navigation between geographic and representative-focused views.

## Architecture & Tech Stack

### Core Framework
- **Vite + React 18** - Fast builds, modern tooling, excellent DX
- **React Router v6** - Client-side routing for SPA navigation
- **TypeScript** - Type safety for data models and API responses

### Mapping & Visualization
- **MapLibre GL JS v4** - Open-source, performant vector maps
- **React Force Graph** - Network visualizations with React integration
- **Tailwind CSS** - Utility-first styling for modern/minimal aesthetic

### Data Management
- **Static JSON files** - Legislature data, district info, representatives
- **ArcGIS REST API client** - Fetch district GeoJSON boundaries at runtime
- **TanStack Query (React Query)** - Cache API responses, manage loading states

### Build & Deployment
- **GitHub Actions** - Automated deployment to gh-pages branch
- **Vite static build** - Optimized production bundle
- **Base path configuration** - `/az_leg/` for GitHub Pages subdirectory

### Project Structure
```
/src
  /components  - Reusable UI components
  /pages       - Route pages (Home, District, Network)
  /data        - JSON files (legislators, districts, committees)
  /lib         - Utilities, API clients, helpers
  /types       - TypeScript definitions
/scripts       - Data scraping utilities
/docs          - Documentation
/public        - Static assets
```

## Data Model

### legislators.json
Complete representative data for all 30 districts:

```typescript
{
  "districts": [
    {
      "id": number,
      "name": string,
      "majorCities": string[],
      "senator": {
        "name": string,
        "party": "R" | "D",
        "office": {
          "phone": string,
          "email": string,
          "website": string
        },
        "bio": string,
        "photoUrl"?: string
      },
      "representatives": [
        { /* same structure as senator */ }
      ]
    }
  ],
  "executive": [...],
  "lastUpdated": string (ISO date)
}
```

### committees.json
Scraped from https://apps.azleg.gov/BillStatus/CommitteeOverView?SessionID=130:

```typescript
{
  "senate": [
    {
      "id": string,
      "name": string,
      "chair": string,
      "viceChair": string,
      "members": string[]
    }
  ],
  "house": [...],
  "lastUpdated": string (ISO date)
}
```

### Geographic Boundaries
- Fetched from ArcGIS REST API at runtime
- Source: https://services8.arcgis.com/x0l81el0LN7X67MM/arcgis/rest/services/Approved%20Official%20Congressional%20Map/FeatureServer
- Cached in browser via React Query
- Reduces repo size, always uses official source

## Page Structure & User Flows

### 1. Home Page (`/`)
- **Hero section** - Title, description, links to official maps (https://redistricting-irc-az.hub.arcgis.com/pages/official-maps)
- **Main map** - Full-width MapLibre map showing all 30 districts
  - Color-coded by party control (subtle blues/reds)
  - Hover: Tooltip with district number + senator name
  - Click: Popup with district summary + "View Details" button → `/district/:id`
- **Quick stats** - Senate/House party breakdown cards
- **Navigation links** - Buttons to network visualization pages

### 2. District Detail Page (`/district/:id`)
- **Breadcrumb navigation** - Home > District X
- **Map section** - Focused view of single district boundary
- **Representatives grid** - Cards for senator + 2 house members
  - Name, party, photo (if available)
  - Office contact info (phone, email, website links)
  - Brief bio
- **District info** - Major cities, geographic description
- **Committee memberships** - List of committees each rep serves on
- **Navigation** - Previous/Next district buttons

### 3. Party Network Page (`/network/party`)
- **Force-directed graph** - Nodes = legislators, colored by party
- **Connections** - Districts that share geographic boundaries
- **Interactivity** - Click node → highlight + show rep info panel
- **Filter controls** - Toggle Senate/House, party filters
- **Legend** - Color coding explanation

### 4. Committee Network Page (`/network/committees`)
- **Force-directed graph** - Nodes = legislators
- **Connections** - Shared committee memberships
- **Clustering** - Visual grouping by primary committee
- **Interactivity** - Click node → show committees, click edge → show shared committees
- **Search** - Find and highlight specific legislator

## MapLibre Integration

### Base Map Style
- Free MapTiler Streets or OSM-based style
- Light gray basemap, subtle labels
- Arizona-centered viewport (bounds fit all 30 districts)

### District Layer Implementation
```typescript
// Fetch GeoJSON from ArcGIS
const districtSource = {
  type: 'geojson',
  data: 'https://services8.arcgis.com/.../query?outFields=*&where=1=1&f=geojson'
}

// Style by party control
map.addLayer({
  id: 'districts-fill',
  type: 'fill',
  paint: {
    'fill-color': [
      'match',
      ['get', 'party'],
      'R', '#ef444420',
      'D', '#3b82f620',
      '#94a3b820'
    ],
    'fill-opacity': 0.6
  }
})
```

### Interaction States
- **Hover** - Increase opacity, cursor pointer, tooltip
- **Click** - Popup with district info + navigation button
- **Selected** - Thicker border on detail page

### Performance
- GeoJSON cached (24 hour staleTime)
- Vector tiles for smooth interaction
- Lazy load map component

## Network Visualization

### Library: React Force Graph
- Better React integration than raw D3
- Built-in force simulation
- ~90 nodes (30 senators + 60 reps)

### Party Network
```typescript
nodes: {
  id: legislator name,
  party: 'R' | 'D',
  chamber: 'senate' | 'house',
  district: number,
  val: node size (senate=8, house=5)
}

links: [
  { source, target, type: 'same-district' | 'geographic-neighbor' }
]

nodeColor: party-based (#ef4444 R, #3b82f6 D)
```

### Committee Network
```typescript
links: [
  {
    source,
    target,
    committees: string[],
    strength: number (shared committee count)
  }
]

linkWidth: based on strength
```

## Data Collection Strategy

### Committee Scraper (`scripts/scrape-committees.js`)
- **Technology** - Node.js with Puppeteer/Cheerio
- **Target** - https://apps.azleg.gov/BillStatus/CommitteeOverView?SessionID=130
- **Output** - `src/data/committees.json`
- **Logic**:
  1. Fetch committee overview
  2. Extract committee names/links
  3. For each: parse chair, vice chair, members
  4. Match to legislators.json
  5. Generate structured JSON

### Legislator Data (`src/data/legislators.json`)
- Transform arizona_government_2025.md to JSON
- Add office contact info from azleg.gov
- Optional: Photo URLs
- Merge committee assignments from scraper

### Update Workflow
```bash
npm run scrape:committees  # Refresh committee data
npm run validate:data      # Schema validation
git commit -m "Update legislature data"
```

### Data Validation
- JSON schema checks
- All districts 1-30 present
- Party values valid ('R' or 'D')
- Required fields complete

## Deployment & GitHub Pages

### Configuration
- Deploy from `gh-pages` branch (GitHub Actions)
- Base URL: `/az_leg/`
- Vite config: `base: '/az_leg/'`

### GitHub Actions Workflow
```yaml
on:
  push:
    branches: [main]

jobs:
  build-deploy:
    - Setup Node.js 20
    - Install dependencies
    - Build (npm run build)
    - Deploy to gh-pages
```

### Build Optimization
- Code splitting by route
- Lazy load pages
- Tree-shake MapLibre
- Compress images
- Generate sitemap

### Development
```bash
npm run dev       # Dev server
npm run build     # Production build
npm run preview   # Preview build
npm run scrape    # Run scraper
```

## Error Handling & UX

### API Error Handling
- Retry failed requests (3x exponential backoff)
- Fallback to cached data with notice
- Ultimate fallback: Error message + link to official maps

### React Query Configuration
```typescript
{
  retry: 3,
  staleTime: 24 * 60 * 60 * 1000,      // 24 hours
  cacheTime: 7 * 24 * 60 * 60 * 1000,  // 7 days
  refetchOnWindowFocus: false
}
```

### Loading States
- Map: Skeleton with spinner
- Page transitions: Smooth fade
- Network graphs: Progressive rendering
- Images: Placeholder avatars

### Accessibility
- **ARIA labels** - All interactive elements
- **Keyboard navigation** - Tab/Enter support
- **Screen readers** - Descriptive text
- **Color contrast** - WCAG AA (4.5:1)
- **Focus indicators** - Clear outlines
- **Alternative navigation** - District dropdown for non-map users

### Performance Targets
- First Contentful Paint < 1.5s
- Time to Interactive < 3s
- Lighthouse score > 90

## Testing & Maintenance

### Testing Strategy
- **Unit tests** - Vitest for utilities, validation
- **Component tests** - React Testing Library
- **E2E tests (optional)** - Playwright for critical flows
- **Data validation** - Automated JSON checks

### Maintenance Tasks
```bash
# After elections
npm run scrape:committees
# Update legislators.json manually
npm run validate:data
git commit && git push  # Auto-deploys

# Quarterly
- Verify ArcGIS endpoint
- Check external links
- Review analytics
```

### Future Enhancements
1. Bill tracking by district/representative
2. Voting records in network graphs
3. Historical legislature data/archives
4. Email alerts for changes
5. Social media feeds
6. Progressive Web App (PWA)
7. District comparison tool

### Analytics (Optional)
- Privacy-focused (Plausible/similar)
- Track: Popular districts, navigation patterns

## Documentation
- README with setup instructions
- CONTRIBUTING.md for data updates
- Inline code comments
- Data schema documentation

## External Resources
- **Official Maps**: https://redistricting-irc-az.hub.arcgis.com/pages/official-maps
- **Legislature Website**: https://www.azleg.gov/
- **Committees**: https://apps.azleg.gov/BillStatus/CommitteeOverView?SessionID=130
- **ArcGIS REST**: https://services8.arcgis.com/x0l81el0LN7X67MM/arcgis/rest/services/
