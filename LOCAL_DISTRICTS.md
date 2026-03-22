# Local District Map Layers

Additional map layers showing county, city, and precinct-level district boundaries in Arizona.

Last updated: 2026-03-22

## Data Sources

All layers are fetched as GeoJSON from public ArcGIS REST API endpoints. CORS (`Access-Control-Allow-Origin: *`) has been verified for all endpoints.

### Counties

| Layer | Source | Features | Key Fields |
|-------|--------|----------|------------|
| Arizona Counties | ArcGIS Online (`services3.arcgis.com/0OPQIK59PJJqLK0A/`) | 15 | NAME |

### Supervisor Districts

| Layer | Source | Features | Key Fields |
|-------|--------|----------|------------|
| Maricopa County | Maricopa County GIS (2024-) | 5 | bos, BdName |
| Pima County | Pima County GIS (2020 Election) | 5 | DISTRICT, NAME |
| Pinal County | Pinal County GIS | 5 | DISTRICT, NAME |
| Coconino County | Coconino County GIS | 5 | DISTRICTID, NAME, REPNAME, DISTRICTUR |
| Yavapai County | Yavapai County GIS | 5 | SUPER_DIST, DISTNAME, REPNAME, DISTRICTURL |
| Navajo County | Navajo County Election Districts (Type=BS) | 5 | Code, Name |

### City Council Districts

| Layer | Source | Features | Key Fields |
|-------|--------|----------|------------|
| Phoenix | ASU ArcGIS Online (`services3.arcgis.com/0OPQIK59PJJqLK0A/`) | 8 | DISTRICT, REP_NAME, REP_URL, EMAIL |
| Mesa | Maricopa County composite layer | 6 | Ward, BdName |
| Glendale | Maricopa County composite layer | 6 | Ward, BdName |
| Peoria | Maricopa County composite layer | 6 | Ward, BdName |
| Surprise | Maricopa County composite layer | 6 | Ward, BdName |
| Buckeye | Maricopa County composite layer | 5 | Ward, BdName |
| Tucson | Pima County GIS (`services1.arcgis.com/Ezk9fcjSUkeadg6u/`) | 6 | WARD, NAME, PHONE |

### Precincts

| Layer | Source | Features | Key Fields |
|-------|--------|----------|------------|
| Maricopa County | Maricopa County GIS (2026) | Many | PctNum, BdName |

## Missing Data

### Supervisor Districts — No Public ArcGIS Endpoint Found

| County | Notes |
|--------|-------|
| Apache | No data found; rural county |
| Cochise | Election precincts available (2022) but not supervisor districts |
| Gila | No data found |
| Graham | No data found |
| Greenlee | Voter precincts only |
| La Paz | No data found |
| Mohave | Individual district layers exist (BOS_District_1..5) but not as a combined service |
| Santa Cruz | No data found |
| Yuma | No data found |

### City Council Districts — At-Large Elections (No Geographic Districts)

| City | Notes |
|------|-------|
| Chandler | At-large council elections |
| Scottsdale | At-large council elections |
| Gilbert | At-large council elections |
| Tempe | At-large council elections |
| Flagstaff | At-large council elections |
| Goodyear | At-large council elections |
| Avondale | At-large council elections |
| Casa Grande | At-large council elections |
| Sierra Vista | At-large council elections |
| Prescott | At-large council elections |
| Yuma (city) | At-large council elections |

## Color Schemes

- **Counties**: Earth tones (greens/browns) - categorical by county
- **Supervisor Districts**: Purples - categorical by district
- **City Wards/Council**: Teals/oranges - categorical by ward/district
- **Precincts**: Light categorical palette - many small regions

## Caching

All local district GeoJSON is cached via React Query:
- `staleTime`: 24 hours
- `gcTime`: 7 days
- `retry`: 3 attempts

## Architecture

- `src/types/local-district.ts` - Type definitions
- `src/lib/api/local-districts.ts` - Fetch functions
- `src/lib/api/queries.ts` - `useLocalDistricts()` React Query hook
- `src/lib/constants.ts` - `LOCAL_LAYER_CONFIGS` and `LOCAL_LAYER_COLORS`
- `src/components/Map/useLocalDistrictLayer.ts` - MapLibre GL layer management hook
- `src/components/Map/LayerSelector.tsx` - Grouped dropdown for switching layers
- `src/components/Map/MapLegend.tsx` - Dynamic legend adapting to active layer

## Adding New Layers

1. Find the ArcGIS REST endpoint URL
2. Verify CORS: `curl -sI -H "Origin: http://localhost:5173" 'URL' | grep access-control-allow-origin`
3. Verify data: `curl -s 'URL?where=1%3D1&outFields=*&returnGeometry=false&f=json' | python3 -m json.tool`
4. Add the layer type to `src/types/local-district.ts` (`LocalLayerType`)
5. Add config to `src/lib/constants.ts` (`LOCAL_LAYER_CONFIGS`)
6. Add to `src/components/Map/LayerSelector.tsx` (`LAYER_GROUPS`)
7. Add to `src/pages/Home.tsx` (`LOCAL_LAYER_TYPES`)
8. Run `npm run build` to verify
