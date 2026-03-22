import { useEffect, useRef } from 'react';
import maplibregl, { Map } from 'maplibre-gl';
import type { LocalLayerType, LocalDistrictGeoJSON } from '@/types/local-district';
import { LOCAL_LAYER_CONFIGS, LOCAL_LAYER_COLORS } from '@/lib/constants';

interface UseLocalDistrictLayerProps {
  map: Map | null;
  isLoaded: boolean;
  layerType: LocalLayerType | null;
  geojsonData: LocalDistrictGeoJSON | undefined;
  onHover: (info: LocalHoverInfo | null) => void;
}

export interface LocalHoverInfo {
  id: string | number;
  label: string;
  name?: string;
  rep?: string;
  phone?: string;
  url?: string;
  layerLabel: string;
}

const SOURCE_ID = 'local-districts';
const FILL_LAYER_ID = 'local-districts-fill';
const BORDER_LAYER_ID = 'local-districts-border';
const HOVER_LAYER_ID = 'local-districts-hover';

function cleanupLayers(map: Map) {
  try {
    if (map.getLayer(HOVER_LAYER_ID)) map.removeLayer(HOVER_LAYER_ID);
    if (map.getLayer(BORDER_LAYER_ID)) map.removeLayer(BORDER_LAYER_ID);
    if (map.getLayer(FILL_LAYER_ID)) map.removeLayer(FILL_LAYER_ID);
    if (map.getSource(SOURCE_ID)) map.removeSource(SOURCE_ID);
  } catch {
    // layers may already be removed
  }
}

export function useLocalDistrictLayer({
  map,
  isLoaded,
  layerType,
  geojsonData,
  onHover,
}: UseLocalDistrictLayerProps) {
  const popupRef = useRef<maplibregl.Popup | null>(null);

  useEffect(() => {
    if (!map || !isLoaded) return;
    if (!map.isStyleLoaded()) return;

    // Always clean up first
    cleanupLayers(map);

    if (!layerType || !geojsonData) return;

    const config = LOCAL_LAYER_CONFIGS[layerType];
    if (!config) return;

    const colors = LOCAL_LAYER_COLORS[config.group] || LOCAL_LAYER_COLORS.county;

    // Add source
    map.addSource(SOURCE_ID, {
      type: 'geojson',
      data: geojsonData as any,
    });

    // Build color expression: assign colors to features by index
    const colorExpression: any[] = ['case'];
    geojsonData.features.forEach((feature, i) => {
      const idValue = feature.properties?.[config.idField];
      if (idValue !== undefined && idValue !== null) {
        const color = colors[i % colors.length];
        // Use string comparison for flexibility
        colorExpression.push(
          ['==', ['to-string', ['get', config.idField]], String(idValue)],
          color
        );
      }
    });
    colorExpression.push('#94a3b830'); // fallback

    // Add fill layer
    map.addLayer({
      id: FILL_LAYER_ID,
      type: 'fill',
      source: SOURCE_ID,
      paint: {
        'fill-color': colorExpression as any,
        'fill-opacity': 0.55,
      },
    });

    // Add border layer
    map.addLayer({
      id: BORDER_LAYER_ID,
      type: 'line',
      source: SOURCE_ID,
      paint: {
        'line-color': '#2a2a2a',
        'line-width': config.group === 'precinct' ? 0.5 : 1.5,
      },
    });

    // Add hover highlight layer
    map.addLayer({
      id: HOVER_LAYER_ID,
      type: 'line',
      source: SOURCE_ID,
      paint: {
        'line-color': '#c9a961',
        'line-width': 3,
      },
      filter: ['==', ['to-string', ['get', config.idField]], ''],
    });

    // Event handlers
    const handleMouseMove = (e: maplibregl.MapMouseEvent) => {
      const features = map.queryRenderedFeatures(e.point, {
        layers: [FILL_LAYER_ID],
      });

      if (features && features.length > 0) {
        const props = features[0].properties || {};
        const idValue = props[config.idField];
        map.getCanvas().style.cursor = 'pointer';

        if (idValue !== undefined) {
          map.setFilter(HOVER_LAYER_ID, [
            '==',
            ['to-string', ['get', config.idField]],
            String(idValue),
          ]);
        }

        // Format name for display (handle "bos X" → "District X")
        let displayName = config.nameField ? props[config.nameField] : undefined;
        if (!displayName) {
          const displayId = String(idValue).replace(/^bos\s*/i, '');
          displayName = `District ${displayId}`;
        }

        onHover({
          id: idValue,
          label: config.label,
          layerLabel: config.label,
          name: displayName,
          rep: config.repField ? props[config.repField] : undefined,
          phone: config.phoneField ? props[config.phoneField] : undefined,
          url: config.urlField ? props[config.urlField] : undefined,
        });
      } else {
        map.getCanvas().style.cursor = '';
        map.setFilter(HOVER_LAYER_ID, [
          '==',
          ['to-string', ['get', config.idField]],
          '',
        ]);
        onHover(null);
      }
    };

    const handleMouseLeave = () => {
      map.getCanvas().style.cursor = '';
      map.setFilter(HOVER_LAYER_ID, [
        '==',
        ['to-string', ['get', config.idField]],
        '',
      ]);
      onHover(null);
      // Don't remove popup on mouse leave - let it stay until closed by user or replaced by new click
    };

    const handleClick = (e: maplibregl.MapMouseEvent) => {
      const features = map.queryRenderedFeatures(e.point, {
        layers: [FILL_LAYER_ID],
      });

      if (features && features.length > 0) {
        const props = features[0].properties || {};
        const idValue = props[config.idField];

        // Build popup content
        let html = '<div class="local-popup">';
        html += `<div class="local-popup-header">${config.label}</div>`;

        // Show a human-readable district/ward name
        if (config.nameField && props[config.nameField]) {
          html += `<div class="local-popup-name">${props[config.nameField]}</div>`;
        } else {
          // Format ID nicely (e.g., "bos 1" → "District 1")
          const displayId = String(idValue).replace(/^bos\s*/i, '');
          html += `<div class="local-popup-name">District ${displayId}</div>`;
        }

        if (config.repField && props[config.repField]) {
          html += `<div class="local-popup-rep"><strong>${props[config.repField]}</strong></div>`;
        }
        if (config.phoneField && props[config.phoneField]) {
          html += `<div class="local-popup-phone">&#9742; ${props[config.phoneField]}</div>`;
        }
        if (config.urlField && props[config.urlField]) {
          html += `<div class="local-popup-url"><a href="${props[config.urlField]}" target="_blank" rel="noopener noreferrer">Official Website &#8599;</a></div>`;
        }
        html += '</div>';

        // Remove existing popup
        if (popupRef.current) {
          popupRef.current.remove();
        }

        popupRef.current = new maplibregl.Popup({
          closeButton: true,
          closeOnClick: false,
          maxWidth: '320px',
        })
          .setLngLat(e.lngLat)
          .setHTML(html)
          .addTo(map);
      }
    };

    map.on('mousemove', FILL_LAYER_ID, handleMouseMove);
    map.on('mouseleave', FILL_LAYER_ID, handleMouseLeave);
    map.on('click', FILL_LAYER_ID, handleClick);

    return () => {
      if (!map || !map.isStyleLoaded()) return;
      try {
        map.off('mousemove', FILL_LAYER_ID, handleMouseMove);
        map.off('mouseleave', FILL_LAYER_ID, handleMouseLeave);
        map.off('click', FILL_LAYER_ID, handleClick);
        cleanupLayers(map);
        if (popupRef.current) {
          popupRef.current.remove();
          popupRef.current = null;
        }
      } catch {
        // cleanup errors are non-critical
      }
    };
  }, [map, isLoaded, layerType, geojsonData, onHover]);
}
