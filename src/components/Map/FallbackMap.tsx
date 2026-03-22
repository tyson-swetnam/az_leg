import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDistrictBoundaries, useLegislators, useLocalDistricts } from '@/lib/api/queries';
import { PARTY_COLORS, LOCAL_LAYER_CONFIGS, LOCAL_LAYER_COLORS } from '@/lib/constants';
import type { DistrictGeometry } from '@/types/district';
import type { LocalLayerType, LocalDistrictGeoJSON } from '@/types/local-district';

type LayerType = 'state' | 'federal' | LocalLayerType;

// Arizona bounding box for projection
const AZ_BOUNDS = {
  minLng: -114.82,
  maxLng: -109.04,
  minLat: 31.33,
  maxLat: 37.0,
};

const SVG_WIDTH = 800;
const SVG_HEIGHT = 900;
const PADDING = 20;

interface Bounds {
  minLng: number;
  maxLng: number;
  minLat: number;
  maxLat: number;
}

/** Project lng/lat to SVG x/y using equirectangular projection with configurable bounds */
function projectPointWithBounds(lng: number, lat: number, bounds: Bounds): [number, number] {
  const x =
    PADDING +
    ((lng - bounds.minLng) / (bounds.maxLng - bounds.minLng)) *
      (SVG_WIDTH - 2 * PADDING);
  const y =
    PADDING +
    ((bounds.maxLat - lat) / (bounds.maxLat - bounds.minLat)) *
      (SVG_HEIGHT - 2 * PADDING);
  return [x, y];
}

/** Convert a ring of coordinates to an SVG path string */
function ringToPathWithBounds(ring: number[][], bounds: Bounds): string {
  return ring
    .map((coord, i) => {
      const [x, y] = projectPointWithBounds(coord[0], coord[1], bounds);
      return `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(' ') + ' Z';
}

/** Convert a GeoJSON geometry to an SVG path string */
function geometryToPath(geometry: { type: string; coordinates: number[][][] | number[][][][] }, bounds: Bounds): string {
  if (geometry.type === 'Polygon') {
    const coords = geometry.coordinates as number[][][];
    return coords.map((ring) => ringToPathWithBounds(ring, bounds)).join(' ');
  }

  if (geometry.type === 'MultiPolygon') {
    const coords = geometry.coordinates as number[][][][];
    return coords
      .map((polygon) => polygon.map((ring) => ringToPathWithBounds(ring, bounds)).join(' '))
      .join(' ');
  }

  return '';
}

/** Calculate centroid of a geometry for label placement */
function geometryCentroid(geometry: { type: string; coordinates: number[][][] | number[][][][] }, bounds: Bounds): [number, number] {
  let allCoords: number[][] = [];

  if (geometry.type === 'Polygon') {
    allCoords = (geometry.coordinates as number[][][])[0];
  } else if (geometry.type === 'MultiPolygon') {
    const polygons = geometry.coordinates as number[][][][];
    let largest = polygons[0][0];
    let maxLen = largest.length;
    for (const poly of polygons) {
      if (poly[0].length > maxLen) {
        largest = poly[0];
        maxLen = poly[0].length;
      }
    }
    allCoords = largest;
  }

  if (allCoords.length === 0) return [SVG_WIDTH / 2, SVG_HEIGHT / 2];

  let sumLng = 0;
  let sumLat = 0;
  for (const coord of allCoords) {
    sumLng += coord[0];
    sumLat += coord[1];
  }
  return projectPointWithBounds(sumLng / allCoords.length, sumLat / allCoords.length, bounds);
}

/** Calculate bounding box of GeoJSON features with padding */
function calculateBounds(geojson: LocalDistrictGeoJSON): Bounds {
  let minLng = Infinity, maxLng = -Infinity, minLat = Infinity, maxLat = -Infinity;

  for (const feature of geojson.features) {
    const { geometry } = feature;
    const rings: number[][][] =
      geometry.type === 'Polygon'
        ? (geometry.coordinates as number[][][])
        : (geometry.coordinates as number[][][][]).flat();

    for (const ring of rings) {
      for (const coord of ring) {
        if (coord[0] < minLng) minLng = coord[0];
        if (coord[0] > maxLng) maxLng = coord[0];
        if (coord[1] < minLat) minLat = coord[1];
        if (coord[1] > maxLat) maxLat = coord[1];
      }
    }
  }

  // Add 5% padding around the bounding box
  const lngPad = (maxLng - minLng) * 0.05;
  const latPad = (maxLat - minLat) * 0.05;

  return {
    minLng: minLng - lngPad,
    maxLng: maxLng + lngPad,
    minLat: minLat - latPad,
    maxLat: maxLat + latPad,
  };
}

/** Map layer IDs to jurisdiction route params (mirrors useLocalDistrictLayer) */
const LAYER_TO_ROUTE: Record<string, { type: string; id: string }> = {
  'maricopa-supervisors': { type: 'county', id: 'maricopa' },
  'pima-supervisors': { type: 'county', id: 'pima' },
  'coconino-supervisors': { type: 'county', id: 'coconino' },
  'yavapai-supervisors': { type: 'county', id: 'yavapai' },
  'pinal-supervisors': { type: 'county', id: 'pinal' },
  'navajo-supervisors': { type: 'county', id: 'navajo' },
  'phoenix-council': { type: 'city', id: 'phoenix' },
  'tucson-wards': { type: 'city', id: 'tucson' },
  'mesa-council': { type: 'city', id: 'mesa' },
  'glendale-council': { type: 'city', id: 'glendale' },
  'peoria-council': { type: 'city', id: 'peoria' },
  'surprise-council': { type: 'city', id: 'surprise' },
  'buckeye-council': { type: 'city', id: 'buckeye' },
};

const LOCAL_LAYER_TYPES: LocalLayerType[] = Object.keys(LOCAL_LAYER_CONFIGS) as LocalLayerType[];

function isLocalLayer(layer: LayerType): layer is LocalLayerType {
  return LOCAL_LAYER_TYPES.includes(layer as LocalLayerType);
}

interface FallbackMapProps {
  className?: string;
  highlightDistrict?: number;
  activeLayer?: LayerType;
}

export function FallbackMap({
  className = 'h-[600px] w-full',
  highlightDistrict,
  activeLayer = 'state',
}: FallbackMapProps) {
  const navigate = useNavigate();
  const { data: geoData, isLoading: loadingGeo } = useDistrictBoundaries();
  const { data: legislators, isLoading: loadingLeg } = useLegislators();
  const [hoveredDistrict, setHoveredDistrict] = useState<number | null>(null);
  const [hoveredLocalId, setHoveredLocalId] = useState<string | null>(null);

  // Fetch local GeoJSON when a local layer is active
  const localLayerType = isLocalLayer(activeLayer) ? activeLayer : null;
  const { data: localGeoData, isLoading: loadingLocal } = useLocalDistricts(localLayerType);

  // Build party color lookup for state districts
  const partyColors = useMemo(() => {
    if (!legislators) return new Map<number, string>();
    const map = new Map<number, string>();
    for (const d of legislators.districts) {
      map.set(d.id, d.senator.party === 'R' ? PARTY_COLORS.R : PARTY_COLORS.D);
    }
    return map;
  }, [legislators]);

  // Pre-compute SVG paths and centroids for state districts
  const districtShapes = useMemo(() => {
    if (!geoData) return [];
    return geoData.features.map((feature: DistrictGeometry) => ({
      districtId: feature.properties.DISTRICT,
      path: geometryToPath(feature.geometry, AZ_BOUNDS),
      centroid: geometryCentroid(feature.geometry, AZ_BOUNDS),
    }));
  }, [geoData]);

  // Pre-compute local district shapes with auto-zoom bounds
  const localShapes = useMemo(() => {
    if (!localGeoData || !localLayerType) return { shapes: [], bounds: AZ_BOUNDS, config: null };

    const config = LOCAL_LAYER_CONFIGS[localLayerType];
    if (!config) return { shapes: [], bounds: AZ_BOUNDS, config: null };

    const bounds = calculateBounds(localGeoData);
    const colors = LOCAL_LAYER_COLORS[config.group] || LOCAL_LAYER_COLORS.county;

    const shapes = localGeoData.features.map((feature, i) => {
      const props = feature.properties || {};
      const rawId = props[config.idField];
      const displayId = String(rawId).replace(/^bos\s*/i, '');
      const name = config.nameField ? props[config.nameField] : undefined;
      const displayName = name || `District ${displayId}`;
      const rep = config.repField ? props[config.repField] : undefined;
      const phone = config.phoneField ? props[config.phoneField] : undefined;
      const color = colors[i % colors.length];

      return {
        id: String(rawId),
        displayId,
        displayName,
        rep,
        phone,
        color,
        path: geometryToPath(feature.geometry, bounds),
        centroid: geometryCentroid(feature.geometry, bounds),
      };
    });

    return { shapes, bounds, config };
  }, [localGeoData, localLayerType]);

  // Hover info for state districts
  const hoveredStateInfo = useMemo(() => {
    if (hoveredDistrict === null || !legislators) return null;
    const d = legislators.districts.find((d) => d.id === hoveredDistrict);
    if (!d) return null;
    return {
      id: d.id,
      senator: d.senator.name,
      party: d.senator.party,
      cities: d.majorCities.slice(0, 3).join(', '),
    };
  }, [hoveredDistrict, legislators]);

  // Hover info for local districts
  const hoveredLocalInfo = useMemo(() => {
    if (!hoveredLocalId || !localShapes.config) return null;
    const shape = localShapes.shapes.find((s) => s.id === hoveredLocalId);
    if (!shape) return null;
    return {
      name: shape.displayName,
      rep: shape.rep,
      phone: shape.phone,
      layerLabel: localShapes.config.label,
    };
  }, [hoveredLocalId, localShapes]);

  const showLocal = isLocalLayer(activeLayer);
  const isLoading = showLocal ? loadingLocal : (loadingGeo || loadingLeg);

  if (isLoading) {
    return (
      <div className={`${className} relative bg-gray-100 flex items-center justify-center`}>
        <div className="flex items-center space-x-2">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="text-gray-600">
            Loading {showLocal ? LOCAL_LAYER_CONFIGS[activeLayer as LocalLayerType]?.label || 'local districts' : 'district map'}...
          </span>
        </div>
      </div>
    );
  }

  // Error state
  if (showLocal && !localGeoData) {
    return (
      <div className={`${className} relative bg-gray-100 flex items-center justify-center`}>
        <p className="text-gray-500">Unable to load local district data.</p>
      </div>
    );
  }

  if (!showLocal && (!geoData || !legislators)) {
    return (
      <div className={`${className} relative bg-gray-100 flex items-center justify-center`}>
        <p className="text-gray-500">Unable to load district data.</p>
      </div>
    );
  }

  const handleLocalClick = (featureId: string) => {
    if (!localLayerType) return;
    const route = LAYER_TO_ROUTE[localLayerType];
    if (route) {
      const shape = localShapes.shapes.find((s) => s.id === featureId);
      const displayId = shape?.displayId || featureId;
      navigate(`/local/${route.type}/${route.id}/${displayId}`);
    }
  };

  // Determine stroke width based on layer group
  const localStrokeWidth = localShapes.config?.group === 'precinct' ? 0.3 : 0.75;

  // Determine if labels should be shown (skip for precincts — too many)
  const showLocalLabels = localShapes.config?.group !== 'precinct';

  return (
    <div className={`${className} relative bg-gray-50 overflow-hidden`}>
      {/* Notice banner */}
      <div className="absolute top-2 left-2 right-2 z-10 bg-amber-50 border border-amber-200 rounded px-3 py-1.5 text-xs text-amber-800">
        Simplified map view (WebGL not available). Click a district to view details.
      </div>

      {/* Hover tooltip — state districts */}
      {!showLocal && hoveredStateInfo && (
        <div className="absolute top-12 right-2 z-10 bg-white rounded-lg shadow-lg p-3 min-w-[200px] text-sm border">
          <div className="font-semibold text-gray-900">
            District {hoveredStateInfo.id}
          </div>
          <div className="text-gray-600 mt-1">
            Sen. {hoveredStateInfo.senator}{' '}
            <span
              className="inline-block w-2.5 h-2.5 rounded-full ml-1"
              style={{ backgroundColor: partyColors.get(hoveredStateInfo.id) }}
            />
          </div>
          <div className="text-gray-500 text-xs mt-1">{hoveredStateInfo.cities}</div>
        </div>
      )}

      {/* Hover tooltip — local districts */}
      {showLocal && hoveredLocalInfo && (
        <div className="absolute top-12 right-2 z-10 bg-white rounded-lg shadow-lg p-3 min-w-[200px] text-sm border">
          <div className="text-xs text-gray-500 uppercase tracking-wide">
            {hoveredLocalInfo.layerLabel}
          </div>
          <div className="font-semibold text-gray-900 mt-1">
            {hoveredLocalInfo.name}
          </div>
          {hoveredLocalInfo.rep && (
            <div className="text-gray-600 mt-1">{hoveredLocalInfo.rep}</div>
          )}
          {hoveredLocalInfo.phone && (
            <div className="text-gray-500 text-xs mt-1">{hoveredLocalInfo.phone}</div>
          )}
        </div>
      )}

      {/* SVG Map */}
      <svg
        viewBox={`0 0 ${SVG_WIDTH} ${SVG_HEIGHT}`}
        className="w-full h-full"
        preserveAspectRatio="xMidYMid meet"
        role="img"
        aria-label={showLocal ? `${LOCAL_LAYER_CONFIGS[activeLayer as LocalLayerType]?.label} map` : 'Arizona legislative districts map'}
      >
        {/* State district polygons */}
        {!showLocal && districtShapes.map(({ districtId, path }) => {
          const color = partyColors.get(districtId) || '#94a3b8';
          const isHovered = hoveredDistrict === districtId;
          const isHighlighted = highlightDistrict === districtId;

          return (
            <path
              key={districtId}
              d={path}
              fill={color}
              fillOpacity={isHovered ? 0.5 : 0.3}
              stroke={isHighlighted ? '#c9a961' : isHovered ? '#1f2937' : '#374151'}
              strokeWidth={isHighlighted ? 3 : isHovered ? 2 : 0.75}
              cursor="pointer"
              onClick={() => navigate(`/district/${districtId}`)}
              onMouseEnter={() => setHoveredDistrict(districtId)}
              onMouseLeave={() => setHoveredDistrict(null)}
              role="button"
              aria-label={`District ${districtId}`}
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  navigate(`/district/${districtId}`);
                }
              }}
            />
          );
        })}

        {/* State district number labels */}
        {!showLocal && districtShapes.map(({ districtId, centroid }) => (
          <text
            key={`label-${districtId}`}
            x={centroid[0]}
            y={centroid[1]}
            textAnchor="middle"
            dominantBaseline="central"
            fontSize="11"
            fontWeight="600"
            fill="#1f2937"
            pointerEvents="none"
            aria-hidden="true"
          >
            {districtId}
          </text>
        ))}

        {/* Local district polygons */}
        {showLocal && localShapes.shapes.map(({ id, color, path, displayName }) => {
          const isHovered = hoveredLocalId === id;

          return (
            <path
              key={id}
              d={path}
              fill={color}
              fillOpacity={isHovered ? 0.6 : 0.4}
              stroke={isHovered ? '#1f2937' : '#374151'}
              strokeWidth={isHovered ? 2 : localStrokeWidth}
              cursor="pointer"
              onClick={() => handleLocalClick(id)}
              onMouseEnter={() => setHoveredLocalId(id)}
              onMouseLeave={() => setHoveredLocalId(null)}
              role="button"
              aria-label={displayName}
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  handleLocalClick(id);
                }
              }}
            />
          );
        })}

        {/* Local district labels */}
        {showLocal && showLocalLabels && localShapes.shapes.map(({ id, displayId, centroid }) => (
          <text
            key={`label-${id}`}
            x={centroid[0]}
            y={centroid[1]}
            textAnchor="middle"
            dominantBaseline="central"
            fontSize="11"
            fontWeight="600"
            fill="#1f2937"
            pointerEvents="none"
            aria-hidden="true"
          >
            {displayId}
          </text>
        ))}
      </svg>

      {/* Legend — state districts */}
      {!showLocal && (
        <div className="absolute bottom-2 left-2 bg-white/90 rounded px-3 py-2 text-xs border">
          <div className="font-medium mb-1">Party Affiliation</div>
          <div className="flex gap-3">
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded" style={{ backgroundColor: PARTY_COLORS.R, opacity: 0.3 }} />
              <span>Republican</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded" style={{ backgroundColor: PARTY_COLORS.D, opacity: 0.3 }} />
              <span>Democrat</span>
            </div>
          </div>
        </div>
      )}

      {/* Legend — local layers */}
      {showLocal && localShapes.config && (
        <div className="absolute bottom-2 left-2 bg-white/90 rounded px-3 py-2 text-xs border max-h-[200px] overflow-y-auto">
          <div className="font-medium mb-1">{localShapes.config.label}</div>
          {localShapes.config.group === 'precinct' ? (
            <div className="flex items-center gap-1">
              <div
                className="w-8 h-3 rounded"
                style={{
                  background: `linear-gradient(90deg, ${(LOCAL_LAYER_COLORS[localShapes.config.group] || []).slice(0, 5).join(', ')})`,
                }}
              />
              <span>Precincts</span>
            </div>
          ) : (
            <div className="flex flex-col gap-0.5">
              {localShapes.shapes.map(({ id, displayName, rep, color }) => (
                <div key={id} className="flex items-center gap-1">
                  <div className="w-3 h-3 rounded flex-shrink-0" style={{ backgroundColor: color, opacity: 0.6 }} />
                  <span className="truncate">
                    {displayName}
                    {rep && ` — ${rep}`}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
