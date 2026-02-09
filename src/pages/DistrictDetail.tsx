import { useState, useEffect } from 'react';
import { useParams, Link, useSearchParams } from 'react-router-dom';
import { useDistrict, useFederalMapping, useCongressMember } from '@/lib/api/queries';
import { LegislatorCard, DistrictInfo, DistrictMap } from '@/components/District';
import '@/styles/district-detail.css';

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
      <div className="district-detail-page">
        <div className="district-detail-content" style={{ textAlign: 'center', paddingTop: '4rem' }}>
          <h1 className="district-section-heading" style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>
            District Not Found
          </h1>
          <p style={{ color: 'var(--newsprint)', marginBottom: '2rem' }}>
            The district you're looking for doesn't exist.
          </p>
          <Link to="/" className="district-return-btn">
            Return to Map
          </Link>
        </div>
      </div>
    );
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="district-detail-page">
        <div className="district-detail-content">
          <div className="district-skeleton" style={{ height: '2rem', width: '12rem', marginBottom: '2rem' }} />
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="space-y-4">
              <div className="district-skeleton" style={{ height: '24rem' }} />
              <div className="district-skeleton" style={{ height: '12rem' }} />
            </div>
            <div className="lg:col-span-2 space-y-6">
              <div className="district-skeleton" style={{ height: '16rem' }} />
              <div className="district-skeleton" style={{ height: '16rem' }} />
              <div className="district-skeleton" style={{ height: '16rem' }} />
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error || !district) {
    return (
      <div className="district-detail-page">
        <div className="district-detail-content" style={{ paddingTop: '4rem' }}>
          <div className="district-error">
            <h2>Unable to Load District Information</h2>
            <p>There was an error loading the district data. Please try again later.</p>
            <Link to="/" className="district-return-btn">
              Return to Map
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="district-detail-page">
      <div className="district-detail-content">
        {/* Breadcrumb */}
        <nav className="district-breadcrumb">
          <Link to="/">Home</Link>
          <span className="breadcrumb-separator">›</span>
          <span className="breadcrumb-current">District {district.id}</span>
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
                <h2 className="district-section-heading">
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
                <h2 className="district-section-heading">
                  Federal Representative
                </h2>
                {isLoadingCongress ? (
                  <div className="legislator-card" style={{ padding: '1.5rem' }}>
                    <div className="district-skeleton" style={{ height: '1.5rem', width: '66%', marginBottom: '1rem' }} />
                    <div className="district-skeleton" style={{ height: '1rem', width: '50%', marginBottom: '0.5rem' }} />
                    <div className="district-skeleton" style={{ height: '1rem', width: '75%' }} />
                  </div>
                ) : congressMember ? (
                  <>
                    <LegislatorCard
                      legislator={congressMember}
                      chamberLabel={`U.S. House - District ${congressMember.district}`}
                    />
                    <div className="federal-note">
                      <p>
                        <strong>Note:</strong> Congressional district boundaries do not align perfectly with
                        state legislative districts. This representative serves Congressional District {congressMember.district},
                        which includes parts of state district {district.id}.
                      </p>
                    </div>
                  </>
                ) : (
                  <div className="legislator-card" style={{ textAlign: 'center', color: 'var(--newsprint)' }}>
                    Federal representative information not available
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
