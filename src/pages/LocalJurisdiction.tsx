import { useParams, Link } from 'react-router-dom';
import { useJurisdiction } from '@/lib/api/queries';
import { JurisdictionHeader, OfficialCard } from '@/components/Local';
import '@/styles/district-detail.css';
import '@/styles/local-detail.css';

export function LocalJurisdiction() {
  const { jurisdictionType, jurisdictionId } = useParams<{
    jurisdictionType: string;
    jurisdictionId: string;
  }>();

  const { data: jurisdiction, isLoading } = useJurisdiction(
    jurisdictionType || '',
    jurisdictionId || ''
  );

  if (!jurisdictionType || !jurisdictionId) {
    return (
      <div className="district-detail-page">
        <div className="district-detail-content" style={{ textAlign: 'center', paddingTop: '4rem' }}>
          <h1 className="district-section-heading" style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>
            Jurisdiction Not Found
          </h1>
          <p style={{ color: 'var(--newsprint)', marginBottom: '2rem' }}>
            The jurisdiction you're looking for doesn't exist.
          </p>
          <Link to="/" className="district-return-btn">
            Return to Map
          </Link>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="district-detail-page">
        <div className="district-detail-content">
          <div className="district-skeleton" style={{ height: '8rem', marginBottom: '2rem' }} />
          <div className="officials-grid">
            {[1, 2, 3].map((i) => (
              <div key={i} className="district-skeleton" style={{ height: '16rem' }} />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!jurisdiction) {
    return (
      <div className="district-detail-page">
        <div className="district-detail-content" style={{ textAlign: 'center', paddingTop: '4rem' }}>
          <h1 className="district-section-heading" style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>
            Jurisdiction Not Found
          </h1>
          <p style={{ color: 'var(--newsprint)', marginBottom: '2rem' }}>
            Information for this jurisdiction is not yet available.
          </p>
          <Link to="/" className="district-return-btn">
            Return to Map
          </Link>
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
          <span className="breadcrumb-current">{jurisdiction.name}</span>
        </nav>

        <JurisdictionHeader jurisdiction={jurisdiction} />

        {/* Mayor / Executive */}
        {jurisdiction.mayor && (
          <div className="mayor-section">
            <div className="local-section-divider">
              <span>Executive</span>
            </div>
            <OfficialCard
              official={jurisdiction.mayor}
              jurisdictionType={jurisdictionType}
              jurisdictionId={jurisdictionId}
            />
          </div>
        )}

        {/* Officials Grid */}
        <div className="local-section-divider">
          <span>{jurisdiction.governingBody}</span>
        </div>

        {jurisdiction.officials.length > 0 ? (
          <div className="officials-grid">
            {jurisdiction.officials.map((official, idx) => (
              <OfficialCard
                key={idx}
                official={official}
                jurisdictionType={jurisdictionType}
                jurisdictionId={jurisdictionId}
              />
            ))}
          </div>
        ) : (
          <div className="local-placeholder">
            Information not yet available for this jurisdiction.
          </div>
        )}
      </div>
    </div>
  );
}
