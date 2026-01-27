import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import maplibregl, { Map } from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { MapContainer } from '@/components/Map';
import {
  useDistrictBoundaries,
  useFederalBoundaries,
  useLegislators,
  useFederalMapping,
} from '@/lib/api/queries';
import { PARTY_COLORS_LIGHT, ARIZONA_BOUNDS } from '@/lib/constants';
import '@/styles/home-map.css';

type LayerType = 'state' | 'federal';

export function Home() {
  const navigate = useNavigate();
  const [map, setMap] = useState<Map | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [layerType, setLayerType] = useState<LayerType>('state');
  const [hoveredDistrictId, setHoveredDistrictId] = useState<number | null>(null);

  // Fetch data
  const { data: stateDistricts, isLoading: loadingState } = useDistrictBoundaries();
  const { data: federalDistricts, isLoading: loadingFederal } = useFederalBoundaries();
  const { data: legislators } = useLegislators();
  const { data: federalMapping } = useFederalMapping();

  const handleMapLoad = useCallback((mapInstance: Map) => {
    setMap(mapInstance);
    setIsLoaded(true);
  }, []);

  // Add state legislative districts layer
  useEffect(() => {
    if (!map || !isLoaded || !stateDistricts || !legislators) return;
    if (!map.isStyleLoaded()) return;

    const sourceId = 'state-districts';
    const fillLayerId = 'state-districts-fill';
    const borderLayerId = 'state-districts-border';
    const hoverLayerId = 'state-districts-hover';

    // Remove existing layers
    try {
      if (map.getLayer(hoverLayerId)) map.removeLayer(hoverLayerId);
      if (map.getLayer(borderLayerId)) map.removeLayer(borderLayerId);
      if (map.getLayer(fillLayerId)) map.removeLayer(fillLayerId);
      if (map.getSource(sourceId)) map.removeSource(sourceId);
    } catch (error) {
      console.error('Error removing state layers:', error);
      return;
    }

    if (layerType !== 'state') return;

    // Add source
    map.addSource(sourceId, {
      type: 'geojson',
      data: stateDistricts as any,
    });

    // Build party color map
    const statePartyColors: Record<number, string> = {};
    legislators.districts.forEach((d) => {
      statePartyColors[d.id] =
        d.senator.party === 'R' ? PARTY_COLORS_LIGHT.R : PARTY_COLORS_LIGHT.D;
    });

    // Add fill layer
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
            '#94a3b820',
          ] as any,
          '#94a3b820',
        ] as any,
        'fill-opacity': 0.7,
      },
    });

    // Add border layer
    map.addLayer({
      id: borderLayerId,
      type: 'line',
      source: sourceId,
      paint: {
        'line-color': '#2a2a2a',
        'line-width': 1.5,
      },
    });

    // Add hover layer
    map.addLayer({
      id: hoverLayerId,
      type: 'line',
      source: sourceId,
      paint: {
        'line-color': '#c9a961',
        'line-width': 3,
      },
      filter: ['==', ['get', 'DISTRICT'], -1],
    });

    // Event handlers
    const handleClick = (e: maplibregl.MapMouseEvent) => {
      const features = map.queryRenderedFeatures(e.point, {
        layers: [fillLayerId],
      });

      if (features && features.length > 0) {
        const districtId = features[0].properties?.DISTRICT;
        if (districtId) {
          navigate(`/district/${districtId}`);
        }
      }
    };

    const handleMouseMove = (e: maplibregl.MapMouseEvent) => {
      const features = map.queryRenderedFeatures(e.point, {
        layers: [fillLayerId],
      });

      if (features && features.length > 0) {
        const districtId = features[0].properties?.DISTRICT;
        setHoveredDistrictId(districtId || null);
        map.getCanvas().style.cursor = 'pointer';

        if (districtId) {
          map.setFilter(hoverLayerId, ['==', ['get', 'DISTRICT'], districtId]);
        }
      } else {
        setHoveredDistrictId(null);
        map.getCanvas().style.cursor = '';
        map.setFilter(hoverLayerId, ['==', ['get', 'DISTRICT'], -1]);
      }
    };

    const handleMouseLeave = () => {
      setHoveredDistrictId(null);
      map.getCanvas().style.cursor = '';
      map.setFilter(hoverLayerId, ['==', ['get', 'DISTRICT'], -1]);
    };

    map.on('click', fillLayerId, handleClick);
    map.on('mousemove', fillLayerId, handleMouseMove);
    map.on('mouseleave', fillLayerId, handleMouseLeave);

    return () => {
      if (!map || !map.isStyleLoaded()) return;
      try {
        map.off('click', fillLayerId, handleClick);
        map.off('mousemove', fillLayerId, handleMouseMove);
        map.off('mouseleave', fillLayerId, handleMouseLeave);
        if (map.getLayer(hoverLayerId)) map.removeLayer(hoverLayerId);
        if (map.getLayer(borderLayerId)) map.removeLayer(borderLayerId);
        if (map.getLayer(fillLayerId)) map.removeLayer(fillLayerId);
        if (map.getSource(sourceId)) map.removeSource(sourceId);
      } catch (error) {
        console.error('Error cleaning up state layers:', error);
      }
    };
  }, [map, isLoaded, stateDistricts, legislators, layerType, navigate]);

  // Add federal congressional districts layer
  useEffect(() => {
    if (!map || !isLoaded || !federalDistricts || !federalMapping) return;
    if (!map.isStyleLoaded()) return;

    const sourceId = 'federal-districts';
    const fillLayerId = 'federal-districts-fill';
    const borderLayerId = 'federal-districts-border';
    const hoverLayerId = 'federal-districts-hover';

    // Remove existing layers
    try {
      if (map.getLayer(hoverLayerId)) map.removeLayer(hoverLayerId);
      if (map.getLayer(borderLayerId)) map.removeLayer(borderLayerId);
      if (map.getLayer(fillLayerId)) map.removeLayer(fillLayerId);
      if (map.getSource(sourceId)) map.removeSource(sourceId);
    } catch (error) {
      console.error('Error removing federal layers:', error);
      return;
    }

    if (layerType !== 'federal') return;

    // Add source
    map.addSource(sourceId, {
      type: 'geojson',
      data: federalDistricts as any,
    });

    // Get party colors for federal districts
    const federalPartyColors = federalMapping.congressMembers.reduce(
      (acc, member) => {
        acc[member.district] =
          member.party === 'R' ? PARTY_COLORS_LIGHT.R : PARTY_COLORS_LIGHT.D;
        return acc;
      },
      {} as Record<number, string>
    );

    // Add fill layer
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
            '#94a3b820',
          ] as any,
          '#94a3b820',
        ] as any,
        'fill-opacity': 0.7,
      },
    });

    // Add border layer
    map.addLayer({
      id: borderLayerId,
      type: 'line',
      source: sourceId,
      paint: {
        'line-color': '#2a2a2a',
        'line-width': 2,
      },
    });

    // Add hover layer
    map.addLayer({
      id: hoverLayerId,
      type: 'line',
      source: sourceId,
      paint: {
        'line-color': '#c9a961',
        'line-width': 4,
      },
      filter: ['==', ['get', 'DISTRICT'], -1],
    });

    // Event handlers
    const handleClick = (e: maplibregl.MapMouseEvent) => {
      const features = map.queryRenderedFeatures(e.point, {
        layers: [fillLayerId],
      });

      if (features && features.length > 0) {
        const federalDistrictId = features[0].properties?.DISTRICT;
        if (federalDistrictId && federalMapping) {
          // Find first state district in this federal district
          const stateDistrictId = Object.entries(federalMapping.stateToFederal).find(
            ([_, fedId]) => fedId === federalDistrictId
          )?.[0];

          if (stateDistrictId) {
            // Navigate to state district detail, which will show federal rep
            navigate(`/district/${stateDistrictId}?view=federal`);
          }
        }
      }
    };

    const handleMouseMove = (e: maplibregl.MapMouseEvent) => {
      const features = map.queryRenderedFeatures(e.point, {
        layers: [fillLayerId],
      });

      if (features && features.length > 0) {
        const districtId = features[0].properties?.DISTRICT;
        setHoveredDistrictId(districtId || null);
        map.getCanvas().style.cursor = 'pointer';

        if (districtId) {
          map.setFilter(hoverLayerId, ['==', ['get', 'DISTRICT'], districtId]);
        }
      } else {
        setHoveredDistrictId(null);
        map.getCanvas().style.cursor = '';
        map.setFilter(hoverLayerId, ['==', ['get', 'DISTRICT'], -1]);
      }
    };

    const handleMouseLeave = () => {
      setHoveredDistrictId(null);
      map.getCanvas().style.cursor = '';
      map.setFilter(hoverLayerId, ['==', ['get', 'DISTRICT'], -1]);
    };

    map.on('click', fillLayerId, handleClick);
    map.on('mousemove', fillLayerId, handleMouseMove);
    map.on('mouseleave', fillLayerId, handleMouseLeave);

    return () => {
      if (!map || !map.isStyleLoaded()) return;
      try {
        map.off('click', fillLayerId, handleClick);
        map.off('mousemove', fillLayerId, handleMouseMove);
        map.off('mouseleave', fillLayerId, handleMouseLeave);
        if (map.getLayer(hoverLayerId)) map.removeLayer(hoverLayerId);
        if (map.getLayer(borderLayerId)) map.removeLayer(borderLayerId);
        if (map.getLayer(fillLayerId)) map.removeLayer(fillLayerId);
        if (map.getSource(sourceId)) map.removeSource(sourceId);
      } catch (error) {
        console.error('Error cleaning up federal layers:', error);
      }
    };
  }, [map, isLoaded, federalDistricts, federalMapping, layerType, navigate]);

  // Get display info for hovered district
  const hoveredInfo = (() => {
    if (!hoveredDistrictId) return null;

    if (layerType === 'state' && legislators) {
      const district = legislators.districts.find(d => d.id === hoveredDistrictId);
      if (district) {
        return {
          number: hoveredDistrictId,
          name: district.name,
          representative: `Sen. ${district.senator.name}`,
          party: district.senator.party,
          type: 'State Legislative',
        };
      }
    } else if (layerType === 'federal' && federalMapping) {
      const member = federalMapping.congressMembers.find(m => m.district === hoveredDistrictId);
      if (member) {
        return {
          number: hoveredDistrictId,
          name: `Congressional District ${hoveredDistrictId}`,
          representative: `Rep. ${member.name}`,
          party: member.party,
          type: 'Federal Congressional',
        };
      }
    }

    return null;
  })();

  const isLoading = loadingState || loadingFederal;

  return (
    <div className="home-map-container">
      {/* Header Overlay */}
      <div className="map-header-overlay">
        <div className="header-content">
          <div className="header-text">
            <h1 className="map-title">Arizona Legislature Atlas</h1>
            <p className="map-subtitle">
              Interactive Map • {layerType === 'state' ? '30 State Districts' : '9 Federal Districts'}
            </p>
          </div>

          {/* Layer Toggle */}
          <div className="layer-toggle-container">
            <label className="toggle-label">View</label>
            <div className="layer-toggle" role="group" aria-label="Select district type">
              <button
                onClick={() => setLayerType('state')}
                className={`toggle-button ${layerType === 'state' ? 'active' : ''}`}
                aria-pressed={layerType === 'state'}
              >
                <span className="toggle-icon">🏛️</span>
                <span className="toggle-text">State Legislative</span>
                <span className="toggle-count">30</span>
              </button>
              <button
                onClick={() => setLayerType('federal')}
                className={`toggle-button ${layerType === 'federal' ? 'active' : ''}`}
                aria-pressed={layerType === 'federal'}
              >
                <span className="toggle-icon">🦅</span>
                <span className="toggle-text">Federal Congressional</span>
                <span className="toggle-count">9</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* District Info Panel */}
      {hoveredInfo && (
        <div className="district-info-panel">
          <div className="info-header">
            <span className="info-type">{hoveredInfo.type}</span>
            <span className={`info-party party-${hoveredInfo.party}`}>
              {hoveredInfo.party}
            </span>
          </div>
          <div className="info-number">District {hoveredInfo.number}</div>
          <div className="info-name">{hoveredInfo.name}</div>
          <div className="info-rep">{hoveredInfo.representative}</div>
          <div className="info-action">Click to view details →</div>
        </div>
      )}

      {/* Legend */}
      <div className="map-legend">
        <div className="legend-title">Party Affiliation</div>
        <div className="legend-items">
          <div className="legend-item">
            <div className="legend-color" style={{ backgroundColor: PARTY_COLORS_LIGHT.R }}></div>
            <span>Republican</span>
          </div>
          <div className="legend-item">
            <div className="legend-color" style={{ backgroundColor: PARTY_COLORS_LIGHT.D }}></div>
            <span>Democrat</span>
          </div>
        </div>
      </div>

      {/* Loading Indicator */}
      {isLoading && (
        <div className="loading-overlay">
          <div className="loading-spinner"></div>
          <p>Loading {layerType === 'state' ? 'state legislative' : 'federal congressional'} districts...</p>
        </div>
      )}

      {/* Full-Screen Map */}
      <MapContainer
        bounds={ARIZONA_BOUNDS}
        className="fullscreen-map"
        onLoad={handleMapLoad}
      />
    </div>
  );
}
