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
npm run add-social       # Scrape campaign websites for social media links
npm run validate-social  # Validate social media URLs (format + accessibility)
```

### Building
The build process requires TypeScript compilation (`tsc -b`) to pass before Vite builds. Output goes to `dist/`.

## Architecture

### Data Flow

**Source Data → JSON → React Query → Components**

1. **Markdown Source**: `arizona_government_2025.md` contains legislator roster tables
2. **Transform Script**: `scripts/transform-md-to-json.js` parses markdown tables into structured JSON
3. **Social Media Collection**: `scripts/add-social-media.js` scrapes campaign websites and merges manual research
4. **Static Data**: Generated `src/data/legislators.json` contains all legislator and executive data (including social media)
5. **GeoJSON**: District boundaries fetched from ArcGIS REST API at runtime
6. **React Query**: Caches both local JSON and remote GeoJSON with separate staleness policies

### Social Media Data Flow

**Campaign Websites → Web Scraping → Manual Research → Validation → JSON**

1. **Automated Scraping**: `add-social-media.js` uses axios + cheerio to extract social media links from campaign websites (~60% coverage)
2. **Manual Template**: Script generates `manual-social-media.json` for officials missing social media data
3. **Manual Research**: Maintainer fills in template by checking official sources (azleg.gov, campaign sites, etc.)
4. **Merge Process**: Script merges manual data back into `legislators.json` with `--merge` flag
5. **Validation**: `validate-social-media.js` performs format checks, HTTP accessibility tests, coverage reports, and duplicate detection
6. **Data Structure**: Two classifications stored per official:
   - `socialMedia.personal`: Personal/campaign accounts (Twitter/X, Facebook, Instagram, LinkedIn, BlueSky)
   - `socialMedia.official`: Government/institutional accounts (same 5 platforms)

**URL Normalization Rules**:
- Enforce HTTPS (upgrade http → https)
- Remove mobile redirects (m.facebook.com → facebook.com)
- Strip query parameters and URL fragments
- Remove trailing slashes
- Validate against platform-specific regex patterns

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
- `legislature.ts`: Core types for legislators and officials
  - `Legislator`, `Senator`, `Representative`, `Executive`
  - `Chamber` ('senate' | 'house'), `Party` ('R' | 'D')
  - `Office` (phone, email, website)
  - `SocialMediaAccounts` (twitter, facebook, instagram, linkedin, bluesky - all optional)
  - `SocialMedia` (personal?: SocialMediaAccounts, official?: SocialMediaAccounts)
- `district.ts`: District (combines legislator data + GeoJSON), DistrictGeoJSON
- `committee.ts`: Committee structures
- `campaign-finance.ts`: Campaign finance data from Follow the Money API

Each district has exactly 1 senator + 2 representatives.

**Social Media Type Structure**:
```typescript
interface SocialMediaAccounts {
  twitter?: string;      // Full URL to Twitter/X profile
  facebook?: string;     // Full URL to Facebook profile
  instagram?: string;    // Full URL to Instagram profile
  linkedin?: string;     // Full URL to LinkedIn profile
  bluesky?: string;      // Full URL to BlueSky profile
}

interface SocialMedia {
  personal?: SocialMediaAccounts;   // Personal/campaign accounts
  official?: SocialMediaAccounts;   // Government/institutional accounts
}
```

All URLs stored as complete HTTPS URLs (e.g., "https://twitter.com/username"), not handles or partial paths.

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

### Legislative Data Transform

The `transform` script parses markdown tables from `arizona_government_2025.md`:
- **Senate Roster**: Extracts district, name, party, cities
- **House Roster**: Parses 2 representatives per district with parties
- **Executive Branch**: Parses state officials table

Output structure ensures exactly 1 senator + 2 representatives per district (fills with "TBD" if missing).

### Social Media Collection

The `add-social-media` script has two modes:

**Scrape Mode** (default):
```bash
npm run add-social
npm run add-social -- --dry-run  # Preview without modifying files
```
- Stage 1: Scrapes campaign websites using axios + cheerio (10s timeout per site, 500ms delay between requests)
- Stage 2: Generates `manual-social-media.json` template for officials with incomplete data
- Creates backup: `legislators.json.backup`
- Updates `lastUpdated` timestamp

**Merge Mode** (import manual research):
```bash
npm run add-social -- --merge
```
- Reads `manual-social-media.json` (maintainer fills this with manual research)
- Merges social media data into `legislators.json`
- Regenerates template with remaining incomplete entries
- Enables iterative workflow: scrape → manual research → merge → repeat

**Key Functions**:
- `extractSocialLinks(html)`: Cheerio-based extraction using regex patterns per platform
- `normalizeUrl(url)`: Enforces HTTPS, removes mobile redirects, strips query params/trailing slashes
- `scrapeCampaignWebsite(url, name)`: HTTP request with User-Agent header
- `mergeSocialMediaData(data, manualData)`: Matches by name/district/type and merges both personal + official accounts

### Social Media Validation

The `validate-social-media` script performs comprehensive quality assurance:

```bash
npm run validate-social                      # Full validation with HTTP checks
npm run validate-social -- --skip-http       # Format validation only (faster)
npm run validate-social -- --json            # Output validation-report.json
```

**Four Validation Stages**:
1. **Format Validation**: Regex pattern matching per platform (twitter, facebook, instagram, linkedin, bluesky)
   - Checks for HTTPS protocol, no trailing slashes, no spaces, valid domain/username format
2. **Accessibility Check**: HTTP HEAD/GET requests with 10s timeout, 1.5s delay between requests
   - Accepts status codes: 200, 301, 302, 307, 308
   - Flags: 404 (Not Found), 403 (Forbidden), 410 (Gone), 429 (Rate Limited), 500/503 (Server Errors)
3. **Coverage Report**: Statistics by platform and overall (goal: 85%+ coverage)
   - Lists officials with no social media data
4. **Duplicate Detection**: Ensures no two officials share the same URL

**Exit Behavior**: Always exits with code 0 (reports issues but doesn't fail CI/CD builds)

**Output**: Console report + optional JSON file with detailed error/warning information

## Deployment

- Base path: `/az_leg/` (configured for GitHub Pages)
- Build output: `dist/` directory
- Source maps enabled in production builds

## Data Maintenance

### Quarterly Reviews (Every 3 months)
- Run `npm run validate-social` to check for broken links
- Update any changed social media handles
- Verify URLs are still accessible
- Check for new social media accounts on official sources

### Post-Election Updates (After primaries and general elections)
Complete workflow for updating legislator data:

1. **Update Source Data**:
   - Edit `arizona_government_2025.md` with new legislator roster from azleg.gov

2. **Transform Legislative Data**:
   ```bash
   npm run transform
   ```
   Generates updated `legislators.json` with new officials

3. **Collect Social Media** (iterative process):
   ```bash
   npm run add-social                    # Scrape campaign websites
   # Manually fill in manual-social-media.json with research
   npm run add-social -- --merge         # Import manual data
   # Repeat until coverage target reached
   ```

4. **Validate Data Quality**:
   ```bash
   npm run validate-social
   ```
   Ensure all URLs are valid and accessible

5. **Commit Changes**:
   - Commit updated `legislators.json`
   - Document sources in commit message
   - Do NOT commit `legislators.json.backup` or `manual-social-media.json`

### Privacy and Data Collection Policy

**ONLY include social media accounts from these sources**:
- Arizona Legislature official website (azleg.gov)
- Official campaign websites listed on azleg.gov or campaign finance reports
- Government/legislative directories
- Public campaign finance filings

**NEVER include accounts from**:
- Personal knowledge or private research
- Unofficial sources, rumors, or speculation
- Family member or associate accounts
- Non-public directories or databases

**Classification Guidelines**:
- **Official**: Government-managed accounts (e.g., "Senator John Smith" or "Rep. Jane Doe")
- **Personal**: Campaign or personal accounts used for political communication
- **When uncertain**: Prefer "personal" classification
- **When in doubt**: Exclude the account rather than risk including non-public information

**Data Minimization**: Only collect what's publicly listed and relevant to constituent communication.
