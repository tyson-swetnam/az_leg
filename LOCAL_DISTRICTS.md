# Local District Map Layers

Additional map layers showing county, city, and precinct-level district boundaries in Arizona.

## Data Sources

All layers are fetched as GeoJSON from public ArcGIS REST API endpoints.

### Counties

| Layer | Source | URL | Key Fields |
|-------|--------|-----|------------|
| Arizona Counties | ESRI ArcGIS Online | `services1.arcgis.com/mpVYz37anSdrK4d8/.../Arizona_Counties/FeatureServer/0` | NAME, GEOID |

### Supervisor Districts

| Layer | Source | URL | Key Fields |
|-------|--------|-----|------------|
| Pima County Supervisors | Pima County GIS | `gis.pima.gov/.../election/MapServer/1` | DISTRICT, NAME |
| Maricopa County Supervisors | Maricopa County GIS | `geo.maricopa.gov/.../ElectionData/MapServer/0` | bos, BdName |

### City Districts

| Layer | Source | URL | Key Fields |
|-------|--------|-----|------------|
| Tucson Wards | Pima County GIS | `gis.pima.gov/.../election/MapServer/2` | WARD, NAME, PHONE |
| Phoenix City Council | City of Phoenix ArcGIS | `services2.arcgis.com/2t1927381mhTgWNC/.../CityCouncilDistricts/FeatureServer/0` | DISTRICT, REP_NAME, REP_URL |

### Precincts

| Layer | Source | URL | Key Fields |
|-------|--------|-----|------------|
| Pima County Precincts | Pima County GIS | `gis.pima.gov/.../election/MapServer/0` | PRECINCT |
| Maricopa County Precincts | Maricopa County GIS | `geo.maricopa.gov/.../ElectionData/MapServer/1` | PctNum, BdName |

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
