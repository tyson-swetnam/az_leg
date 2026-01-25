# District Detail Page Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build comprehensive district detail pages with state legislative and federal congressional representatives, interactive map toggle, and contact-focused design.

**Architecture:** Two-column layout with sticky sidebar (map + district info) and main content area (representative cards). Uses existing data hooks for state data, adds new federal data layer with manual state-to-federal mapping. Map toggle switches between state (30) and federal (9) district boundaries.

**Tech Stack:** React, TypeScript, MapLibre GL JS, React Query, Tailwind CSS

---

## Task 1: Federal Data - Congress Members & Mapping

**Files:**
- Create: `src/data/federal-mapping.json`
- Create: `src/types/federal.ts`

**Step 1: Research federal district mapping**

Research which U.S. House district each state legislative district falls into. Use:
- https://redistricting-irc-az.hub.arcgis.com/pages/official-maps
- Compare state legislative map with congressional map
- Arizona has 9 congressional districts, 30 state legislative districts

Expected: Mapping table: State district 1-30 → Federal district 1-9

**Step 2: Create federal TypeScript types**

Create `src/types/federal.ts`:
```typescript
export interface CongressMember {
  district: number; // 1-9
  name: string;
  party: 'R' | 'D';
  office: {
    phone: string;
    email: string;
    website: string;
  };
  bio?: string;
}

export interface FederalMapping {
  stateToFederal: Record<string, number>; // "1" -> 4
  congressMembers: CongressMember[];
}
```

**Step 3: Create federal mapping data file**

Create `src/data/federal-mapping.json`:
```json
{
  "stateToFederal": {
    "1": 4,
    "2": 1,
    "3": 1,
    "4": 1,
    "5": 3,
    "6": 2,
    "7": 2,
    "8": 3,
    "9": 4,
    "10": 1,
    "11": 3,
    "12": 3,
    "13": 1,
    "14": 5,
    "15": 5,
    "16": 5,
    "17": 6,
    "18": 6,
    "19": 6,
    "20": 6,
    "21": 6,
    "22": 7,
    "23": 9,
    "24": 3,
    "25": 8,
    "26": 3,
    "27": 8,
    "28": 8,
    "29": 8,
    "30": 9
  },
  "congressMembers": [
    {
      "district": 1,
      "name": "David Schweikert",
      "party": "R",
      "office": {
        "phone": "202-225-2190",
        "email": "contact@schweikert.house.gov",
        "website": "https://schweikert.house.gov"
      }
    },
    {
      "district": 2,
      "name": "Eli Crane",
      "party": "R",
      "office": {
        "phone": "202-225-3361",
        "email": "contact@crane.house.gov",
        "website": "https://crane.house.gov"
      }
    },
    {
      "district": 3,
      "name": "Ruben Gallego",
      "party": "D",
      "office": {
        "phone": "202-225-4065",
        "email": "contact@gallego.house.gov",
        "website": "https://rubengallego.house.gov"
      }
    },
    {
      "district": 4,
      "name": "Greg Stanton",
      "party": "D",
      "office": {
        "phone": "202-225-9888",
        "email": "contact@stanton.house.gov",
        "website": "https://stanton.house.gov"
      }
    },
    {
      "district": 5,
      "name": "Andy Biggs",
      "party": "R",
      "office": {
        "phone": "202-225-2635",
        "email": "contact@biggs.house.gov",
        "website": "https://biggs.house.gov"
      }
    },
    {
      "district": 6,
      "name": "Juan Ciscomani",
      "party": "R",
      "office": {
        "phone": "202-225-2542",
        "email": "contact@ciscomani.house.gov",
        "website": "https://ciscomani.house.gov"
      }
    },
    {
      "district": 7,
      "name": "Raúl Grijalva",
      "party": "D",
      "office": {
        "phone": "202-225-2435",
        "email": "contact@grijalva.house.gov",
        "website": "https://grijalva.house.gov"
      }
    },
    {
      "district": 8,
      "name": "Debbie Lesko",
      "party": "R",
      "office": {
        "phone": "202-225-4576",
        "email": "contact@lesko.house.gov",
        "website": "https://lesko.house.gov"
      }
    },
    {
      "district": 9,
      "name": "Paul Gosar",
      "party": "R",
      "office": {
        "phone": "202-225-2315",
        "email": "contact@gosar.house.gov",
        "website": "https://gosar.house.gov"
      }
    }
  ]
}
```

Note: Verify current congress members and update if needed for 2025.

**Step 4: Commit**

```bash
git add src/data/federal-mapping.json src/types/federal.ts
git commit -m "feat: add federal congressional district mapping and member data"
```

---

## Task 2: Federal API Client & React Query Hooks

**Files:**
- Create: `src/lib/api/federal.ts`
- Modify: `src/lib/api/queries.ts`
- Modify: `src/lib/constants.ts`

**Step 1: Find ArcGIS federal districts service**

Research the correct ArcGIS REST service URL for congressional districts:
```bash
curl -s "https://services8.arcgis.com/x0l81el0LN7X67MM/arcgis/rest/services?f=json" | python3 -m json.tool | grep -i "congressional\|congress"
```

Expected: Find service name like "Approved Official Congressional Map"

**Step 2: Add federal constants**

Edit `src/lib/constants.ts`, add:
```typescript
export const CONGRESSIONAL_DISTRICTS_URL =
  `${ARCGIS_BASE_URL}/Approved Official Congressional Map/FeatureServer/0/query`;
```

**Step 3: Create federal API client**

Create `src/lib/api/federal.ts`:
```typescript
import type { DistrictGeoJSON } from '@/types/district';
import { CONGRESSIONAL_DISTRICTS_URL } from '@/lib/constants';

export async function fetchFederalDistrictBoundaries(): Promise<DistrictGeoJSON> {
  try {
    const params = new URLSearchParams({
      where: '1=1',
      outFields: '*',
      returnGeometry: 'true',
      f: 'geojson',
    });

    const response = await fetch(`${CONGRESSIONAL_DISTRICTS_URL}?${params}`);

    if (!response.ok) {
      throw new Error(`ArcGIS API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return data as DistrictGeoJSON;
  } catch (error) {
    console.error('Error fetching federal district boundaries:', error);
    throw error;
  }
}

export async function fetchSingleFederalDistrict(districtId: number): Promise<DistrictGeoJSON> {
  try {
    const params = new URLSearchParams({
      where: `DISTRICT=${districtId}`,
      outFields: '*',
      returnGeometry: 'true',
      f: 'geojson',
    });

    const response = await fetch(`${CONGRESSIONAL_DISTRICTS_URL}?${params}`);

    if (!response.ok) {
      throw new Error(`ArcGIS API error: ${response.status}`);
    }

    const data = await response.json();
    return data as DistrictGeoJSON;
  } catch (error) {
    console.error(`Error fetching federal district ${districtId}:`, error);
    throw error;
  }
}
```

**Step 4: Add federal React Query hooks**

Edit `src/lib/api/queries.ts`, add:
```typescript
import { fetchFederalDistrictBoundaries, fetchSingleFederalDistrict } from './federal';
import federalMappingData from '@/data/federal-mapping.json';
import type { FederalMapping, CongressMember } from '@/types/federal';

export function useFederalBoundaries() {
  return useQuery({
    queryKey: ['federal-boundaries'],
    queryFn: fetchFederalDistrictBoundaries,
    staleTime: ONE_DAY,
    gcTime: ONE_WEEK,
    refetchOnWindowFocus: false,
    retry: 3,
  });
}

export function useSingleFederalBoundary(districtId: number) {
  return useQuery({
    queryKey: ['federal-boundary', districtId],
    queryFn: () => fetchSingleFederalDistrict(districtId),
    staleTime: ONE_DAY,
    gcTime: ONE_WEEK,
    refetchOnWindowFocus: false,
    retry: 3,
    enabled: !!districtId && districtId >= 1 && districtId <= 9,
  });
}

export function useFederalMapping() {
  return useQuery({
    queryKey: ['federal-mapping'],
    queryFn: async () => federalMappingData as FederalMapping,
    staleTime: Infinity,
    gcTime: Infinity,
  });
}

export function useCongressMember(federalDistrictId: number) {
  const { data: mapping } = useFederalMapping();

  return useQuery({
    queryKey: ['congress-member', federalDistrictId],
    queryFn: async () => {
      const member = mapping?.congressMembers.find(m => m.district === federalDistrictId);
      if (!member) {
        throw new Error(`Congress member for district ${federalDistrictId} not found`);
      }
      return member;
    },
    enabled: !!mapping && !!federalDistrictId,
    staleTime: Infinity,
  });
}
```

**Step 5: Test federal API**

Run dev server and test in browser console:
```javascript
fetch('https://services8.arcgis.com/x0l81el0LN7X67MM/ArcGIS/rest/services/Approved%20Official%20Congressional%20Map/FeatureServer/0/query?where=1=1&outFields=*&returnGeometry=true&f=geojson')
  .then(r => r.json())
  .then(d => console.log('Federal districts:', d.features.length))
```

Expected: Console shows "Federal districts: 9"

**Step 6: Commit**

```bash
git add src/lib/api/federal.ts src/lib/api/queries.ts src/lib/constants.ts
git commit -m "feat: add federal district API client and React Query hooks"
```

---

## Task 3: LegislatorCard Component

**Files:**
- Create: `src/components/District/LegislatorCard.tsx`

**Step 1: Create LegislatorCard component**

Create `src/components/District/LegislatorCard.tsx`:
```typescript
import type { Legislator } from '@/types/legislature';
import type { CongressMember } from '@/types/federal';
import { PARTY_COLORS } from '@/lib/constants';
import { getPartyLabel, formatPhone } from '@/lib/utils';

type LegislatorOrCongress = Legislator | CongressMember;

interface LegislatorCardProps {
  legislator: LegislatorOrCongress;
  chamberLabel: string; // "Senator", "Representative", "U.S. House Representative"
}

export function LegislatorCard({ legislator, chamberLabel }: LegislatorCardProps) {
  const partyColor = PARTY_COLORS[legislator.party];

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <h3 className="text-xl font-bold text-gray-900 mb-1">
            {legislator.name}
          </h3>
          <p className="text-sm text-gray-600">{chamberLabel}</p>
        </div>
        <span
          className="px-3 py-1 rounded-full text-sm font-medium text-white"
          style={{ backgroundColor: partyColor }}
        >
          {legislator.party === 'R' ? 'Republican' : 'Democratic'}
        </span>
      </div>

      {/* Contact Info */}
      <div className="space-y-3 mb-4">
        <div className="flex items-center gap-3 text-gray-700">
          <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
          </svg>
          <span>{formatPhone(legislator.office.phone)}</span>
        </div>

        <div className="flex items-center gap-3 text-gray-700">
          <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
          <a href={`mailto:${legislator.office.email}`} className="text-blue-600 hover:underline">
            {legislator.office.email}
          </a>
        </div>

        <div className="flex items-center gap-3 text-gray-700">
          <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
          </svg>
          <a
            href={legislator.office.website}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 hover:underline"
          >
            Official Website
          </a>
        </div>
      </div>

      {/* Bio (if available) */}
      {'bio' in legislator && legislator.bio && (
        <div className="mb-4">
          <p className="text-sm text-gray-600">{legislator.bio}</p>
        </div>
      )}

      {/* Committees (if available) */}
      {'committees' in legislator && legislator.committees && legislator.committees.length > 0 && (
        <div className="mb-4">
          <p className="text-xs text-gray-500 uppercase tracking-wide mb-2">Committees</p>
          <div className="flex flex-wrap gap-2">
            {legislator.committees.map((committee, idx) => (
              <span
                key={idx}
                className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded"
              >
                {committee}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* CTA Button */}
      <a
        href={legislator.office.website}
        target="_blank"
        rel="noopener noreferrer"
        className="block w-full bg-blue-600 text-white text-center py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
      >
        Visit Official Page
      </a>
    </div>
  );
}
```

**Step 2: Commit**

```bash
git add src/components/District/LegislatorCard.tsx
git commit -m "feat: add LegislatorCard component for district detail page"
```

---

## Task 4: DistrictInfo Component

**Files:**
- Create: `src/components/District/DistrictInfo.tsx`

**Step 1: Create DistrictInfo component**

Create `src/components/District/DistrictInfo.tsx`:
```typescript
import { Link } from 'react-router-dom';
import type { District } from '@/types/district';
import { PARTY_COLORS } from '@/lib/constants';
import { getPartyLabel } from '@/lib/utils';

interface DistrictInfoProps {
  district: District;
}

export function DistrictInfo({ district }: DistrictInfoProps) {
  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">
        {district.name}
      </h2>

      <div className="space-y-3">
        {/* Party Control */}
        <div className="flex items-center gap-2">
          <div
            className="w-3 h-3 rounded-full"
            style={{ backgroundColor: PARTY_COLORS[district.senator.party] }}
          />
          <span className="text-sm text-gray-600">
            {getPartyLabel(district.senator.party)} Control
          </span>
        </div>

        {/* Major Cities */}
        <div>
          <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">
            Major Cities
          </p>
          <p className="text-sm text-gray-700">
            {district.majorCities.join(', ')}
          </p>
        </div>

        {/* Link to main map */}
        <Link
          to="/"
          className="inline-block text-sm text-blue-600 hover:underline mt-2"
        >
          ← View on Main Map
        </Link>
      </div>
    </div>
  );
}
```

**Step 2: Commit**

```bash
git add src/components/District/DistrictInfo.tsx
git commit -m "feat: add DistrictInfo component for district sidebar"
```

---

## Task 5: Basic DistrictDetail Page (State Only)

**Files:**
- Modify: `src/pages/DistrictDetail.tsx`

**Step 1: Update DistrictDetail page with layout**

Edit `src/pages/DistrictDetail.tsx`:
```typescript
import { useParams, Link, Navigate } from 'react-router-dom';
import { useDistrict } from '@/lib/api/queries';
import { LegislatorCard } from '@/components/District/LegislatorCard';
import { DistrictInfo } from '@/components/District/DistrictInfo';

export function DistrictDetail() {
  const { id } = useParams<{ id: string }>();
  const districtId = id ? parseInt(id, 10) : 0;

  const { data: district, isLoading, error } = useDistrict(districtId);

  // Invalid district ID
  if (!id || districtId < 1 || districtId > 30) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 sm:px-6 lg:px-8 text-center">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">District Not Found</h1>
        <p className="text-gray-600 mb-8">
          The district you're looking for doesn't exist.
        </p>
        <Link
          to="/"
          className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700"
        >
          Return to Map
        </Link>
      </div>
    );
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-48 mb-8" />
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="space-y-4">
              <div className="h-96 bg-gray-200 rounded-lg" />
              <div className="h-48 bg-gray-200 rounded-lg" />
            </div>
            <div className="lg:col-span-2 space-y-6">
              <div className="h-64 bg-gray-200 rounded-lg" />
              <div className="h-64 bg-gray-200 rounded-lg" />
              <div className="h-64 bg-gray-200 rounded-lg" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error || !district) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 sm:px-6 lg:px-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <h2 className="text-xl font-semibold text-red-900 mb-2">
            Unable to Load District Information
          </h2>
          <p className="text-red-700 mb-4">
            There was an error loading the district data. Please try again later.
          </p>
          <Link
            to="/"
            className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700"
          >
            Return to Map
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
      {/* Breadcrumb */}
      <nav className="mb-6 text-sm text-gray-600">
        <Link to="/" className="hover:text-gray-900">
          Home
        </Link>
        <span className="mx-2">›</span>
        <span className="text-gray-900">District {district.id}</span>
      </nav>

      {/* Two-column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left sidebar - Map and info */}
        <div className="space-y-6">
          {/* Map placeholder for now */}
          <div className="bg-gray-100 rounded-lg h-96 flex items-center justify-center">
            <p className="text-gray-500">Map coming in next task</p>
          </div>

          {/* District info card */}
          <DistrictInfo district={district} />
        </div>

        {/* Right content - Representative cards */}
        <div className="lg:col-span-2">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            Your Representatives
          </h2>

          {/* Senator */}
          <LegislatorCard
            legislator={district.senator}
            chamberLabel="State Senator"
          />

          {/* House Representatives */}
          <LegislatorCard
            legislator={district.representatives[0]}
            chamberLabel="State Representative"
          />
          <LegislatorCard
            legislator={district.representatives[1]}
            chamberLabel="State Representative"
          />
        </div>
      </div>
    </div>
  );
}
```

**Step 2: Test in browser**

Run dev server and navigate to `/az_leg/district/1`:
- Should show breadcrumb
- Should show district info card
- Should show 3 legislator cards (senator + 2 reps)
- Map placeholder visible

**Step 3: Commit**

```bash
git add src/pages/DistrictDetail.tsx
git commit -m "feat: implement basic district detail page with state legislators"
```

---

## Task 6: DistrictMap Component with Toggle

**Files:**
- Create: `src/components/District/DistrictMap.tsx`
- Create: `src/components/District/DistrictToggle.tsx`

**Step 1: Create DistrictToggle component**

Create `src/components/District/DistrictToggle.tsx`:
```typescript
interface DistrictToggleProps {
  mode: 'state' | 'federal';
  onChange: (mode: 'state' | 'federal') => void;
}

export function DistrictToggle({ mode, onChange }: DistrictToggleProps) {
  return (
    <div className="absolute top-4 left-4 z-10 bg-white rounded-lg shadow-lg p-1 flex gap-1">
      <button
        onClick={() => onChange('state')}
        className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
          mode === 'state'
            ? 'bg-blue-600 text-white'
            : 'text-gray-700 hover:bg-gray-100'
        }`}
      >
        State Legislative
      </button>
      <button
        onClick={() => onChange('federal')}
        className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
          mode === 'federal'
            ? 'bg-blue-600 text-white'
            : 'text-gray-700 hover:bg-gray-100'
        }`}
      >
        Federal Congressional
      </button>
    </div>
  );
}
```

**Step 2: Create DistrictMap component**

Create `src/components/District/DistrictMap.tsx`:
```typescript
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Map as MapLibreMap } from 'maplibre-gl';
import { MapContainer } from '@/components/Map';
import { DistrictToggle } from './DistrictToggle';
import {
  useDistrictBoundaries,
  useFederalBoundaries,
  useLegislators,
  useFederalMapping,
} from '@/lib/api/queries';
import { PARTY_COLORS_LIGHT } from '@/lib/constants';

interface DistrictMapProps {
  districtId: number; // Current state district ID (1-30)
}

export function DistrictMap({ districtId }: DistrictMapProps) {
  const [map, setMap] = useState<MapLibreMap | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [mode, setMode] = useState<'state' | 'federal'>('state');
  const navigate = useNavigate();

  const { data: stateBoundaries } = useDistrictBoundaries();
  const { data: federalBoundaries } = useFederalBoundaries();
  const { data: legislators } = useLegislators();
  const { data: federalMapping } = useFederalMapping();

  const handleMapLoad = (mapInstance: MapLibreMap) => {
    setMap(mapInstance);
    setIsLoaded(true);
  };

  // Add state districts layer
  useEffect(() => {
    if (!map || !isLoaded || !stateBoundaries || !legislators) return;

    if (!map.getSource('state-districts')) {
      map.addSource('state-districts', {
        type: 'geojson',
        data: stateBoundaries,
      });

      // Fill layer
      map.addLayer({
        id: 'state-districts-fill',
        type: 'fill',
        source: 'state-districts',
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
              '#94a3b820'
            ],
            '#94a3b820'
          ],
          'fill-opacity': ['case', ['==', ['get', 'DISTRICT'], districtId], 0.8, 0.4],
        },
      });

      // Border layer
      map.addLayer({
        id: 'state-districts-border',
        type: 'line',
        source: 'state-districts',
        paint: {
          'line-color': '#1f2937',
          'line-width': ['case', ['==', ['get', 'DISTRICT'], districtId], 3, 1],
        },
      });

      // Click handler
      map.on('click', 'state-districts-fill', (e) => {
        if (e.features && e.features.length > 0) {
          const clickedDistrict = e.features[0].properties?.DISTRICT;
          if (clickedDistrict && clickedDistrict !== districtId) {
            navigate(`/district/${clickedDistrict}`);
          }
        }
      });

      // Hover cursor
      map.on('mouseenter', 'state-districts-fill', () => {
        map.getCanvas().style.cursor = 'pointer';
      });
      map.on('mouseleave', 'state-districts-fill', () => {
        map.getCanvas().style.cursor = '';
      });

      // Zoom to current district
      const currentFeature = stateBoundaries.features.find(
        f => f.properties?.DISTRICT === districtId
      );
      if (currentFeature && currentFeature.geometry.type === 'Polygon') {
        const coords = currentFeature.geometry.coordinates[0];
        const bounds = coords.reduce((b: any, c: any) => {
          return b.extend(c);
        }, new maplibregl.LngLatBounds(coords[0], coords[0]));
        map.fitBounds(bounds, { padding: 50 });
      }
    }
  }, [map, isLoaded, stateBoundaries, legislators, districtId, navigate]);

  // Add federal districts layer
  useEffect(() => {
    if (!map || !isLoaded || !federalBoundaries || !federalMapping) return;

    if (!map.getSource('federal-districts')) {
      map.addSource('federal-districts', {
        type: 'geojson',
        data: federalBoundaries,
      });

      const federalDistrictId = federalMapping.stateToFederal[districtId.toString()];

      // Fill layer
      map.addLayer({
        id: 'federal-districts-fill',
        type: 'fill',
        source: 'federal-districts',
        paint: {
          'fill-color': [
            'case',
            ['has', 'DISTRICT'],
            [
              'match',
              ['get', 'DISTRICT'],
              ...federalMapping.congressMembers.flatMap(m => [
                m.district,
                m.party === 'R' ? PARTY_COLORS_LIGHT.R : PARTY_COLORS_LIGHT.D
              ]),
              '#94a3b820'
            ],
            '#94a3b820'
          ],
          'fill-opacity': ['case', ['==', ['get', 'DISTRICT'], federalDistrictId], 0.8, 0.4],
        },
        layout: {
          visibility: 'none',
        },
      });

      // Border layer
      map.addLayer({
        id: 'federal-districts-border',
        type: 'line',
        source: 'federal-districts',
        paint: {
          'line-color': '#1f2937',
          'line-width': ['case', ['==', ['get', 'DISTRICT'], federalDistrictId], 3, 1],
        },
        layout: {
          visibility: 'none',
        },
      });

      // Click handler - navigate to first state district in clicked federal district
      map.on('click', 'federal-districts-fill', (e) => {
        if (e.features && e.features.length > 0) {
          const clickedFederal = e.features[0].properties?.DISTRICT;
          if (clickedFederal) {
            // Find first state district in this federal district
            const firstStateDistrict = Object.entries(federalMapping.stateToFederal)
              .find(([_, fed]) => fed === clickedFederal)?.[0];
            if (firstStateDistrict) {
              navigate(`/district/${firstStateDistrict}`);
            }
          }
        }
      });

      // Hover cursor
      map.on('mouseenter', 'federal-districts-fill', () => {
        map.getCanvas().style.cursor = 'pointer';
      });
      map.on('mouseleave', 'federal-districts-fill', () => {
        map.getCanvas().style.cursor = '';
      });
    }
  }, [map, isLoaded, federalBoundaries, federalMapping, districtId, navigate]);

  // Toggle visibility
  useEffect(() => {
    if (!map || !isLoaded) return;

    if (mode === 'state') {
      map.setLayoutProperty('state-districts-fill', 'visibility', 'visible');
      map.setLayoutProperty('state-districts-border', 'visibility', 'visible');
      map.setLayoutProperty('federal-districts-fill', 'visibility', 'none');
      map.setLayoutProperty('federal-districts-border', 'visibility', 'none');
    } else {
      map.setLayoutProperty('state-districts-fill', 'visibility', 'none');
      map.setLayoutProperty('state-districts-border', 'visibility', 'none');
      map.setLayoutProperty('federal-districts-fill', 'visibility', 'visible');
      map.setLayoutProperty('federal-districts-border', 'visibility', 'visible');
    }
  }, [map, isLoaded, mode]);

  return (
    <div className="relative">
      <MapContainer
        onLoad={handleMapLoad}
        className="h-96 w-full rounded-lg shadow-lg"
      >
        <DistrictToggle mode={mode} onChange={setMode} />
      </MapContainer>
    </div>
  );
}
```

**Step 3: Add missing import**

Note: Need to import maplibregl at top of DistrictMap.tsx:
```typescript
import maplibregl from 'maplibre-gl';
```

**Step 4: Commit**

```bash
git add src/components/District/DistrictMap.tsx src/components/District/DistrictToggle.tsx
git commit -m "feat: add interactive district map with state/federal toggle"
```

---

## Task 7: Integrate Map and Federal Rep into Detail Page

**Files:**
- Modify: `src/pages/DistrictDetail.tsx`

**Step 1: Import and use DistrictMap**

Edit `src/pages/DistrictDetail.tsx`, replace map placeholder:
```typescript
import { DistrictMap } from '@/components/District/DistrictMap';
```

Replace the placeholder div:
```typescript
{/* Map */}
<DistrictMap districtId={districtId} />
```

**Step 2: Add federal representative section**

Add after state representatives, before closing div:
```typescript
import { useFederalMapping, useCongressMember } from '@/lib/api/queries';

// In component, after useDistrict:
const { data: federalMapping } = useFederalMapping();
const federalDistrictId = federalMapping?.stateToFederal[districtId.toString()];
const { data: congressMember, isLoading: congressLoading } = useCongressMember(federalDistrictId || 0);

// Add section after state reps:
{/* Federal Representative */}
{congressMember && (
  <>
    <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">
      Federal Representative
    </h2>
    <p className="text-sm text-gray-600 mb-4">
      U.S. House Representative for Congressional District {congressMember.district}
    </p>
    <LegislatorCard
      legislator={congressMember}
      chamberLabel={`U.S. House - District ${congressMember.district}`}
    />
  </>
)}

{congressLoading && (
  <div className="mt-8">
    <div className="h-48 bg-gray-200 rounded-lg animate-pulse" />
  </div>
)}
```

**Step 3: Test complete page**

Navigate to `/az_leg/district/1`:
- Should show interactive map
- Map should zoom to district 1
- Toggle should switch between state/federal views
- Should show senator + 2 state reps
- Should show federal house representative
- All contact info should be functional

**Step 4: Commit**

```bash
git add src/pages/DistrictDetail.tsx
git commit -m "feat: integrate interactive map and federal rep into district detail"
```

---

## Task 8: Polish and Accessibility

**Files:**
- Modify: `src/components/District/LegislatorCard.tsx`
- Modify: `src/components/District/DistrictToggle.tsx`

**Step 1: Add ARIA labels to LegislatorCard**

Edit `src/components/District/LegislatorCard.tsx`:
```typescript
// On the card div:
<div className="bg-white rounded-lg shadow-lg p-6 mb-6" role="article" aria-label={`${chamberLabel}: ${legislator.name}`}>

// On contact links:
<a href={`mailto:${legislator.office.email}`} className="text-blue-600 hover:underline" aria-label={`Email ${legislator.name}`}>

<a href={legislator.office.website} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline" aria-label={`Visit ${legislator.name}'s official website`}>

// On CTA button:
<a href={legislator.office.website} target="_blank" rel="noopener noreferrer" className="block w-full bg-blue-600 text-white text-center py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors" aria-label={`Visit ${legislator.name}'s official page`}>
```

**Step 2: Add ARIA labels to toggle**

Edit `src/components/District/DistrictToggle.tsx`:
```typescript
<div className="absolute top-4 left-4 z-10 bg-white rounded-lg shadow-lg p-1 flex gap-1" role="group" aria-label="District view toggle">
  <button
    onClick={() => onChange('state')}
    className={...}
    aria-pressed={mode === 'state'}
    aria-label="Show state legislative districts"
  >

  <button
    onClick={() => onChange('federal')}
    className={...}
    aria-pressed={mode === 'federal'}
    aria-label="Show federal congressional districts"
  >
```

**Step 3: Add focus styles**

Add to both files where needed:
```typescript
className="... focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
```

**Step 4: Test keyboard navigation**

- Tab through all interactive elements
- Press Enter on buttons
- Verify focus indicators visible
- Test with screen reader if available

**Step 5: Commit**

```bash
git add src/components/District/
git commit -m "feat: add accessibility improvements to district components"
```

---

## Task 9: Create Component Index Files

**Files:**
- Create: `src/components/District/index.ts`

**Step 1: Create barrel export**

Create `src/components/District/index.ts`:
```typescript
export { LegislatorCard } from './LegislatorCard';
export { DistrictInfo } from './DistrictInfo';
export { DistrictMap } from './DistrictMap';
export { DistrictToggle } from './DistrictToggle';
```

**Step 2: Update imports in DistrictDetail**

Edit `src/pages/DistrictDetail.tsx`, consolidate imports:
```typescript
import {
  LegislatorCard,
  DistrictInfo,
  DistrictMap,
} from '@/components/District';
```

**Step 3: Commit**

```bash
git add src/components/District/index.ts src/pages/DistrictDetail.tsx
git commit -m "refactor: add barrel export for District components"
```

---

## Completion Checklist

**Verify all features work:**
- [ ] Navigate to `/district/1` through `/district/30`
- [ ] Each page shows correct district data
- [ ] Map zooms to correct district
- [ ] Toggle switches between state/federal views
- [ ] Clicking other districts navigates correctly
- [ ] All 3 state legislators shown with contact info
- [ ] Federal representative shown with correct district
- [ ] Contact links (email, website) work
- [ ] Phone numbers formatted correctly
- [ ] Breadcrumb navigation works
- [ ] "View on Main Map" link works
- [ ] Invalid district IDs show 404 page
- [ ] Loading states display correctly
- [ ] Error states handle gracefully
- [ ] Mobile responsive (test on small screen)
- [ ] Keyboard navigation works
- [ ] No console errors

**Final commit:**
```bash
git add -A
git commit -m "feat: complete district detail page with state and federal reps"
git push origin master
```

## Notes

- The federal district mapping in Task 1 is approximate and should be verified against official maps
- Congress member data should be updated for current 2025 session
- The ArcGIS congressional districts URL needs to be found/verified
- Consider adding photos for legislators in future enhancement
- Committee data not yet populated but structure is ready
