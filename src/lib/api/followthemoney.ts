import type {
  FollowTheMoneyParams,
  CampaignFinanceData,
} from '@/types/campaign-finance';
import {
  FOLLOW_THE_MONEY_BASE_URL,
} from '@/lib/constants';
import campaignFinanceIds from '@/data/campaign-finance-ids.json';

/**
 * Convert legislator name to Follow the Money API format
 * "First Last" → "LAST, FIRST"
 * "First Middle Last" → "LAST, FIRST MIDDLE"
 * "Quang H. Nguyen" → "NGUYEN, QUANG H"
 */
export function formatNameForAPI(name: string): string {
  // Remove common suffixes (Jr, Sr, etc.)
  const cleanName = name.replace(/\s+(Jr\.?|Sr\.?|II|III|IV)$/i, '').trim();

  // Split on spaces
  const parts = cleanName.split(/\s+/);

  if (parts.length === 0) {
    return '';
  }

  if (parts.length === 1) {
    return parts[0].toUpperCase();
  }

  // Last name is the last part, everything else is first/middle
  const lastName = parts[parts.length - 1];
  const firstMiddle = parts.slice(0, -1).join(' ');

  return `${lastName.toUpperCase()}, ${firstMiddle.toUpperCase()}`;
}

/**
 * Get campaign finance entity ID and profile URL from static mapping
 * Returns null if legislator not found (not an error - graceful degradation)
 */
export async function fetchCampaignFinanceId(
  params: FollowTheMoneyParams
): Promise<CampaignFinanceData | null> {
  const { name, chamber } = params;

  try {
    // Convert name to API format for lookup
    const formattedName = formatNameForAPI(name);

    // Get the appropriate chamber mapping
    const chamberMapping = chamber === 'senate'
      ? (campaignFinanceIds as any).senate
      : (campaignFinanceIds as any).house;

    // Look up entity ID in static mapping
    const entityId = chamberMapping[formattedName];

    // If no entity ID found or it's null, return null (graceful degradation)
    if (!entityId) {
      return null;
    }

    // Construct profile URL
    const profileUrl = `${FOLLOW_THE_MONEY_BASE_URL}/entity-details?eid=${entityId}`;

    return {
      entityId,
      profileUrl,
      name: formattedName,
    };
  } catch (error) {
    // Silent failure - errors shouldn't break the UI
    console.warn('Failed to get campaign finance data:', error);
    return null;
  }
}
