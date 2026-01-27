import { useCampaignFinance } from '@/lib/api/queries';
import type { Chamber } from '@/types/legislature';
import { DEFAULT_CAMPAIGN_FINANCE_YEAR } from '@/lib/constants';

interface CampaignFinanceLinkProps {
  legislatorName: string;
  chamber: Chamber;
}

export function CampaignFinanceLink({
  legislatorName,
  chamber,
}: CampaignFinanceLinkProps) {
  const { data, isLoading } = useCampaignFinance(
    legislatorName,
    chamber,
    DEFAULT_CAMPAIGN_FINANCE_YEAR
  );

  // Graceful degradation - hide if no data
  if (!isLoading && !data?.profileUrl) {
    return null;
  }

  // Loading state - subtle spinner
  if (isLoading) {
    return (
      <div className="flex items-center gap-3 text-gray-400 animate-pulse">
        <svg
          className="w-5 h-5 flex-shrink-0"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
        <span className="text-sm">Loading campaign finance...</span>
      </div>
    );
  }

  // Render link matching existing contact info style
  return (
    <div className="flex items-center gap-3 text-gray-700">
      <svg
        className="w-5 h-5 flex-shrink-0 text-gray-400"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
        />
      </svg>
      <a
        href={data?.profileUrl || '#'}
        target="_blank"
        rel="noopener noreferrer"
        className="text-blue-600 hover:underline focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded"
        aria-label={`View campaign finance for ${legislatorName} on Follow the Money`}
      >
        View Campaign Finance
      </a>
    </div>
  );
}
