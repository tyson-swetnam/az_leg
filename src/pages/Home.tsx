import { MapContainer } from '../components/Map';
import { ARIZONA_BOUNDS } from '../lib/constants';

export function Home() {
  return (
    <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Arizona Legislative Districts
        </h1>
        <p className="text-gray-600">
          Explore Arizona's 30 legislative districts and their representatives.
          Click on a district to view details.
        </p>
      </div>
      <MapContainer bounds={ARIZONA_BOUNDS} />
    </div>
  );
}
