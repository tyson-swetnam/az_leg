import { useState, useEffect, useCallback, useRef } from 'react';
import { Map, MapMouseEvent, Popup } from 'maplibre-gl';
import type { District } from '@/types/district';
import { useLegislators } from '@/lib/api/queries';

interface TooltipState {
  x: number;
  y: number;
  districtNumber: number;
  senatorName: string;
}

export function useMapInteractions(map: Map | null, isLoaded: boolean) {
  const [tooltip, setTooltip] = useState<TooltipState | null>(null);
  const [selectedDistrict, setSelectedDistrict] = useState<District | null>(null);
  const { data: legislators } = useLegislators();

  // Use a ref for popup to avoid stale closures and unnecessary re-registrations
  const popupRef = useRef<Popup | null>(null);

  const handleMouseMove = useCallback((e: MapMouseEvent) => {
    const features = map?.queryRenderedFeatures(e.point, {
      layers: ['districts-fill'],
    });

    if (features && features.length > 0 && legislators) {
      const districtNumber = features[0].properties?.DISTRICT;
      const district = legislators.districts.find(d => d.id === districtNumber);

      if (district) {
        setTooltip({
          x: e.originalEvent.clientX,
          y: e.originalEvent.clientY,
          districtNumber: district.id,
          senatorName: district.senator.name,
        });
      }
    } else {
      setTooltip(null);
    }
  }, [map, legislators]);

  // Named function so it can be properly removed
  const handleMouseLeave = useCallback(() => {
    setTooltip(null);
  }, []);

  const handleClick = useCallback((e: MapMouseEvent) => {
    const features = map?.queryRenderedFeatures(e.point, {
      layers: ['districts-fill'],
    });

    if (features && features.length > 0 && legislators && map) {
      const districtNumber = features[0].properties?.DISTRICT;
      const district = legislators.districts.find(d => d.id === districtNumber);

      if (district) {
        // Remove existing popup via ref (always current, no stale closure)
        popupRef.current?.remove();

        // Create new popup
        const newPopup = new Popup({
          closeButton: false,
          closeOnClick: false,
          offset: 10,
        })
          .setLngLat(e.lngLat)
          .setHTML('<div id="popup-content"></div>')
          .addTo(map);

        popupRef.current = newPopup;
        setSelectedDistrict(district);
      }
    }
  }, [map, legislators]); // No popup dependency — using ref instead

  const closePopup = useCallback(() => {
    popupRef.current?.remove();
    popupRef.current = null;
    setSelectedDistrict(null);
  }, []);

  useEffect(() => {
    if (!map || !isLoaded) return;

    map.on('mousemove', 'districts-fill', handleMouseMove);
    map.on('mouseleave', 'districts-fill', handleMouseLeave);
    map.on('click', 'districts-fill', handleClick);

    return () => {
      map.off('mousemove', 'districts-fill', handleMouseMove);
      map.off('mouseleave', 'districts-fill', handleMouseLeave);
      map.off('click', 'districts-fill', handleClick);
    };
  }, [map, isLoaded, handleMouseMove, handleMouseLeave, handleClick]);

  return {
    tooltip,
    selectedDistrict,
    closePopup,
  };
}
