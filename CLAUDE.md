# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Arizona Legislature visualization web application built with React, TypeScript, Vite, and MapLibre GL. Displays interactive maps of Arizona's 30 legislative districts with legislator information, party networks, and committee visualizations.

## Key Commands

### Development
```bash
npm run dev              # Start Vite dev server (default: http://localhost:5173)
npm run build            # TypeScript check + Vite production build
npm run preview          # Preview production build locally
npm run lint             # Run ESLint on codebase
npm run transform        # Parse arizona_government_2025.md → src/data/legislators.json
```

### Building
The build process requires TypeScript compilation (`tsc -b`) to pass before Vite builds. Output goes to `dist/`.

## Architecture

### Data Flow

**Source Data → JSON → React Query → Components**

1. **Markdown Source**: `arizona_government_2025.md` contains legislator roster tables
2. **Transform Script**: `scripts/transform-md-to-json.js` parses markdown tables into structured JSON
3. **Static Data**: Generated `src/data/legislators.json` contains all legislator and executive data
4. **GeoJSON**: District boundaries fetched from ArcGIS REST API at runtime
5. **React Query**: Caches both local JSON and remote GeoJSON with separate staleness policies

### Core Structure

**App Router** (`src/App.tsx`)
- React Router with `/az_leg` basename (GitHub Pages deployment)
- TanStack Query client with retry policies configured
- Routes: Home (map), DistrictDetail, PartyNetwork, CommitteeNetwork

**Map System** (`src/components/Map/`)
- Modular MapLibre GL integration split across custom hooks:
  - `useMapInstance`: Map initialization and lifecycle
  - `useDistrictLayer`: GeoJSON layer management with party-based coloring
  - `useMapInteractions`: Click/hover handlers for district tooltips and popups
- Districts colored by senator's party (red=R, blue=D) using `PARTY_COLORS_LIGHT`
- Tooltips show district info on hover; popups navigate to detail page on click

**Data Queries** (`src/lib/api/`)
- `queries.ts`: React Query hooks with caching strategies
  - Local JSON: `staleTime: Infinity` (never refetches)
  - GeoJSON boundaries: `staleTime: ONE_DAY`, `gcTime: ONE_WEEK`
- `arcgis.ts`: ArcGIS REST API integration for district boundaries

### Type System

**Key Types** (`src/types/`)
- `legislature.ts`: Legislator, Senator, Representative, Executive, Chamber, Party
- `district.ts`: District (combines legislator data + GeoJSON), DistrictGeoJSON
- `committee.ts`: Committee structures

Each district has exactly 1 senator + 2 representatives.

### Path Alias

`@/` maps to `./src/` (configured in vite.config.ts)

## Important Patterns

### ArcGIS Integration
- Service URL: `https://services8.arcgis.com/x0l81el0LN7X67MM/ArcGIS/rest/services/Approved Official Legislative Map/FeatureServer/0/query`
- Query params: `where=1=1`, `outFields=*`, `returnGeometry=true`, `f=geojson`
- District property name: `DISTRICT` (matches on district ID 1-30)

### MapLibre GL Layers
- Source: `'districts'` (GeoJSON from ArcGIS)
- Layers: `'districts-fill'` (party-colored polygons), `'districts-border'` (outline)
- Party colors defined in `src/lib/constants.ts` as hex values

### React Query Caching
- GeoJSON boundaries cached 24h, retained 7 days
- Local JSON never stale (static build artifact)
- Default retry: 3 attempts, no refetch on window focus

### Popup Navigation
When district popup navigates to detail page, it uses `window.location.href` instead of React Router's `navigate()` because the popup is rendered outside the Router context via MapLibre GL's popup API.

## Data Generation

The `transform` script parses markdown tables from `arizona_government_2025.md`:
- **Senate Roster**: Extracts district, name, party, cities
- **House Roster**: Parses 2 representatives per district with parties
- **Executive Branch**: Parses state officials table

Output structure ensures exactly 1 senator + 2 representatives per district (fills with "TBD" if missing).

## Deployment

- Base path: `/az_leg/` (configured for GitHub Pages)
- Build output: `dist/` directory
- Source maps enabled in production builds
