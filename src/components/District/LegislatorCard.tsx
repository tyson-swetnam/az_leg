import type { Legislator } from '@/types/legislature';
import type { CongressMember } from '@/types/federal';
import { PARTY_COLORS } from '@/lib/constants';
import { getPartyLabel, formatPhone } from '@/lib/utils';
import { CampaignFinanceLink } from './CampaignFinanceLink';

type LegislatorOrCongress = Legislator | CongressMember;

interface LegislatorCardProps {
  legislator: LegislatorOrCongress;
  chamberLabel: string; // "Senator", "Representative", "U.S. House Representative"
}

export function LegislatorCard({ legislator, chamberLabel }: LegislatorCardProps) {
  const partyColor = PARTY_COLORS[legislator.party];

  return (
    <div
      className="bg-white rounded-lg shadow-lg p-6 mb-6"
      role="article"
      aria-label={`${chamberLabel} ${legislator.name}, ${getPartyLabel(legislator.party)}`}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <h3 className="text-xl font-bold text-gray-900 mb-1">
            {legislator.name}
          </h3>
          <p className="text-sm text-gray-600">{chamberLabel}</p>
        </div>
        <span
          className="px-3 py-1 rounded-full text-sm font-medium text-white"
          style={{ backgroundColor: partyColor }}
        >
          {legislator.party === 'R' ? 'Republican' : 'Democratic'}
        </span>
      </div>

      {/* Contact Info */}
      <div className="space-y-3 mb-4">
        <div className="flex items-center gap-3 text-gray-700">
          <svg className="w-5 h-5 flex-shrink-0 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
          </svg>
          <span>{formatPhone(legislator.office.phone)}</span>
        </div>

        <div className="flex items-center gap-3 text-gray-700">
          <svg className="w-5 h-5 flex-shrink-0 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
          <a
            href={`mailto:${legislator.office.email}`}
            className="text-blue-600 hover:underline focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded"
            aria-label={`Email ${legislator.name} at ${legislator.office.email}`}
          >
            {legislator.office.email}
          </a>
        </div>

        <div className="flex items-center gap-3 text-gray-700">
          <svg className="w-5 h-5 flex-shrink-0 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
          </svg>
          <a
            href={legislator.office.website}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 hover:underline focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded"
            aria-label={`Visit ${legislator.name}'s official website`}
          >
            Official Website
          </a>
        </div>

        {/* Campaign Finance Link - only for state legislators */}
        {'chamber' in legislator && (legislator.chamber === 'senate' || legislator.chamber === 'house') && (
          <CampaignFinanceLink
            legislatorName={legislator.name}
            chamber={legislator.chamber}
          />
        )}
      </div>

      {/* Bio (if available) */}
      {'bio' in legislator && legislator.bio && (
        <div className="mb-4">
          <p className="text-sm text-gray-600">{legislator.bio}</p>
        </div>
      )}

      {/* Committees (if available) */}
      {'committees' in legislator && legislator.committees && legislator.committees.length > 0 && (
        <div className="mb-4">
          <p className="text-xs text-gray-500 uppercase tracking-wide mb-2">Committees</p>
          <div className="flex flex-wrap gap-2">
            {legislator.committees.map((committee, idx) => (
              <span
                key={idx}
                className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded"
              >
                {committee}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* CTA Button */}
      <a
        href={legislator.office.website}
        target="_blank"
        rel="noopener noreferrer"
        className="block w-full bg-blue-600 text-white text-center py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        aria-label={`Visit ${legislator.name}'s official page (opens in new tab)`}
      >
        Visit Official Page
      </a>
    </div>
  );
}
