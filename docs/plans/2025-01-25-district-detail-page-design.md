# District Detail Page Design

**Date:** 2025-01-25
**Purpose:** Comprehensive contact-focused district detail pages with state and federal representatives

## Overview

Create detailed district pages that serve as contact hubs for both state legislative and federal congressional representatives. Pages feature an interactive mini-map with toggle between state and federal districts, representative contact cards, and rich contextual information.

## User Goals

**Primary:** Make it easy to contact representatives
**Secondary:** Understand district geography and representative responsibilities

## Architecture

### Page Layout

**Two-Column Responsive Layout:**

**Desktop (lg+):**
- Left sidebar (sticky): Interactive map + district info card
- Right main area: Representative cards (senator, 2 house reps, federal rep)
- Breadcrumb: Home > District X

**Mobile (<lg):**
- Single column stack
- Map at top (non-sticky)
- District info
- Representative cards

### Component Structure

**Main Component:** `src/pages/DistrictDetail.tsx`
- Fetches district data: `useDistrict(id)`
- Fetches boundary: `useSingleDistrictBoundary(id)`
- Fetches federal mapping: `useFederalMapping()`
- Manages loading/error states
- Renders layout with breadcrumb

**New Components:**

1. **`src/components/District/DistrictMap.tsx`**
   - Interactive mini-map (400px height)
   - Toggle: State (30 districts) vs Federal (9 districts)
   - Focused on current district boundary
   - Click neighbors to navigate
   - Reuses MapContainer and district layer logic

2. **`src/components/District/DistrictToggle.tsx`**
   - Radio button group: "State Legislative" | "Federal Congressional"
   - Positioned top-left of map
   - Controls which boundary layer is visible

3. **`src/components/District/DistrictInfo.tsx`**
   - Compact info card
   - District name/number
   - Party control indicator (colored dot)
   - Major cities list
   - "View on Main Map" link

4. **`src/components/District/LegislatorCard.tsx`**
   - Reusable card for any legislator
   - Header: Name (bold, xl) + Party badge (colored pill)
   - Subheader: Chamber label (Senator, Representative, U.S. House)
   - Contact section with icons:
     - Phone (formatted with formatPhone util)
     - Email (mailto link)
     - Website (external link)
   - Bio text (if available, with read more expander)
   - Committee memberships (gray pills/tags)
   - Primary CTA: "Visit Official Page" button (blue, full-width)

### Data Structure

**New Data Files:**

**`src/data/federal-mapping.json`**
```json
{
  "stateToFederal": {
    "1": 4,
    "2": 1,
    // ... all 30 state districts mapped to federal district 1-9
  },
  "congressMembers": [
    {
      "district": 1,
      "name": "Representative Name",
      "party": "R" | "D",
      "office": {
        "phone": "202-225-XXXX",
        "email": "contact@house.gov",
        "website": "https://..."
      },
      "bio": "Optional bio text"
    }
    // All 9 federal House members
  ]
}
```

**Data Sources:**
- State legislators: Existing `src/data/legislators.json`
- State boundaries: Existing ArcGIS service
- Federal boundaries: ArcGIS Congressional Districts service (to be found)
- Federal mapping: Manual creation
- Congress members: Manual data entry from house.gov

### API Layer

**New API Client (`src/lib/api/federal.ts`):**
```typescript
fetchFederalDistrictBoundaries(): Promise<DistrictGeoJSON>
fetchSingleFederalDistrict(districtId: number): Promise<DistrictGeoJSON>
```

**New React Query Hooks (`src/lib/api/queries.ts`):**
```typescript
useFederalBoundaries() - All 9 congressional districts
useFederalMapping() - State-to-federal mapping + congress members
useCongressMember(districtId: number) - Single congress member
useSingleFederalBoundary(districtId: number) - Single federal district boundary
```

**Caching:**
- Federal boundaries: 24hr staleTime (same as state)
- Federal mapping: Infinity (local JSON)
- Retry: 3 attempts for all API calls

## Visual Design

**Color System:**
- Republican: #ef4444 (red)
- Democratic: #3b82f6 (blue)
- Backgrounds: gray-50, white cards
- Borders: gray-200

**LegislatorCard Styling:**
- Background: white
- Shadow: shadow-lg
- Rounded: rounded-lg
- Padding: p-6
- Margin: mb-6 between cards
- Party badge: px-3 py-1, rounded-full, colored bg
- Committee pills: text-xs, gray bg, rounded
- Button: bg-blue-600, hover:bg-blue-700

**DistrictMap:**
- Height: 400px (vs 600px on home)
- Rounded: rounded-lg
- Shadow: shadow-lg
- Highlighted district: thicker border (3px vs 1px)
- Same party coloring as main map

**DistrictInfo Card:**
- Compact white card
- Cities: comma-separated, gray text
- Link: blue-600 with underline on hover

**Toggle Button:**
- Segmented control style
- Selected: blue bg, white text
- Unselected: white bg, gray text
- Position: absolute top-4 left-4 on map

## Map Toggle Functionality

**State View (Default):**
- Shows all 30 state legislative districts
- Current district highlighted
- Party coloring based on senator
- Click district → navigate to `/district/:id`

**Federal View:**
- Shows all 9 U.S. House districts
- Highlights federal district containing current state district
- Party coloring based on congress member
- Click federal district → navigate to first state district in that federal area

**Toggle Behavior:**
- Switches visible GeoJSON layer
- Maintains zoom/center on current location
- Updates legend/UI to match selected view

## Error Handling

**404 - District Not Found:**
- Invalid district ID (not 1-30)
- Display: "District not found" message
- Action: "Return to Map" button → home page
- Don't crash, render error state

**API Failures:**

**District Data Fails:**
- Show error banner: "Unable to load district information"
- Fallback: Show district ID and map only
- Retry button available

**Boundary Fails:**
- Show all data except map
- Message: "Map temporarily unavailable"
- Use cached data if available

**Federal Data Fails:**
- Hide federal section entirely
- Show only state representatives
- No error message (graceful degradation)

**Loading States:**
- Skeleton loaders for cards
- Map spinner (reuse existing)
- Progressive: Show state data first, federal loads after

## Navigation

**URL Structure:**
- State districts: `/district/:id` (1-30)
- Keep simple, no separate federal URLs

**Breadcrumb:**
- Always: Home > District X
- X = state district number

**Map Navigation:**
- Clicking state district → `/district/:id`
- Clicking federal district → `/district/:firstStateId` (first state district in that federal district)

**Back to Main Map:**
- "View on Main Map" link in DistrictInfo card
- Navigates to home page

## Data Requirements

**To Be Created:**

1. **Federal-to-State Mapping:**
   - Research which state districts fall within each federal district
   - Create lookup table: 30 state → 9 federal mappings

2. **Congress Members Data:**
   - Collect all 9 Arizona U.S. House members
   - Name, party, office contact info, websites
   - Optional bios

3. **Federal Boundaries:**
   - Find ArcGIS service URL for congressional districts
   - Verify field names and structure
   - Test GeoJSON output

4. **TypeScript Types:**
   - CongressMember interface
   - FederalMapping interface
   - Update District types if needed

## Implementation Priority

**Phase 1: Core Detail Page**
1. LegislatorCard component
2. DistrictInfo component
3. DistrictDetail page with state data only
4. Basic layout and styling

**Phase 2: Interactive Map**
5. DistrictMap component (state only)
6. Map click navigation
7. Focused district highlighting

**Phase 3: Federal Integration**
8. Create federal-mapping.json
9. Federal API client and hooks
10. DistrictToggle component
11. Federal layer on map
12. Federal representative card

**Phase 4: Polish**
13. Loading states and skeletons
14. Error handling
15. Responsive design refinement
16. Accessibility audit

## Success Criteria

- User can quickly find contact info for their 3 state legislators
- Map provides geographic context and easy navigation
- Federal toggle shows broader political context
- Page loads fast (<2s) with progressive enhancement
- Works on mobile and desktop
- Gracefully handles errors and missing data
- All contact links functional
