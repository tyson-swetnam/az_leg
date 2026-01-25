import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import maplibregl, { Map } from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { MapContainer } from '@/components/Map';
import { DistrictToggle } from './DistrictToggle';
import {
  useSingleDistrictBoundary,
  useSingleFederalBoundary,
  useDistrictBoundaries,
  useFederalBoundaries,
  useLegislators,
  useFederalMapping,
} from '@/lib/api/queries';
import { PARTY_COLORS_LIGHT } from '@/lib/constants';

interface DistrictMapProps {
  districtId: number;
}

export function DistrictMap({ districtId }: DistrictMapProps) {
  const navigate = useNavigate();
  const [map, setMap] = useState<Map | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [layerType, setLayerType] = useState<'state' | 'federal'>('state');

  // Fetch data
  const { data: stateDistrict } = useSingleDistrictBoundary(districtId);
  const { data: allStateDistricts } = useDistrictBoundaries();
  const { data: allFederalDistricts } = useFederalBoundaries();
  const { data: legislators } = useLegislators();
  const { data: federalMapping } = useFederalMapping();

  // Get federal district for current state district
  const federalDistrictId = federalMapping?.stateToFederal[districtId.toString()];
  const { data: federalDistrict } = useSingleFederalBoundary(federalDistrictId || 0);

  const handleMapLoad = useCallback((mapInstance: Map) => {
    setMap(mapInstance);
    setIsLoaded(true);
  }, []);

  // Calculate bounds for the current district
  const bounds: [number, number, number, number] | undefined = (() => {
    const district = layerType === 'state' ? stateDistrict : federalDistrict;
    if (!district || !district.features.length) return undefined;

    const coordinates = district.features[0].geometry.coordinates;
    const lngLatBounds = new maplibregl.LngLatBounds();

    const addCoordinates = (coords: any) => {
      if (Array.isArray(coords[0])) {
        coords.forEach(addCoordinates);
      } else {
        lngLatBounds.extend(coords as [number, number]);
      }
    };

    addCoordinates(coordinates);
    return [
      lngLatBounds.getWest(),
      lngLatBounds.getSouth(),
      lngLatBounds.getEast(),
      lngLatBounds.getNorth(),
    ];
  })();

  // Add state legislative districts layer
  useEffect(() => {
    if (!map || !isLoaded || !allStateDistricts || !legislators) return;

    const sourceId = 'state-districts';
    const fillLayerId = 'state-districts-fill';
    const borderLayerId = 'state-districts-border';
    const highlightLayerId = 'state-districts-highlight';

    // Remove existing layers if they exist
    if (map.getLayer(highlightLayerId)) map.removeLayer(highlightLayerId);
    if (map.getLayer(borderLayerId)) map.removeLayer(borderLayerId);
    if (map.getLayer(fillLayerId)) map.removeLayer(fillLayerId);
    if (map.getSource(sourceId)) map.removeSource(sourceId);

    if (layerType !== 'state') return;

    // Add source
    map.addSource(sourceId, {
      type: 'geojson',
      data: allStateDistricts as any,
    });

    // Build party color map
    const statePartyColors: Record<number, string> = {};
    legislators.districts.forEach((d) => {
      statePartyColors[d.id] =
        d.senator.party === 'R' ? PARTY_COLORS_LIGHT.R : PARTY_COLORS_LIGHT.D;
    });

    // Add fill layer with party colors
    map.addLayer({
      id: fillLayerId,
      type: 'fill',
      source: sourceId,
      paint: {
        'fill-color': [
          'case',
          ['has', 'DISTRICT'],
          [
            'match',
            ['get', 'DISTRICT'],
            ...Object.entries(statePartyColors).flatMap(([district, color]) => [
              parseInt(district),
              color,
            ]),
            '#94a3b820', // fallback
          ] as any,
          '#94a3b820', // fallback
        ] as any,
        'fill-opacity': 0.6,
      },
    });

    // Add border layer
    map.addLayer({
      id: borderLayerId,
      type: 'line',
      source: sourceId,
      paint: {
        'line-color': '#1f2937',
        'line-width': 1,
      },
    });

    // Add highlight layer for current district
    map.addLayer({
      id: highlightLayerId,
      type: 'line',
      source: sourceId,
      paint: {
        'line-color': '#1f2937',
        'line-width': 3,
      },
      filter: ['==', ['get', 'DISTRICT'], districtId],
    });

    // Add click handler
    const handleClick = (e: maplibregl.MapMouseEvent) => {
      const features = map.queryRenderedFeatures(e.point, {
        layers: [fillLayerId],
      });

      if (features && features.length > 0) {
        const clickedDistrictId = features[0].properties?.DISTRICT;
        if (clickedDistrictId && clickedDistrictId !== districtId) {
          navigate(`/district/${clickedDistrictId}`);
        }
      }
    };

    // Add hover cursor
    const handleMouseEnter = () => {
      map.getCanvas().style.cursor = 'pointer';
    };

    const handleMouseLeave = () => {
      map.getCanvas().style.cursor = '';
    };

    map.on('click', fillLayerId, handleClick);
    map.on('mouseenter', fillLayerId, handleMouseEnter);
    map.on('mouseleave', fillLayerId, handleMouseLeave);

    return () => {
      map.off('click', fillLayerId, handleClick);
      map.off('mouseenter', fillLayerId, handleMouseEnter);
      map.off('mouseleave', fillLayerId, handleMouseLeave);
      if (map.getLayer(highlightLayerId)) map.removeLayer(highlightLayerId);
      if (map.getLayer(borderLayerId)) map.removeLayer(borderLayerId);
      if (map.getLayer(fillLayerId)) map.removeLayer(fillLayerId);
      if (map.getSource(sourceId)) map.removeSource(sourceId);
    };
  }, [map, isLoaded, allStateDistricts, legislators, layerType, districtId, navigate]);

  // Add federal congressional districts layer
  useEffect(() => {
    if (!map || !isLoaded || !allFederalDistricts || !federalMapping) return;

    const sourceId = 'federal-districts';
    const fillLayerId = 'federal-districts-fill';
    const borderLayerId = 'federal-districts-border';
    const highlightLayerId = 'federal-districts-highlight';

    // Remove existing layers if they exist
    if (map.getLayer(highlightLayerId)) map.removeLayer(highlightLayerId);
    if (map.getLayer(borderLayerId)) map.removeLayer(borderLayerId);
    if (map.getLayer(fillLayerId)) map.removeLayer(fillLayerId);
    if (map.getSource(sourceId)) map.removeSource(sourceId);

    if (layerType !== 'federal') return;

    // Add source
    map.addSource(sourceId, {
      type: 'geojson',
      data: allFederalDistricts as any,
    });

    // Get party for federal districts based on congress members
    const federalPartyColors = federalMapping.congressMembers.reduce(
      (acc, member) => {
        acc[member.district] =
          member.party === 'R' ? PARTY_COLORS_LIGHT.R : PARTY_COLORS_LIGHT.D;
        return acc;
      },
      {} as Record<number, string>
    );

    // Add fill layer with party colors
    map.addLayer({
      id: fillLayerId,
      type: 'fill',
      source: sourceId,
      paint: {
        'fill-color': [
          'case',
          ['has', 'DISTRICT'],
          [
            'match',
            ['get', 'DISTRICT'],
            ...Object.entries(federalPartyColors).flatMap(([district, color]) => [
              parseInt(district),
              color,
            ]),
            '#94a3b820', // fallback
          ] as any,
          '#94a3b820', // fallback
        ] as any,
        'fill-opacity': 0.6,
      },
    });

    // Add border layer
    map.addLayer({
      id: borderLayerId,
      type: 'line',
      source: sourceId,
      paint: {
        'line-color': '#1f2937',
        'line-width': 1,
      },
    });

    // Add highlight layer for current federal district
    if (federalDistrictId) {
      map.addLayer({
        id: highlightLayerId,
        type: 'line',
        source: sourceId,
        paint: {
          'line-color': '#1f2937',
          'line-width': 3,
        },
        filter: ['==', ['get', 'DISTRICT'], federalDistrictId],
      });
    }

    // Add click handler - navigate to a state district within the federal district
    const handleClick = (e: maplibregl.MapMouseEvent) => {
      const features = map.queryRenderedFeatures(e.point, {
        layers: [fillLayerId],
      });

      if (features && features.length > 0) {
        const clickedFederalId = features[0].properties?.DISTRICT;
        if (clickedFederalId && clickedFederalId !== federalDistrictId) {
          // Find first state district in this federal district
          const stateDistrictId = Object.entries(federalMapping.stateToFederal).find(
            ([_, fedId]) => fedId === clickedFederalId
          )?.[0];

          if (stateDistrictId) {
            navigate(`/district/${stateDistrictId}`);
          }
        }
      }
    };

    // Add hover cursor
    const handleMouseEnter = () => {
      map.getCanvas().style.cursor = 'pointer';
    };

    const handleMouseLeave = () => {
      map.getCanvas().style.cursor = '';
    };

    map.on('click', fillLayerId, handleClick);
    map.on('mouseenter', fillLayerId, handleMouseEnter);
    map.on('mouseleave', fillLayerId, handleMouseLeave);

    return () => {
      map.off('click', fillLayerId, handleClick);
      map.off('mouseenter', fillLayerId, handleMouseEnter);
      map.off('mouseleave', fillLayerId, handleMouseLeave);
      if (map.getLayer(highlightLayerId)) map.removeLayer(highlightLayerId);
      if (map.getLayer(borderLayerId)) map.removeLayer(borderLayerId);
      if (map.getLayer(fillLayerId)) map.removeLayer(fillLayerId);
      if (map.getSource(sourceId)) map.removeSource(sourceId);
    };
  }, [map, isLoaded, allFederalDistricts, federalMapping, layerType, federalDistrictId, navigate]);

  // Zoom to current district when bounds change
  useEffect(() => {
    if (map && bounds) {
      map.fitBounds(bounds, { padding: 40, duration: 1000 });
    }
  }, [map, bounds]);

  return (
    <div className="relative">
      {/* Toggle positioned at top-left */}
      <div className="absolute top-4 left-4 z-10">
        <DistrictToggle value={layerType} onChange={setLayerType} />
      </div>

      {/* Map */}
      <MapContainer
        bounds={bounds}
        className="h-96 w-full rounded-lg"
        onLoad={handleMapLoad}
      />

      {/* Legend */}
      <div className="mt-4 flex items-center gap-4 text-sm">
        <div className="flex items-center gap-2">
          <div
            className="w-4 h-4 rounded"
            style={{ backgroundColor: PARTY_COLORS_LIGHT.R }}
          />
          <span className="text-gray-700">Republican</span>
        </div>
        <div className="flex items-center gap-2">
          <div
            className="w-4 h-4 rounded"
            style={{ backgroundColor: PARTY_COLORS_LIGHT.D }}
          />
          <span className="text-gray-700">Democratic</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 border-2 border-gray-900 rounded" />
          <span className="text-gray-700">
            Current {layerType === 'state' ? 'State' : 'Federal'} District
          </span>
        </div>
      </div>
    </div>
  );
}
