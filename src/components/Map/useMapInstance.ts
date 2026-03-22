import { useEffect, useRef, useState } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { MAPLIBRE_STYLE, ARIZONA_CENTER } from '../../lib/constants';

interface UseMapInstanceProps {
  bounds?: [number, number, number, number];
}

export function useMapInstance({ bounds }: UseMapInstanceProps = {}) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const [mapInstance, setMapInstance] = useState<maplibregl.Map | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  // Capture initial bounds so the map starts at the right place,
  // but don't recreate the map when bounds change — callers use fitBounds for that.
  const initialBounds = useRef(bounds);

  useEffect(() => {
    if (!mapContainer.current || mapRef.current) return;

    const newMap = new maplibregl.Map({
      container: mapContainer.current,
      style: MAPLIBRE_STYLE,
      center: ARIZONA_CENTER,
      zoom: 6,
      bounds: initialBounds.current,
      fitBoundsOptions: {
        padding: 20,
      },
    });

    newMap.addControl(new maplibregl.NavigationControl(), 'top-right');

    newMap.on('load', () => {
      setMapInstance(newMap);
      setIsLoaded(true);
    });

    mapRef.current = newMap;

    return () => {
      newMap.remove();
      mapRef.current = null;
      setMapInstance(null);
      setIsLoaded(false);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Create map once — bounds updates handled by callers via fitBounds

  return { mapContainer, map: mapInstance, isLoaded };
}
