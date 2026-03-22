import type { LocalOfficial } from '@/types/local-official';
import { formatPhone } from '@/lib/utils';

interface OfficialCardProps {
  official: LocalOfficial;
  jurisdictionType: string;
  jurisdictionId: string;
}

export function OfficialCard({ official, jurisdictionType, jurisdictionId }: OfficialCardProps) {
  const districtNum = official.district ?? official.ward;
  const districtLabel = official.ward ? `Ward ${official.ward}` : official.district ? `District ${official.district}` : '';
  const detailUrl = districtNum
    ? `/az_leg/local/${jurisdictionType}/${jurisdictionId}/${districtNum}`
    : undefined;

  return (
    <div
      className="legislator-card"
      role="article"
      aria-label={`${official.title} ${official.name}`}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <h3 className="legislator-card-name">{official.name}</h3>
          <p className="legislator-card-role">
            {official.title}
            {districtLabel && ` — ${districtLabel}`}
          </p>
        </div>
        {official.party && (
          <span
            className="legislator-party-badge"
            style={{
              backgroundColor: official.party === 'R' ? '#ef4444' : official.party === 'D' ? '#3b82f6' : '#6b7280',
            }}
          >
            {official.party === 'R' ? 'Republican' : official.party === 'D' ? 'Democratic' : official.party}
          </span>
        )}
      </div>

      {/* Contact Info */}
      <div className="space-y-3 mb-4">
        {official.phone && (
          <div className="flex items-center gap-3" style={{ color: 'var(--newsprint)' }}>
            <svg className="w-5 h-5 flex-shrink-0" style={{ color: 'var(--border)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
            </svg>
            <span>{formatPhone(official.phone)}</span>
          </div>
        )}

        {official.email && (
          <div className="flex items-center gap-3" style={{ color: 'var(--newsprint)' }}>
            <svg className="w-5 h-5 flex-shrink-0" style={{ color: 'var(--border)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
            <a
              href={`mailto:${official.email}`}
              className="contact-link"
              aria-label={`Email ${official.name}`}
            >
              {official.email}
            </a>
          </div>
        )}

        {official.website && (
          <div className="flex items-center gap-3" style={{ color: 'var(--newsprint)' }}>
            <svg className="w-5 h-5 flex-shrink-0" style={{ color: 'var(--border)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
            </svg>
            <a
              href={official.website}
              target="_blank"
              rel="noopener noreferrer"
              className="contact-link"
              aria-label={`Visit ${official.name}'s official website`}
            >
              Official Website
            </a>
          </div>
        )}

        {official.term && (
          <div className="flex items-center gap-3" style={{ color: 'var(--newsprint)' }}>
            <svg className="w-5 h-5 flex-shrink-0" style={{ color: 'var(--border)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <span>Term: {official.term}</span>
          </div>
        )}
      </div>

      {/* Social Media */}
      {official.socialMedia && Object.keys(official.socialMedia).length > 0 && (
        <div style={{ borderTop: '1px solid var(--border)', paddingTop: '1rem', marginTop: '1rem' }}>
          <p className="text-xs uppercase tracking-wide mb-3" style={{ color: 'var(--newsprint)', fontWeight: 600, letterSpacing: '0.1em' }}>
            Connect
          </p>
          <div className="flex flex-wrap gap-2">
            {official.socialMedia.twitter && (
              <a href={official.socialMedia.twitter} target="_blank" rel="noopener noreferrer" className="social-media-btn" aria-label={`${official.name}'s Twitter/X`}>
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" /></svg>
                <span className="text-sm">Twitter/X</span>
              </a>
            )}
            {official.socialMedia.facebook && (
              <a href={official.socialMedia.facebook} target="_blank" rel="noopener noreferrer" className="social-media-btn" aria-label={`${official.name}'s Facebook`}>
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" /></svg>
                <span className="text-sm">Facebook</span>
              </a>
            )}
            {official.socialMedia.instagram && (
              <a href={official.socialMedia.instagram} target="_blank" rel="noopener noreferrer" className="social-media-btn" aria-label={`${official.name}'s Instagram`}>
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" /></svg>
                <span className="text-sm">Instagram</span>
              </a>
            )}
            {official.socialMedia.linkedin && (
              <a href={official.socialMedia.linkedin} target="_blank" rel="noopener noreferrer" className="social-media-btn" aria-label={`${official.name}'s LinkedIn`}>
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" /></svg>
                <span className="text-sm">LinkedIn</span>
              </a>
            )}
          </div>
        </div>
      )}

      {/* CTA */}
      {detailUrl ? (
        <a
          href={detailUrl}
          className="legislator-cta"
          aria-label={`View details for ${official.name}`}
        >
          View Details
        </a>
      ) : official.website ? (
        <a
          href={official.website}
          target="_blank"
          rel="noopener noreferrer"
          className="legislator-cta"
          aria-label={`Visit ${official.name}'s official page`}
        >
          Visit Official Page
        </a>
      ) : null}
    </div>
  );
}
