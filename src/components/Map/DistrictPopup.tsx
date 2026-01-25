import { useNavigate } from 'react-router-dom';
import type { District } from '@/types/district';
import { getPartyLabel } from '@/lib/utils';
import { PARTY_COLORS } from '@/lib/constants';

interface DistrictPopupProps {
  district: District;
  onClose: () => void;
}

export function DistrictPopup({ district, onClose }: DistrictPopupProps) {
  const navigate = useNavigate();

  const handleViewDetails = () => {
    navigate(`/district/${district.id}`);
  };

  return (
    <div className="bg-white rounded-lg shadow-xl p-4 min-w-[280px]">
      <div className="flex items-start justify-between mb-3">
        <h3 className="text-lg font-semibold text-gray-900">
          District {district.id}
        </h3>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-gray-600"
          aria-label="Close"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <div className="space-y-2 mb-4">
        <div className="flex items-center gap-2">
          <div
            className="w-3 h-3 rounded-full"
            style={{ backgroundColor: PARTY_COLORS[district.senator.party] }}
          />
          <span className="text-sm text-gray-600">
            {getPartyLabel(district.senator.party)} Control
          </span>
        </div>

        <div>
          <div className="text-xs text-gray-500 uppercase tracking-wide">Senator</div>
          <div className="text-sm font-medium text-gray-900">
            {district.senator.name}
          </div>
        </div>

        <div>
          <div className="text-xs text-gray-500 uppercase tracking-wide">Major Cities</div>
          <div className="text-sm text-gray-700">
            {district.majorCities.slice(0, 3).join(', ')}
          </div>
        </div>
      </div>

      <button
        onClick={handleViewDetails}
        className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
      >
        View Details
      </button>
    </div>
  );
}
