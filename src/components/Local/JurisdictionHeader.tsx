import type { LocalJurisdiction } from '@/types/local-official';

interface JurisdictionHeaderProps {
  jurisdiction: LocalJurisdiction;
}

const TYPE_LABELS: Record<string, string> = {
  county: 'County Government',
  city: 'City Government',
  town: 'Town Government',
};

export function JurisdictionHeader({ jurisdiction }: JurisdictionHeaderProps) {
  return (
    <div className="jurisdiction-header">
      <div className="jurisdiction-header-content">
        <p className="jurisdiction-type-label">
          {TYPE_LABELS[jurisdiction.type] || 'Local Government'}
        </p>
        <h1 className="jurisdiction-name">{jurisdiction.name}</h1>
        <p className="jurisdiction-body">{jurisdiction.governingBody}</p>
        {jurisdiction.website && (
          <a
            href={jurisdiction.website}
            target="_blank"
            rel="noopener noreferrer"
            className="jurisdiction-website-link"
            aria-label={`Visit ${jurisdiction.name} official website`}
          >
            Official Website &#8599;
          </a>
        )}
      </div>
    </div>
  );
}
