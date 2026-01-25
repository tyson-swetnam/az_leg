import { Map } from 'maplibre-gl';
import { useDistrictBoundaries } from '@/lib/api/queries';
import { useDistrictLayer } from './useDistrictLayer';

interface DistrictLayerProps {
  map: Map | null;
  isLoaded: boolean;
}

export function DistrictLayer({ map, isLoaded }: DistrictLayerProps) {
  const { data, isLoading, error } = useDistrictBoundaries();

  useDistrictLayer({ map, data, isLoaded });

  if (error) {
    return (
      <div className="absolute top-4 left-4 bg-red-50 border border-red-200 rounded-lg p-4 max-w-sm">
        <p className="text-sm text-red-800">
          Failed to load district boundaries. Using cached data if available.
        </p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="absolute top-4 left-4 bg-white rounded-lg shadow-lg p-3">
        <p className="text-sm text-gray-600">Loading district boundaries...</p>
      </div>
    );
  }

  return null;
}
