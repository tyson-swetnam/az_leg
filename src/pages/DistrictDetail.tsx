import { useState, useEffect } from 'react';
import { useParams, Link, useSearchParams } from 'react-router-dom';
import { useDistrict, useFederalMapping, useCongressMember } from '@/lib/api/queries';
import { LegislatorCard, DistrictInfo, DistrictMap } from '@/components/District';

export function DistrictDetail() {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const districtId = id ? parseInt(id, 10) : 0;

  // Check URL parameter for initial view
  const initialView = searchParams.get('view') === 'federal' ? 'federal' : 'state';
  const [activeLayer, setActiveLayer] = useState<'state' | 'federal'>(initialView);

  const { data: district, isLoading, error } = useDistrict(districtId);
  const { data: federalMapping } = useFederalMapping();
  const federalDistrictId = federalMapping?.stateToFederal[districtId.toString()];
  const { data: congressMember, isLoading: isLoadingCongress } = useCongressMember(federalDistrictId || 0);

  // Update active layer if URL parameter changes
  useEffect(() => {
    const viewParam = searchParams.get('view');
    if (viewParam === 'federal') {
      setActiveLayer('federal');
    } else if (viewParam === 'state') {
      setActiveLayer('state');
    }
  }, [searchParams]);

  // Invalid district ID
  if (!id || districtId < 1 || districtId > 30) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 sm:px-6 lg:px-8 text-center">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">District Not Found</h1>
        <p className="text-gray-600 mb-8">
          The district you're looking for doesn't exist.
        </p>
        <Link
          to="/"
          className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700"
        >
          Return to Map
        </Link>
      </div>
    );
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-48 mb-8" />
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="space-y-4">
              <div className="h-96 bg-gray-200 rounded-lg" />
              <div className="h-48 bg-gray-200 rounded-lg" />
            </div>
            <div className="lg:col-span-2 space-y-6">
              <div className="h-64 bg-gray-200 rounded-lg" />
              <div className="h-64 bg-gray-200 rounded-lg" />
              <div className="h-64 bg-gray-200 rounded-lg" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error || !district) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 sm:px-6 lg:px-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <h2 className="text-xl font-semibold text-red-900 mb-2">
            Unable to Load District Information
          </h2>
          <p className="text-red-700 mb-4">
            There was an error loading the district data. Please try again later.
          </p>
          <Link
            to="/"
            className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700"
          >
            Return to Map
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
      {/* Breadcrumb */}
      <nav className="mb-6 text-sm text-gray-600">
        <Link to="/" className="hover:text-gray-900">
          Home
        </Link>
        <span className="mx-2">›</span>
        <span className="text-gray-900">District {district.id}</span>
      </nav>

      {/* Two-column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left sidebar - Map and info */}
        <div className="space-y-6">
          {/* Interactive map with toggle */}
          <DistrictMap
            districtId={districtId}
            initialLayer={activeLayer}
            onLayerChange={setActiveLayer}
          />

          {/* District info card */}
          <DistrictInfo district={district} />
        </div>

        {/* Right content - Representative cards */}
        <div className="lg:col-span-2">
          {/* State Representatives - only show when state layer is active */}
          {activeLayer === 'state' && (
            <>
              <h2 className="text-2xl font-bold text-gray-900 mb-6">
                State Representatives
              </h2>

              {/* Senator */}
              <LegislatorCard
                legislator={district.senator}
                chamberLabel="State Senator"
              />

              {/* House Representatives */}
              <LegislatorCard
                legislator={district.representatives[0]}
                chamberLabel="State Representative"
              />
              <LegislatorCard
                legislator={district.representatives[1]}
                chamberLabel="State Representative"
              />
            </>
          )}

          {/* Federal Representative - only show when federal layer is active */}
          {activeLayer === 'federal' && (
            <>
              <h2 className="text-2xl font-bold text-gray-900 mb-6">
                Federal Representative
              </h2>
              {isLoadingCongress ? (
                <div className="bg-white rounded-lg shadow-sm p-6 mb-6 animate-pulse">
                  <div className="h-6 bg-gray-200 rounded w-2/3 mb-4" />
                  <div className="h-4 bg-gray-200 rounded w-1/2 mb-2" />
                  <div className="h-4 bg-gray-200 rounded w-3/4" />
                </div>
              ) : congressMember ? (
                <>
                  <LegislatorCard
                    legislator={congressMember}
                    chamberLabel={`U.S. House - District ${congressMember.district}`}
                  />
                  <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <p className="text-sm text-blue-800">
                      <strong>Note:</strong> Congressional district boundaries do not align perfectly with
                      state legislative districts. This representative serves Congressional District {congressMember.district},
                      which includes parts of state district {district.id}.
                    </p>
                  </div>
                </>
              ) : (
                <div className="bg-gray-50 rounded-lg p-6 text-center text-gray-600">
                  Federal representative information not available
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
