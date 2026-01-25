# Arizona Legislature Interactive Map & Network Visualization Website Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a GitHub Pages SPA with MapLibre interactive map and React network visualizations for exploring Arizona's 30 legislative districts and representatives.

**Architecture:** Vite + React + TypeScript SPA with MapLibre GL JS for mapping, React Force Graph for network visualizations, TanStack Query for API caching, deployed via GitHub Actions to gh-pages branch.

**Tech Stack:** Vite, React 18, TypeScript, React Router v6, MapLibre GL JS v4, React Force Graph, TanStack Query, Tailwind CSS

---

## Task 1: Project Initialization & Base Configuration

**Files:**
- Create: `package.json`
- Create: `vite.config.ts`
- Create: `tsconfig.json`
- Create: `tsconfig.node.json`
- Create: `tailwind.config.js`
- Create: `postcss.config.js`
- Create: `index.html`
- Create: `.gitignore`

**Step 1: Initialize Vite React TypeScript project**

Run:
```bash
npm create vite@latest . -- --template react-ts
```

Expected: Vite scaffolds project with React + TypeScript template

**Step 2: Install core dependencies**

Run:
```bash
npm install react-router-dom @tanstack/react-query maplibre-gl react-force-graph-2d @types/maplibre-gl
```

Expected: Dependencies installed successfully

**Step 3: Install Tailwind CSS**

Run:
```bash
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p
```

Expected: Tailwind config files created

**Step 4: Configure Tailwind**

Edit `tailwind.config.js`:
```javascript
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}
```

**Step 5: Configure Vite for GitHub Pages**

Edit `vite.config.ts`:
```typescript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: '/az_leg/',
  build: {
    outDir: 'dist',
    sourcemap: true,
  },
})
```

**Step 6: Update tsconfig.json**

Edit `tsconfig.json`:
```json
{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    }
  },
  "include": ["src"],
  "references": [{ "path": "./tsconfig.node.json" }]
}
```

**Step 7: Create .gitignore**

Create `.gitignore`:
```
# Dependencies
node_modules/

# Build output
dist/
dist-ssr/

# Editor
.vscode/
.idea/

# Environment
.env
.env.local

# Logs
*.log

# OS
.DS_Store
Thumbs.db
```

**Step 8: Commit**

```bash
git add .
git commit -m "feat: initialize Vite React TypeScript project with Tailwind CSS"
```

---

## Task 2: Project Structure & TypeScript Types

**Files:**
- Create: `src/types/legislature.ts`
- Create: `src/types/committee.ts`
- Create: `src/types/district.ts`
- Create: `src/lib/utils.ts`
- Create: `src/lib/constants.ts`

**Step 1: Create TypeScript types for legislature data**

Create `src/types/legislature.ts`:
```typescript
export type Party = 'R' | 'D';

export type Chamber = 'senate' | 'house';

export interface Office {
  phone: string;
  email: string;
  website: string;
}

export interface Legislator {
  name: string;
  party: Party;
  chamber: Chamber;
  district: number;
  office: Office;
  bio?: string;
  photoUrl?: string;
  committees?: string[];
}

export interface Senator extends Legislator {
  chamber: 'senate';
}

export interface Representative extends Legislator {
  chamber: 'house';
}

export interface Executive {
  title: string;
  name: string;
  party: Party;
  birthDate?: string;
  age?: number;
}

export interface LegislatureData {
  districts: District[];
  executive: Executive[];
  lastUpdated: string;
}
```

**Step 2: Create district type**

Create `src/types/district.ts`:
```typescript
import { Senator, Representative } from './legislature';

export interface District {
  id: number;
  name: string;
  majorCities: string[];
  senator: Senator;
  representatives: [Representative, Representative];
}

export interface DistrictGeometry {
  type: 'Feature';
  properties: {
    DISTRICT: number;
    [key: string]: any;
  };
  geometry: {
    type: 'Polygon' | 'MultiPolygon';
    coordinates: number[][][] | number[][][][];
  };
}

export interface DistrictGeoJSON {
  type: 'FeatureCollection';
  features: DistrictGeometry[];
}
```

**Step 3: Create committee types**

Create `src/types/committee.ts`:
```typescript
export interface Committee {
  id: string;
  name: string;
  chair: string;
  viceChair?: string;
  members: string[];
  chamber: 'senate' | 'house';
}

export interface CommitteeData {
  senate: Committee[];
  house: Committee[];
  lastUpdated: string;
}
```

**Step 4: Create constants**

Create `src/lib/constants.ts`:
```typescript
export const ARCGIS_BASE_URL =
  'https://services8.arcgis.com/x0l81el0LN7X67MM/arcgis/rest/services';

export const LEGISLATIVE_DISTRICTS_URL =
  `${ARCGIS_BASE_URL}/2022_Approved_Legislative_Districts/FeatureServer/0/query`;

export const PARTY_COLORS = {
  R: '#ef4444',
  D: '#3b82f6',
} as const;

export const PARTY_COLORS_LIGHT = {
  R: '#ef444420',
  D: '#3b82f620',
} as const;

export const OFFICIAL_MAPS_URL =
  'https://redistricting-irc-az.hub.arcgis.com/pages/official-maps';

export const LEGISLATURE_URL = 'https://www.azleg.gov/';

export const COMMITTEES_URL =
  'https://apps.azleg.gov/BillStatus/CommitteeOverView?SessionID=130';

export const MAPLIBRE_STYLE =
  'https://api.maptiler.com/maps/streets/style.json?key=get_your_own_key';
```

**Step 5: Create utility functions**

Create `src/lib/utils.ts`:
```typescript
import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function getPartyLabel(party: 'R' | 'D'): string {
  return party === 'R' ? 'Republican' : 'Democratic';
}

export function formatPhone(phone: string): string {
  const cleaned = phone.replace(/\D/g, '');
  const match = cleaned.match(/^(\d{3})(\d{3})(\d{4})$/);
  if (match) {
    return `(${match[1]}) ${match[2]}-${match[3]}`;
  }
  return phone;
}
```

**Step 6: Install additional utilities**

Run:
```bash
npm install clsx tailwind-merge
```

Expected: Utility packages installed

**Step 7: Commit**

```bash
git add src/types/ src/lib/
git commit -m "feat: add TypeScript types and utility functions"
```

---

## Task 3: Data Files - Transform Legislature Data to JSON

**Files:**
- Create: `src/data/legislators.json`
- Create: `scripts/transform-md-to-json.js`

**Step 1: Create data transformation script**

Create `scripts/transform-md-to-json.js`:
```javascript
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Read the markdown file
const mdContent = fs.readFileSync(
  path.join(__dirname, '../arizona_government_2025.md'),
  'utf-8'
);

// Parse districts from the markdown
function parseDistricts(content) {
  const districts = [];

  // This is a simplified parser - you'll need to enhance based on actual MD structure
  // For now, we'll create a template structure
  for (let i = 1; i <= 30; i++) {
    districts.push({
      id: i,
      name: `District ${i}`,
      majorCities: [],
      senator: {
        name: '',
        party: 'R',
        chamber: 'senate',
        district: i,
        office: {
          phone: '',
          email: '',
          website: `https://www.azleg.gov/`
        }
      },
      representatives: [
        {
          name: '',
          party: 'R',
          chamber: 'house',
          district: i,
          office: {
            phone: '',
            email: '',
            website: `https://www.azleg.gov/`
          }
        },
        {
          name: '',
          party: 'R',
          chamber: 'house',
          district: i,
          office: {
            phone: '',
            email: '',
            website: `https://www.azleg.gov/`
          }
        }
      ]
    });
  }

  return districts;
}

const data = {
  districts: parseDistricts(mdContent),
  executive: [
    {
      title: 'Governor',
      name: 'Katie Hobbs',
      party: 'D',
      birthDate: '1969-12-28',
      age: 56
    },
    {
      title: 'Secretary of State',
      name: 'Adrian Fontes',
      party: 'D',
      birthDate: '1970-04-03',
      age: 54
    },
    {
      title: 'Attorney General',
      name: 'Kris Mayes',
      party: 'D',
      birthDate: '1970-09-06',
      age: 54
    },
    {
      title: 'State Treasurer',
      name: 'Kimberly Yee',
      party: 'R',
      birthDate: '1974-02-23',
      age: 50
    },
    {
      title: 'Superintendent of Public Instruction',
      name: 'Tom Horne',
      party: 'R',
      birthDate: '1945-03-28',
      age: 79
    }
  ],
  lastUpdated: new Date().toISOString()
};

// Write to JSON file
fs.writeFileSync(
  path.join(__dirname, '../src/data/legislators-template.json'),
  JSON.stringify(data, null, 2)
);

console.log('Template JSON created. Manual data entry required.');
```

**Step 2: Add script to package.json**

Edit `package.json` scripts section:
```json
{
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview",
    "transform": "node scripts/transform-md-to-json.js"
  }
}
```

**Step 3: Run transformation script**

Run:
```bash
npm run transform
```

Expected: Creates `src/data/legislators-template.json`

**Step 4: Manually populate legislators.json with real data**

Note: This step requires manual data entry from arizona_government_2025.md. For the implementation, we'll create a properly structured JSON file with actual data from the markdown.

Create `src/data/legislators.json` with complete data (abbreviated example):
```json
{
  "districts": [
    {
      "id": 1,
      "name": "District 1",
      "majorCities": ["Prescott", "Prescott Valley", "Sedona"],
      "senator": {
        "name": "Mark Finchem",
        "party": "R",
        "chamber": "senate",
        "district": 1,
        "office": {
          "phone": "602-926-3104",
          "email": "mfinchem@azleg.gov",
          "website": "https://www.azleg.gov/Senate/Member/?legislature=57&session=130&legislator=2081"
        },
        "bio": "First Senate term (2025); former House member 2015-2023"
      },
      "representatives": [
        {
          "name": "Selina Bliss",
          "party": "R",
          "chamber": "house",
          "district": 1,
          "office": {
            "phone": "602-926-5409",
            "email": "sbliss@azleg.gov",
            "website": "https://www.azleg.gov/House/Member/?legislature=57&session=130&legislator=1933"
          }
        },
        {
          "name": "Quang H. Nguyen",
          "party": "R",
          "chamber": "house",
          "district": 1,
          "office": {
            "phone": "602-926-3092",
            "email": "qnguyen@azleg.gov",
            "website": "https://www.azleg.gov/House/Member/?legislature=57&session=130&legislator=1886"
          }
        }
      ]
    }
  ],
  "executive": [
    {
      "title": "Governor",
      "name": "Katie Hobbs",
      "party": "D",
      "birthDate": "1969-12-28",
      "age": 56
    }
  ],
  "lastUpdated": "2025-01-25T00:00:00.000Z"
}
```

**Step 5: Commit**

```bash
git add scripts/ src/data/ package.json
git commit -m "feat: add data transformation script and legislators JSON template"
```

---

## Task 4: API Client for ArcGIS GeoJSON

**Files:**
- Create: `src/lib/api/arcgis.ts`
- Create: `src/lib/api/queries.ts`

**Step 1: Create ArcGIS API client**

Create `src/lib/api/arcgis.ts`:
```typescript
import { DistrictGeoJSON } from '@/types/district';
import { LEGISLATIVE_DISTRICTS_URL } from '@/lib/constants';

export async function fetchDistrictBoundaries(): Promise<DistrictGeoJSON> {
  const params = new URLSearchParams({
    where: '1=1',
    outFields: '*',
    f: 'geojson',
    returnGeometry: 'true',
  });

  const url = `${LEGISLATIVE_DISTRICTS_URL}?${params.toString()}`;

  try {
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`ArcGIS API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return data as DistrictGeoJSON;
  } catch (error) {
    console.error('Failed to fetch district boundaries:', error);
    throw error;
  }
}

export async function fetchSingleDistrict(districtId: number): Promise<DistrictGeoJSON> {
  const params = new URLSearchParams({
    where: `DISTRICT=${districtId}`,
    outFields: '*',
    f: 'geojson',
    returnGeometry: 'true',
  });

  const url = `${LEGISLATIVE_DISTRICTS_URL}?${params.toString()}`;

  try {
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`ArcGIS API error: ${response.status}`);
    }

    const data = await response.json();
    return data as DistrictGeoJSON;
  } catch (error) {
    console.error(`Failed to fetch district ${districtId}:`, error);
    throw error;
  }
}
```

**Step 2: Create React Query hooks**

Create `src/lib/api/queries.ts`:
```typescript
import { useQuery } from '@tanstack/react-query';
import { fetchDistrictBoundaries, fetchSingleDistrict } from './arcgis';
import legislatorsData from '@/data/legislators.json';
import { LegislatureData } from '@/types/legislature';

const ONE_DAY = 24 * 60 * 60 * 1000;
const ONE_WEEK = 7 * ONE_DAY;

export function useDistrictBoundaries() {
  return useQuery({
    queryKey: ['district-boundaries'],
    queryFn: fetchDistrictBoundaries,
    staleTime: ONE_DAY,
    gcTime: ONE_WEEK,
    refetchOnWindowFocus: false,
    retry: 3,
  });
}

export function useSingleDistrictBoundary(districtId: number) {
  return useQuery({
    queryKey: ['district-boundary', districtId],
    queryFn: () => fetchSingleDistrict(districtId),
    staleTime: ONE_DAY,
    gcTime: ONE_WEEK,
    refetchOnWindowFocus: false,
    retry: 3,
    enabled: !!districtId,
  });
}

export function useLegislators() {
  return useQuery({
    queryKey: ['legislators'],
    queryFn: async () => legislatorsData as LegislatureData,
    staleTime: Infinity,
    gcTime: Infinity,
  });
}

export function useDistrict(districtId: number) {
  const { data: legislators } = useLegislators();

  return useQuery({
    queryKey: ['district', districtId],
    queryFn: async () => {
      const district = legislators?.districts.find(d => d.id === districtId);
      if (!district) {
        throw new Error(`District ${districtId} not found`);
      }
      return district;
    },
    enabled: !!legislators && !!districtId,
    staleTime: Infinity,
  });
}
```

**Step 3: Commit**

```bash
git add src/lib/api/
git commit -m "feat: add ArcGIS API client and React Query hooks"
```

---

## Task 5: React Router Setup & App Structure

**Files:**
- Create: `src/App.tsx`
- Modify: `src/main.tsx`
- Create: `src/pages/Home.tsx`
- Create: `src/pages/DistrictDetail.tsx`
- Create: `src/pages/PartyNetwork.tsx`
- Create: `src/pages/CommitteeNetwork.tsx`
- Create: `src/pages/NotFound.tsx`
- Create: `src/components/Layout.tsx`
- Modify: `src/index.css`

**Step 1: Setup Tailwind in index.css**

Edit `src/index.css`:
```css
@tailwind base;
@tailwind components;
@tailwind utilities;

:root {
  font-family: Inter, system-ui, Avenir, Helvetica, Arial, sans-serif;
  line-height: 1.5;
  font-weight: 400;
}

body {
  margin: 0;
  min-height: 100vh;
}
```

**Step 2: Create Layout component**

Create `src/components/Layout.tsx`:
```typescript
import { Link, Outlet } from 'react-router-dom';
import { OFFICIAL_MAPS_URL, LEGISLATURE_URL } from '@/lib/constants';

export function Layout() {
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <Link to="/" className="text-xl font-semibold text-gray-900">
              Arizona Legislature Map
            </Link>
            <nav className="flex gap-6">
              <Link to="/" className="text-gray-600 hover:text-gray-900">
                Map
              </Link>
              <Link to="/network/party" className="text-gray-600 hover:text-gray-900">
                Party Network
              </Link>
              <Link to="/network/committees" className="text-gray-600 hover:text-gray-900">
                Committees
              </Link>
              <a
                href={LEGISLATURE_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-600 hover:text-gray-900"
              >
                Legislature →
              </a>
            </nav>
          </div>
        </div>
      </header>

      <main>
        <Outlet />
      </main>

      <footer className="bg-white border-t mt-12">
        <div className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
          <p className="text-sm text-gray-500">
            District boundaries from{' '}
            <a
              href={OFFICIAL_MAPS_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:underline"
            >
              Arizona Independent Redistricting Commission
            </a>
          </p>
        </div>
      </footer>
    </div>
  );
}
```

**Step 3: Create placeholder pages**

Create `src/pages/Home.tsx`:
```typescript
export function Home() {
  return (
    <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-4">
        Arizona Legislative Districts
      </h1>
      <p className="text-gray-600">
        Interactive map coming soon...
      </p>
    </div>
  );
}
```

Create `src/pages/DistrictDetail.tsx`:
```typescript
import { useParams } from 'react-router-dom';

export function DistrictDetail() {
  const { id } = useParams<{ id: string }>();

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-bold text-gray-900">
        District {id}
      </h1>
      <p className="text-gray-600 mt-4">
        District details coming soon...
      </p>
    </div>
  );
}
```

Create `src/pages/PartyNetwork.tsx`:
```typescript
export function PartyNetwork() {
  return (
    <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-bold text-gray-900">
        Party Network Visualization
      </h1>
      <p className="text-gray-600 mt-4">
        Network graph coming soon...
      </p>
    </div>
  );
}
```

Create `src/pages/CommitteeNetwork.tsx`:
```typescript
export function CommitteeNetwork() {
  return (
    <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-bold text-gray-900">
        Committee Network Visualization
      </h1>
      <p className="text-gray-600 mt-4">
        Network graph coming soon...
      </p>
    </div>
  );
}
```

Create `src/pages/NotFound.tsx`:
```typescript
import { Link } from 'react-router-dom';

export function NotFound() {
  return (
    <div className="max-w-7xl mx-auto px-4 py-16 sm:px-6 lg:px-8 text-center">
      <h1 className="text-4xl font-bold text-gray-900 mb-4">404</h1>
      <p className="text-gray-600 mb-8">Page not found</p>
      <Link to="/" className="text-blue-600 hover:underline">
        Return home
      </Link>
    </div>
  );
}
```

**Step 4: Setup React Router in App.tsx**

Create `src/App.tsx`:
```typescript
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Layout } from '@/components/Layout';
import { Home } from '@/pages/Home';
import { DistrictDetail } from '@/pages/DistrictDetail';
import { PartyNetwork } from '@/pages/PartyNetwork';
import { CommitteeNetwork } from '@/pages/CommitteeNetwork';
import { NotFound } from '@/pages/NotFound';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 3,
      refetchOnWindowFocus: false,
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter basename="/az_leg">
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<Home />} />
            <Route path="district/:id" element={<DistrictDetail />} />
            <Route path="network/party" element={<PartyNetwork />} />
            <Route path="network/committees" element={<CommitteeNetwork />} />
            <Route path="*" element={<NotFound />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;
```

**Step 5: Update main.tsx**

Edit `src/main.tsx`:
```typescript
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
```

**Step 6: Test routing**

Run:
```bash
npm run dev
```

Expected: Dev server starts, navigate to pages, routing works

**Step 7: Commit**

```bash
git add src/
git commit -m "feat: setup React Router and app structure with layout"
```

---

## Task 6: MapLibre Map Component

**Files:**
- Create: `src/components/Map/MapContainer.tsx`
- Create: `src/components/Map/useMapInstance.ts`
- Create: `src/components/Map/index.ts`
- Modify: `src/lib/constants.ts`

**Step 1: Update MapLibre style URL in constants**

Note: User needs to get their own MapTiler API key or use a free style.

Edit `src/lib/constants.ts`, add:
```typescript
// Use OpenStreetMap-based free style
export const MAPLIBRE_STYLE = {
  version: 8,
  sources: {
    'osm': {
      type: 'raster',
      tiles: ['https://a.tile.openstreetmap.org/{z}/{x}/{y}.png'],
      tileSize: 256,
      attribution: '&copy; OpenStreetMap Contributors',
      maxzoom: 19
    }
  },
  layers: [
    {
      id: 'osm',
      type: 'raster',
      source: 'osm'
    }
  ]
};

export const ARIZONA_BOUNDS: [number, number, number, number] = [
  -114.8, 31.3, -109.0, 37.0
]; // [west, south, east, north]

export const ARIZONA_CENTER: [number, number] = [-111.9, 34.0];
```

**Step 2: Create MapLibre hook**

Create `src/components/Map/useMapInstance.ts`:
```typescript
import { useEffect, useRef, useState } from 'react';
import maplibregl, { Map, LngLatBoundsLike } from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { MAPLIBRE_STYLE, ARIZONA_CENTER } from '@/lib/constants';

interface UseMapInstanceOptions {
  onLoad?: (map: Map) => void;
  center?: [number, number];
  zoom?: number;
  bounds?: LngLatBoundsLike;
}

export function useMapInstance({
  onLoad,
  center = ARIZONA_CENTER,
  zoom = 6,
  bounds,
}: UseMapInstanceOptions = {}) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<Map | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    if (!mapContainer.current || map.current) return;

    map.current = new maplibregl.Map({
      container: mapContainer.current,
      style: MAPLIBRE_STYLE as any,
      center,
      zoom,
      bounds,
    });

    map.current.addControl(new maplibregl.NavigationControl(), 'top-right');

    map.current.on('load', () => {
      setIsLoaded(true);
      if (onLoad && map.current) {
        onLoad(map.current);
      }
    });

    return () => {
      map.current?.remove();
      map.current = null;
    };
  }, []);

  return { mapContainer, map: map.current, isLoaded };
}
```

**Step 3: Create MapContainer component**

Create `src/components/Map/MapContainer.tsx`:
```typescript
import { ReactNode } from 'react';
import { useMapInstance } from './useMapInstance';
import { Map, LngLatBoundsLike } from 'maplibre-gl';

interface MapContainerProps {
  onLoad?: (map: Map) => void;
  center?: [number, number];
  zoom?: number;
  bounds?: LngLatBoundsLike;
  className?: string;
  children?: ReactNode;
}

export function MapContainer({
  onLoad,
  center,
  zoom,
  bounds,
  className = 'h-[600px] w-full',
  children,
}: MapContainerProps) {
  const { mapContainer, isLoaded } = useMapInstance({
    onLoad,
    center,
    zoom,
    bounds,
  });

  return (
    <div className="relative">
      <div ref={mapContainer} className={className} />
      {!isLoaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
          <div className="text-center">
            <div className="animate-spin h-8 w-8 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-2" />
            <p className="text-gray-600">Loading map...</p>
          </div>
        </div>
      )}
      {isLoaded && children}
    </div>
  );
}
```

**Step 4: Create index barrel export**

Create `src/components/Map/index.ts`:
```typescript
export { MapContainer } from './MapContainer';
export { useMapInstance } from './useMapInstance';
```

**Step 5: Test map rendering**

Update `src/pages/Home.tsx`:
```typescript
import { MapContainer } from '@/components/Map';
import { ARIZONA_BOUNDS } from '@/lib/constants';

export function Home() {
  return (
    <div>
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Arizona Legislative Districts
          </h1>
          <p className="text-gray-600">
            Explore the 30 legislative districts and their representatives
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
        <MapContainer
          bounds={ARIZONA_BOUNDS}
          className="h-[600px] w-full rounded-lg shadow-lg"
        />
      </div>
    </div>
  );
}
```

**Step 6: Run dev server and verify map loads**

Run:
```bash
npm run dev
```

Expected: Map renders with OSM tiles, centered on Arizona

**Step 7: Commit**

```bash
git add src/components/Map/ src/pages/Home.tsx src/lib/constants.ts
git commit -m "feat: add MapLibre map component with Arizona bounds"
```

---

## Task 7: District Boundaries Layer

**Files:**
- Create: `src/components/Map/DistrictLayer.tsx`
- Create: `src/components/Map/useDistrictLayer.ts`
- Modify: `src/pages/Home.tsx`

**Step 1: Create district layer hook**

Create `src/components/Map/useDistrictLayer.ts`:
```typescript
import { useEffect } from 'react';
import { Map, GeoJSONSource } from 'maplibre-gl';
import { DistrictGeoJSON } from '@/types/district';
import { PARTY_COLORS_LIGHT } from '@/lib/constants';
import { useLegislators } from '@/lib/api/queries';

interface UseDistrictLayerOptions {
  map: Map | null;
  data: DistrictGeoJSON | undefined;
  isLoaded: boolean;
}

export function useDistrictLayer({
  map,
  data,
  isLoaded,
}: UseDistrictLayerOptions) {
  const { data: legislators } = useLegislators();

  useEffect(() => {
    if (!map || !isLoaded || !data || !legislators) return;

    // Add source
    if (!map.getSource('districts')) {
      map.addSource('districts', {
        type: 'geojson',
        data,
      });
    }

    // Add fill layer
    if (!map.getLayer('districts-fill')) {
      map.addLayer({
        id: 'districts-fill',
        type: 'fill',
        source: 'districts',
        paint: {
          'fill-color': [
            'case',
            ['has', 'DISTRICT'],
            [
              'match',
              ['get', 'DISTRICT'],
              ...legislators.districts.flatMap(d => [
                d.id,
                d.senator.party === 'R' ? PARTY_COLORS_LIGHT.R : PARTY_COLORS_LIGHT.D
              ]),
              '#94a3b820' // fallback
            ],
            '#94a3b820' // fallback
          ],
          'fill-opacity': 0.6,
        },
      });
    }

    // Add border layer
    if (!map.getLayer('districts-border')) {
      map.addLayer({
        id: 'districts-border',
        type: 'line',
        source: 'districts',
        paint: {
          'line-color': '#1f2937',
          'line-width': 1,
        },
      });
    }

    // Add hover effect
    let hoveredDistrictId: string | number | null = null;

    map.on('mousemove', 'districts-fill', (e) => {
      if (e.features && e.features.length > 0) {
        map.getCanvas().style.cursor = 'pointer';

        if (hoveredDistrictId !== null) {
          map.setFeatureState(
            { source: 'districts', id: hoveredDistrictId },
            { hover: false }
          );
        }

        hoveredDistrictId = e.features[0].id ?? null;

        if (hoveredDistrictId !== null) {
          map.setFeatureState(
            { source: 'districts', id: hoveredDistrictId },
            { hover: true }
          );
        }
      }
    });

    map.on('mouseleave', 'districts-fill', () => {
      map.getCanvas().style.cursor = '';
      if (hoveredDistrictId !== null) {
        map.setFeatureState(
          { source: 'districts', id: hoveredDistrictId },
          { hover: false }
        );
      }
      hoveredDistrictId = null;
    });

    return () => {
      if (map.getLayer('districts-fill')) {
        map.removeLayer('districts-fill');
      }
      if (map.getLayer('districts-border')) {
        map.removeLayer('districts-border');
      }
      if (map.getSource('districts')) {
        map.removeSource('districts');
      }
    };
  }, [map, isLoaded, data, legislators]);
}
```

**Step 2: Create DistrictLayer component**

Create `src/components/Map/DistrictLayer.tsx`:
```typescript
import { Map } from 'maplibre-gl';
import { useDistrictBoundaries } from '@/lib/api/queries';
import { useDistrictLayer } from './useDistrictLayer';

interface DistrictLayerProps {
  map: Map | null;
  isLoaded: boolean;
}

export function DistrictLayer({ map, isLoaded }: DistrictLayerProps) {
  const { data, isLoading, error } = useDistrictBoundaries();

  useDistrictLayer({ map, data, isLoaded });

  if (error) {
    return (
      <div className="absolute top-4 left-4 bg-red-50 border border-red-200 rounded-lg p-4 max-w-sm">
        <p className="text-sm text-red-800">
          Failed to load district boundaries. Using cached data if available.
        </p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="absolute top-4 left-4 bg-white rounded-lg shadow-lg p-3">
        <p className="text-sm text-gray-600">Loading district boundaries...</p>
      </div>
    );
  }

  return null;
}
```

**Step 3: Update Map barrel export**

Edit `src/components/Map/index.ts`:
```typescript
export { MapContainer } from './MapContainer';
export { useMapInstance } from './useMapInstance';
export { DistrictLayer } from './DistrictLayer';
export { useDistrictLayer } from './useDistrictLayer';
```

**Step 4: Update Home page to use DistrictLayer**

Edit `src/pages/Home.tsx`:
```typescript
import { useState } from 'react';
import { Map } from 'maplibre-gl';
import { MapContainer, DistrictLayer } from '@/components/Map';
import { ARIZONA_BOUNDS } from '@/lib/constants';

export function Home() {
  const [map, setMap] = useState<Map | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  const handleMapLoad = (mapInstance: Map) => {
    setMap(mapInstance);
    setIsLoaded(true);
  };

  return (
    <div>
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Arizona Legislative Districts
          </h1>
          <p className="text-gray-600">
            Explore the 30 legislative districts and their representatives
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
        <MapContainer
          bounds={ARIZONA_BOUNDS}
          className="h-[600px] w-full rounded-lg shadow-lg"
          onLoad={handleMapLoad}
        >
          <DistrictLayer map={map} isLoaded={isLoaded} />
        </MapContainer>
      </div>
    </div>
  );
}
```

**Step 5: Test district boundaries render**

Run:
```bash
npm run dev
```

Expected: Map shows colored district boundaries based on party control

**Step 6: Commit**

```bash
git add src/components/Map/ src/pages/Home.tsx
git commit -m "feat: add district boundaries layer with party-based coloring"
```

---

## Task 8: Map Tooltips & Popups

**Files:**
- Create: `src/components/Map/DistrictTooltip.tsx`
- Create: `src/components/Map/DistrictPopup.tsx`
- Create: `src/components/Map/useMapInteractions.ts`
- Modify: `src/components/Map/DistrictLayer.tsx`

**Step 1: Create tooltip component**

Create `src/components/Map/DistrictTooltip.tsx`:
```typescript
import { createPortal } from 'react-dom';

interface DistrictTooltipProps {
  x: number;
  y: number;
  districtNumber: number;
  senatorName: string;
}

export function DistrictTooltip({
  x,
  y,
  districtNumber,
  senatorName,
}: DistrictTooltipProps) {
  return createPortal(
    <div
      className="absolute z-10 bg-gray-900 text-white text-sm rounded-lg py-2 px-3 pointer-events-none"
      style={{
        left: `${x}px`,
        top: `${y}px`,
        transform: 'translate(-50%, -120%)',
      }}
    >
      <div className="font-semibold">District {districtNumber}</div>
      <div className="text-gray-300">{senatorName}</div>
    </div>,
    document.body
  );
}
```

**Step 2: Create popup component**

Create `src/components/Map/DistrictPopup.tsx`:
```typescript
import { useNavigate } from 'react-router-dom';
import { District } from '@/types/district';
import { getPartyLabel } from '@/lib/utils';
import { PARTY_COLORS } from '@/lib/constants';

interface DistrictPopupProps {
  district: District;
  onClose: () => void;
}

export function DistrictPopup({ district, onClose }: DistrictPopupProps) {
  const navigate = useNavigate();

  const handleViewDetails = () => {
    navigate(`/district/${district.id}`);
  };

  return (
    <div className="bg-white rounded-lg shadow-xl p-4 min-w-[280px]">
      <div className="flex items-start justify-between mb-3">
        <h3 className="text-lg font-semibold text-gray-900">
          District {district.id}
        </h3>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-gray-600"
          aria-label="Close"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <div className="space-y-2 mb-4">
        <div className="flex items-center gap-2">
          <div
            className="w-3 h-3 rounded-full"
            style={{ backgroundColor: PARTY_COLORS[district.senator.party] }}
          />
          <span className="text-sm text-gray-600">
            {getPartyLabel(district.senator.party)} Control
          </span>
        </div>

        <div>
          <div className="text-xs text-gray-500 uppercase tracking-wide">Senator</div>
          <div className="text-sm font-medium text-gray-900">
            {district.senator.name}
          </div>
        </div>

        <div>
          <div className="text-xs text-gray-500 uppercase tracking-wide">Major Cities</div>
          <div className="text-sm text-gray-700">
            {district.majorCities.slice(0, 3).join(', ')}
          </div>
        </div>
      </div>

      <button
        onClick={handleViewDetails}
        className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
      >
        View Details
      </button>
    </div>
  );
}
```

**Step 3: Create map interactions hook**

Create `src/components/Map/useMapInteractions.ts`:
```typescript
import { useState, useEffect, useCallback } from 'react';
import { Map, MapMouseEvent, Popup } from 'maplibre-gl';
import { District } from '@/types/district';
import { useLegislators } from '@/lib/api/queries';

interface TooltipState {
  x: number;
  y: number;
  districtNumber: number;
  senatorName: string;
}

export function useMapInteractions(map: Map | null, isLoaded: boolean) {
  const [tooltip, setTooltip] = useState<TooltipState | null>(null);
  const [selectedDistrict, setSelectedDistrict] = useState<District | null>(null);
  const [popup, setPopup] = useState<Popup | null>(null);
  const { data: legislators } = useLegislators();

  const handleMouseMove = useCallback((e: MapMouseEvent) => {
    const features = map?.queryRenderedFeatures(e.point, {
      layers: ['districts-fill'],
    });

    if (features && features.length > 0 && legislators) {
      const districtNumber = features[0].properties?.DISTRICT;
      const district = legislators.districts.find(d => d.id === districtNumber);

      if (district) {
        setTooltip({
          x: e.originalEvent.clientX,
          y: e.originalEvent.clientY,
          districtNumber: district.id,
          senatorName: district.senator.name,
        });
      }
    } else {
      setTooltip(null);
    }
  }, [map, legislators]);

  const handleClick = useCallback((e: MapMouseEvent) => {
    const features = map?.queryRenderedFeatures(e.point, {
      layers: ['districts-fill'],
    });

    if (features && features.length > 0 && legislators && map) {
      const districtNumber = features[0].properties?.DISTRICT;
      const district = legislators.districts.find(d => d.id === districtNumber);

      if (district) {
        // Remove existing popup
        popup?.remove();

        // Create new popup
        const newPopup = new Popup({
          closeButton: false,
          closeOnClick: false,
          offset: 10,
        })
          .setLngLat(e.lngLat)
          .setHTML('<div id="popup-content"></div>')
          .addTo(map);

        setPopup(newPopup);
        setSelectedDistrict(district);
      }
    }
  }, [map, legislators, popup]);

  const closePopup = useCallback(() => {
    popup?.remove();
    setPopup(null);
    setSelectedDistrict(null);
  }, [popup]);

  useEffect(() => {
    if (!map || !isLoaded) return;

    map.on('mousemove', 'districts-fill', handleMouseMove);
    map.on('mouseleave', 'districts-fill', () => setTooltip(null));
    map.on('click', 'districts-fill', handleClick);

    return () => {
      map.off('mousemove', 'districts-fill', handleMouseMove);
      map.off('mouseleave', 'districts-fill', () => setTooltip(null));
      map.off('click', 'districts-fill', handleClick);
    };
  }, [map, isLoaded, handleMouseMove, handleClick]);

  return {
    tooltip,
    selectedDistrict,
    closePopup,
  };
}
```

**Step 4: Update DistrictLayer to use interactions**

Edit `src/components/Map/DistrictLayer.tsx`:
```typescript
import { useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { Map } from 'maplibre-gl';
import { useDistrictBoundaries } from '@/lib/api/queries';
import { useDistrictLayer } from './useDistrictLayer';
import { useMapInteractions } from './useMapInteractions';
import { DistrictTooltip } from './DistrictTooltip';
import { DistrictPopup } from './DistrictPopup';

interface DistrictLayerProps {
  map: Map | null;
  isLoaded: boolean;
}

export function DistrictLayer({ map, isLoaded }: DistrictLayerProps) {
  const { data, isLoading, error } = useDistrictBoundaries();
  const { tooltip, selectedDistrict, closePopup } = useMapInteractions(map, isLoaded);

  useDistrictLayer({ map, data, isLoaded });

  // Render popup into MapLibre popup container
  useEffect(() => {
    if (selectedDistrict) {
      const popupContent = document.getElementById('popup-content');
      if (popupContent) {
        const root = createRoot(popupContent);
        root.render(
          <DistrictPopup district={selectedDistrict} onClose={closePopup} />
        );

        return () => {
          root.unmount();
        };
      }
    }
  }, [selectedDistrict, closePopup]);

  if (error) {
    return (
      <div className="absolute top-4 left-4 bg-red-50 border border-red-200 rounded-lg p-4 max-w-sm">
        <p className="text-sm text-red-800">
          Failed to load district boundaries. Using cached data if available.
        </p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="absolute top-4 left-4 bg-white rounded-lg shadow-lg p-3">
        <p className="text-sm text-gray-600">Loading district boundaries...</p>
      </div>
    );
  }

  return (
    <>
      {tooltip && (
        <DistrictTooltip
          x={tooltip.x}
          y={tooltip.y}
          districtNumber={tooltip.districtNumber}
          senatorName={tooltip.senatorName}
        />
      )}
    </>
  );
}
```

**Step 5: Update Map index exports**

Edit `src/components/Map/index.ts`:
```typescript
export { MapContainer } from './MapContainer';
export { useMapInstance } from './useMapInstance';
export { DistrictLayer } from './DistrictLayer';
export { useDistrictLayer } from './useDistrictLayer';
export { useMapInteractions } from './useMapInteractions';
export { DistrictTooltip } from './DistrictTooltip';
export { DistrictPopup } from './DistrictPopup';
```

**Step 6: Test tooltip and popup interactions**

Run:
```bash
npm run dev
```

Expected: Hover shows tooltip, click shows popup with district info

**Step 7: Commit**

```bash
git add src/components/Map/
git commit -m "feat: add map tooltips and popups for district interaction"
```

---

Due to length constraints, I'll continue with the remaining tasks in a structured format:

## Remaining Tasks Summary

**Task 9: District Detail Page Implementation**
- Build full district page with map focus
- Representative cards with contact info
- Committee memberships
- Navigation between districts

**Task 10: Committee Data Scraper**
- Build Puppeteer/Cheerio scraper for azleg.gov
- Parse committee membership
- Generate committees.json

**Task 11: Party Network Visualization**
- Implement React Force Graph
- Party-based node coloring
- Geographic adjacency links
- Interactive filters

**Task 12: Committee Network Visualization**
- Committee-based force graph
- Shared membership links
- Search and highlight

**Task 13: GitHub Actions Deployment**
- Create workflow file
- Configure gh-pages deployment
- Test automated builds

**Task 14: Testing & Polish**
- Error boundaries
- Loading states
- Accessibility audit
- Performance optimization

Would you like me to continue with the detailed steps for these remaining tasks?
