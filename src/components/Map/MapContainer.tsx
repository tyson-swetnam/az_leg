import { ReactNode } from 'react';
import { useMapInstance } from './useMapInstance';

interface MapContainerProps {
  bounds?: [number, number, number, number];
  children?: ReactNode;
  className?: string;
}

export function MapContainer({
  bounds,
  children,
  className = 'h-[600px] w-full',
}: MapContainerProps) {
  const { mapContainer, map, isLoaded } = useMapInstance({ bounds });

  return (
    <div className="relative">
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
