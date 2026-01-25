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
