import { Link } from 'react-router-dom';
import type { District } from '@/types/district';
import { PARTY_COLORS } from '@/lib/constants';
import { getPartyLabel } from '@/lib/utils';

interface DistrictInfoProps {
  district: District;
}

export function DistrictInfo({ district }: DistrictInfoProps) {
  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">
        {district.name}
      </h2>

      <div className="space-y-3">
        {/* Party Control */}
        <div className="flex items-center gap-2">
          <div
            className="w-3 h-3 rounded-full"
            style={{ backgroundColor: PARTY_COLORS[district.senator.party] }}
          />
          <span className="text-sm text-gray-600">
            {getPartyLabel(district.senator.party)} Control
          </span>
        </div>

        {/* Major Cities */}
        <div>
          <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">
            Major Cities
          </p>
          <p className="text-sm text-gray-700">
            {district.majorCities.join(', ')}
          </p>
        </div>

        {/* Link to main map */}
        <Link
          to="/"
          className="inline-block text-sm text-blue-600 hover:underline mt-2"
        >
          ← View on Main Map
        </Link>
      </div>
    </div>
  );
}
