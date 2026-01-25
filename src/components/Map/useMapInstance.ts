import { useEffect, useRef, useState } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { MAPLIBRE_STYLE, ARIZONA_CENTER } from '../../lib/constants';

interface UseMapInstanceProps {
  bounds?: [number, number, number, number];
}

export function useMapInstance({ bounds }: UseMapInstanceProps = {}) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<maplibregl.Map | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    if (!mapContainer.current || map.current) return;

    map.current = new maplibregl.Map({
      container: mapContainer.current,
      style: MAPLIBRE_STYLE,
      center: ARIZONA_CENTER,
      zoom: 6,
      bounds: bounds,
      fitBoundsOptions: {
        padding: 20,
      },
    });

    map.current.addControl(new maplibregl.NavigationControl(), 'top-right');

    map.current.on('load', () => {
      setIsLoaded(true);
    });

    return () => {
      map.current?.remove();
      map.current = null;
    };
  }, [bounds]);

  return { mapContainer, map: map.current, isLoaded };
}
