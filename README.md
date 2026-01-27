# Arizona Legislature Visualization

An interactive web application displaying Arizona's 30 legislative districts with detailed information about senators, representatives, and their social media presence.

## Features

- Interactive map of all 30 legislative districts in Arizona
- Detailed district views with legislator information
- Party network visualizations showing relationships between legislators
- Committee network graphs
- Campaign finance information integration
- Social media profile links (personal and official accounts)

## Tech Stack

- **Frontend**: React 19 with TypeScript
- **Build Tool**: Vite
- **Routing**: React Router v7
- **State Management**: TanStack Query (React Query)
- **Maps**: MapLibre GL
- **Styling**: Tailwind CSS v3
- **Data Visualization**: react-force-graph-2d

## Development

### Prerequisites

- Node.js (v18 or higher recommended)
- npm

### Installation

```bash
npm install
```

### Development Server

```bash
npm run dev
```

Starts the Vite development server at `http://localhost:5173`

### Build

```bash
npm run build
```

Runs TypeScript compilation followed by Vite production build. Output goes to `dist/`.

### Preview Production Build

```bash
npm run preview
```

Preview the production build locally.

### Linting

```bash
npm run lint
```

Runs ESLint on the codebase.

## Data Management

### Legislative Data

The application uses structured JSON data generated from markdown source files.

#### Transform Legislative Data

```bash
npm run transform
```

Parses `arizona_government_2025.md` (markdown tables with legislator rosters) and generates `src/data/legislators.json`.

### Social Media Data

The application tracks both **personal** and **official** social media accounts for all legislators and executive branch officials across 5 platforms:
- Twitter/X
- Facebook
- Instagram
- LinkedIn
- BlueSky

#### Data Structure

Social media data is stored in the `socialMedia` property of each legislator or executive official:

```typescript
{
  "socialMedia": {
    "personal": {
      "twitter": "https://twitter.com/username",
      "facebook": "https://facebook.com/username",
      "instagram": "https://instagram.com/username",
      "linkedin": "https://linkedin.com/in/username",
      "bluesky": "https://bsky.app/profile/username.bsky.social"
    },
    "official": {
      "twitter": "https://twitter.com/rep_username"
      // ... other platforms
    }
  }
}
```

**Classification:**
- **Personal**: Personal/campaign accounts used for political campaigns and personal views
- **Official**: Government/institutional accounts representing official duties

**Format Conventions:**
- All URLs must be complete and valid (e.g., `https://twitter.com/username`, not `@username`)
- URLs must use HTTPS (not HTTP)
- No trailing slashes
- No query parameters or URL fragments
- Mobile URLs normalized (e.g., `m.facebook.com` → `facebook.com`)

#### Collect Social Media Links

```bash
npm run add-social
```

Three-stage automated data collection process:

1. **Stage 1: Web Scraping** - Automatically scrapes campaign websites to extract social media links (achieves ~60% coverage)
2. **Stage 2: Manual Template** - Generates `manual-social-media.json` with officials missing social media data for manual research
3. **Stage 3: Future Enhancement** - Placeholder for optional search API integration

**Workflow:**

1. Run initial scrape:
   ```bash
   npm run add-social
   ```
   This scrapes all campaign websites and generates a template file.

2. Manually research and fill in `manual-social-media.json`:
   - Look up official government/legislative pages
   - Check campaign websites
   - Verify social media accounts are publicly listed
   - Classify each account as `personal` or `official`

3. Merge manual data back into legislators.json:
   ```bash
   npm run add-social -- --merge
   ```
   This imports your manual research and regenerates the template with remaining incomplete entries.

4. Repeat steps 2-3 until coverage is complete.

**Options:**
- `--merge` - Import data from `manual-social-media.json` into `legislators.json`
- `--dry-run` - Test without modifying files

**Files:**
- Input: `src/data/legislators.json`, `manual-social-media.json`
- Output: Updated `legislators.json`, `legislators.json.backup`, regenerated `manual-social-media.json`

#### Validate Social Media Data

```bash
npm run validate-social
```

Comprehensive validation with four stages:

1. **Format Validation** - Verifies URLs match expected patterns for each platform
2. **Accessibility Check** - Makes HTTP requests to verify URLs are accessible (200/301/302/307/308 status codes)
3. **Coverage Report** - Statistics on social media coverage by platform and overall
4. **Duplicate Detection** - Ensures no two officials share the same URL

**Options:**
- `--skip-http` - Skip HTTP accessibility checks (faster, format validation only)
- `--json` - Output detailed `validation-report.json` file

**Validation Rules:**
- URLs must match platform-specific patterns
- Must use HTTPS protocol
- No trailing slashes allowed
- No whitespace in URLs
- HTTP status codes 200, 301, 302, 307, 308 considered valid
- Duplicate URLs flagged as warnings

**Exit Behavior:**
Always exits with code 0 (reports issues but doesn't fail builds).

### Maintenance Schedule

#### Quarterly Reviews
- Review social media links for changes/updates
- Verify URLs are still accessible
- Update any changed handles or accounts
- Run `npm run validate-social` to check for issues

#### Post-Election Updates
After primary or general elections:
1. Update `arizona_government_2025.md` with new legislator roster
2. Run `npm run transform` to regenerate `legislators.json`
3. Run `npm run add-social` to collect social media for new officials
4. Fill in `manual-social-media.json` with manual research
5. Run `npm run add-social -- --merge` to import manual data
6. Run `npm run validate-social` to verify all links
7. Commit updated data files

#### Privacy Policy

**Data Collection Standards:**
- Only include social media accounts that are **publicly listed** on official sources:
  - Arizona Legislature official website (azleg.gov)
  - Official campaign websites
  - Government/legislative directories
  - Public campaign finance reports
- Do NOT include accounts found through:
  - Private research or personal knowledge
  - Unofficial sources or rumors
  - Family member accounts
  - Non-public directories
- If uncertain about classification (personal vs official), prefer "personal"
- When in doubt about inclusion, err on the side of exclusion

## Project Structure

```
az_leg/
├── src/
│   ├── components/       # React components
│   │   ├── District/     # District-specific components
│   │   └── Map/          # Map-related components
│   ├── data/             # Static JSON data files
│   ├── lib/
│   │   ├── api/          # API integration (ArcGIS, React Query)
│   │   ├── constants.ts  # App-wide constants
│   │   └── utils.ts      # Utility functions
│   ├── pages/            # Page components (routes)
│   ├── types/            # TypeScript type definitions
│   └── App.tsx           # Main app component
├── scripts/              # Data processing scripts
│   ├── transform-md-to-json.js
│   ├── add-social-media.js
│   └── validate-social-media.js
└── dist/                 # Production build output
```

## Deployment

The application is configured for GitHub Pages deployment:
- Base path: `/az_leg/`
- Production build includes source maps
- Client-side routing handled via `404.html` redirect

## Data Sources

- **District Boundaries**: ArcGIS REST API (Arizona Official Legislative Map)
- **Legislator Data**: Arizona Legislature official roster (manually curated)
- **Campaign Finance**: Follow the Money API
- **Social Media**: Campaign websites (automated scraping) + manual research

## Contributing

When contributing data updates:

1. Ensure social media links are from publicly available sources only
2. Classify accounts appropriately (personal vs official)
3. Follow URL format conventions (HTTPS, no trailing slashes, normalized)
4. Run validation script before committing changes
5. Document sources in commit messages when adding new data

## License

MIT
