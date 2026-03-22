import { useEffect, useState, type ReactNode } from 'react';
import { Map } from 'maplibre-gl';
import { useMapInstance } from './useMapInstance';
import { FallbackMap } from './FallbackMap';
import { isWebGLSupported } from '@/lib/webgl';

interface MapContainerProps {
  bounds?: [number, number, number, number];
  children?: ReactNode;
  className?: string;
  onLoad?: (map: Map) => void;
  /** District to highlight in fallback mode */
  highlightDistrict?: number;
}

export function MapContainer({
  bounds,
  children,
  className = 'h-[600px] w-full',
  onLoad,
  highlightDistrict,
}: MapContainerProps) {
  const [webglAvailable] = useState(() => isWebGLSupported());

  // Always call hooks (React rules), but only use the map if WebGL is available
  const { mapContainer, map, isLoaded } = useMapInstance(
    webglAvailable ? { bounds } : {}
  );

  // Notify parent when map is ready
  useEffect(() => {
    if (map && isLoaded && onLoad) {
      onLoad(map);
    }
  }, [map, isLoaded, onLoad]);

  // WebGL not available — render SVG fallback
  if (!webglAvailable) {
    return (
      <FallbackMap className={className} highlightDistrict={highlightDistrict} />
    );
  }

  // Check if this is a fullscreen map
  const isFullscreen = className.includes('fullscreen');
  const wrapperClass = isFullscreen ? 'absolute inset-0' : 'relative';

  return (
    <div className={wrapperClass}>
      <div ref={mapContainer} className={className} />
      {!isLoaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
          <div className="flex items-center space-x-2">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="text-gray-600">Loading map...</span>
          </div>
        </div>
      )}
      {isLoaded && children}
    </div>
  );
}
