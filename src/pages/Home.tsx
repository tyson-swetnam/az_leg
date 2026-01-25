import { useState } from 'react';
import { Map } from 'maplibre-gl';
import { MapContainer, DistrictLayer } from '@/components/Map';
import { ARIZONA_BOUNDS } from '@/lib/constants';

export function Home() {
  const [map, setMap] = useState<Map | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  const handleMapLoad = (mapInstance: Map) => {
    setMap(mapInstance);
    setIsLoaded(true);
  };

  return (
    <div>
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Arizona Legislative Districts
          </h1>
          <p className="text-gray-600">
            Explore the 30 legislative districts and their representatives
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
        <MapContainer
          bounds={ARIZONA_BOUNDS}
          className="h-[600px] w-full rounded-lg shadow-lg"
          onLoad={handleMapLoad}
        >
          <DistrictLayer map={map} isLoaded={isLoaded} />
        </MapContainer>
      </div>
    </div>
  );
}
