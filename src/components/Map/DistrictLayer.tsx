import { useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { Map } from 'maplibre-gl';
import { useDistrictBoundaries } from '@/lib/api/queries';
import { useDistrictLayer } from './useDistrictLayer';
import { useMapInteractions } from './useMapInteractions';
import { DistrictTooltip } from './DistrictTooltip';
import { DistrictPopup } from './DistrictPopup';

interface DistrictLayerProps {
  map: Map | null;
  isLoaded: boolean;
}

export function DistrictLayer({ map, isLoaded }: DistrictLayerProps) {
  const { data, isLoading, error } = useDistrictBoundaries();
  const { tooltip, selectedDistrict, closePopup } = useMapInteractions(map, isLoaded);

  useDistrictLayer({ map, data, isLoaded });

  // Render popup into MapLibre popup container
  useEffect(() => {
    if (selectedDistrict) {
      const popupContent = document.getElementById('popup-content');
      if (popupContent) {
        const root = createRoot(popupContent);
        root.render(
          <DistrictPopup district={selectedDistrict} onClose={closePopup} />
        );

        return () => {
          root.unmount();
        };
      }
    }
  }, [selectedDistrict, closePopup]);

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

  return (
    <>
      {tooltip && (
        <DistrictTooltip
          x={tooltip.x}
          y={tooltip.y}
          districtNumber={tooltip.districtNumber}
          senatorName={tooltip.senatorName}
        />
      )}
    </>
  );
}
