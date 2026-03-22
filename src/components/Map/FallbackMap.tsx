import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDistrictBoundaries, useLegislators } from '@/lib/api/queries';
import { PARTY_COLORS } from '@/lib/constants';
import type { DistrictGeometry } from '@/types/district';

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

/** Project lng/lat to SVG x/y using equirectangular projection */
function projectPoint(lng: number, lat: number): [number, number] {
  const x =
    PADDING +
    ((lng - AZ_BOUNDS.minLng) / (AZ_BOUNDS.maxLng - AZ_BOUNDS.minLng)) *
      (SVG_WIDTH - 2 * PADDING);
  // Flip Y axis (SVG y=0 is top, lat increases upward)
  const y =
    PADDING +
    ((AZ_BOUNDS.maxLat - lat) / (AZ_BOUNDS.maxLat - AZ_BOUNDS.minLat)) *
      (SVG_HEIGHT - 2 * PADDING);
  return [x, y];
}

/** Convert a ring of coordinates to an SVG path string */
function ringToPath(ring: number[][]): string {
  return ring
    .map((coord, i) => {
      const [x, y] = projectPoint(coord[0], coord[1]);
      return `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(' ') + ' Z';
}

/** Convert a GeoJSON geometry to an SVG path string */
function geometryToPath(feature: DistrictGeometry): string {
  const { geometry } = feature;

  if (geometry.type === 'Polygon') {
    const coords = geometry.coordinates as number[][][];
    return coords.map(ringToPath).join(' ');
  }

  if (geometry.type === 'MultiPolygon') {
    const coords = geometry.coordinates as number[][][][];
    return coords
      .map((polygon) => polygon.map(ringToPath).join(' '))
      .join(' ');
  }

  return '';
}

/** Calculate centroid of a feature for label placement */
function featureCentroid(feature: DistrictGeometry): [number, number] {
  const { geometry } = feature;
  let allCoords: number[][] = [];

  if (geometry.type === 'Polygon') {
    allCoords = (geometry.coordinates as number[][][])[0];
  } else if (geometry.type === 'MultiPolygon') {
    // Use the largest polygon's outer ring
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
  return projectPoint(sumLng / allCoords.length, sumLat / allCoords.length);
}

interface FallbackMapProps {
  className?: string;
  highlightDistrict?: number;
}

export function FallbackMap({ className = 'h-[600px] w-full', highlightDistrict }: FallbackMapProps) {
  const navigate = useNavigate();
  const { data: geoData, isLoading: loadingGeo } = useDistrictBoundaries();
  const { data: legislators, isLoading: loadingLeg } = useLegislators();
  const [hoveredDistrict, setHoveredDistrict] = useState<number | null>(null);

  // Build party color lookup
  const partyColors = useMemo(() => {
    if (!legislators) return new Map<number, string>();
    const map = new Map<number, string>();
    for (const d of legislators.districts) {
      map.set(d.id, d.senator.party === 'R' ? PARTY_COLORS.R : PARTY_COLORS.D);
    }
    return map;
  }, [legislators]);

  // Pre-compute SVG paths and centroids
  const districtShapes = useMemo(() => {
    if (!geoData) return [];
    return geoData.features.map((feature) => ({
      districtId: feature.properties.DISTRICT,
      path: geometryToPath(feature),
      centroid: featureCentroid(feature),
    }));
  }, [geoData]);

  const hoveredInfo = useMemo(() => {
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

  const isLoading = loadingGeo || loadingLeg;

  if (isLoading) {
    return (
      <div className={`${className} relative bg-gray-100 flex items-center justify-center`}>
        <div className="flex items-center space-x-2">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="text-gray-600">Loading district map...</span>
        </div>
      </div>
    );
  }

  if (!geoData || !legislators) {
    return (
      <div className={`${className} relative bg-gray-100 flex items-center justify-center`}>
        <p className="text-gray-500">Unable to load district data.</p>
      </div>
    );
  }

  return (
    <div className={`${className} relative bg-gray-50 overflow-hidden`}>
      {/* Notice banner */}
      <div className="absolute top-2 left-2 right-2 z-10 bg-amber-50 border border-amber-200 rounded px-3 py-1.5 text-xs text-amber-800">
        Simplified map view (WebGL not available). Click a district to view details.
      </div>

      {/* Hover tooltip */}
      {hoveredInfo && (
        <div className="absolute top-12 right-2 z-10 bg-white rounded-lg shadow-lg p-3 min-w-[200px] text-sm border">
          <div className="font-semibold text-gray-900">
            District {hoveredInfo.id}
          </div>
          <div className="text-gray-600 mt-1">
            Sen. {hoveredInfo.senator}{' '}
            <span
              className="inline-block w-2.5 h-2.5 rounded-full ml-1"
              style={{ backgroundColor: partyColors.get(hoveredInfo.id) }}
            />
          </div>
          <div className="text-gray-500 text-xs mt-1">{hoveredInfo.cities}</div>
        </div>
      )}

      {/* SVG Map */}
      <svg
        viewBox={`0 0 ${SVG_WIDTH} ${SVG_HEIGHT}`}
        className="w-full h-full"
        preserveAspectRatio="xMidYMid meet"
        role="img"
        aria-label="Arizona legislative districts map"
      >
        {/* District polygons */}
        {districtShapes.map(({ districtId, path }) => {
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

        {/* District number labels */}
        {districtShapes.map(({ districtId, centroid }) => (
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
      </svg>

      {/* Legend */}
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
    </div>
  );
}
