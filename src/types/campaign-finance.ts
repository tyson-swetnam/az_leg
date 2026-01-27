export interface FollowTheMoneyParams {
  name: string;
  chamber: 'senate' | 'house';
  year?: number;
}

export interface CampaignFinanceData {
  entityId: string | null;
  profileUrl: string | null;
  name: string;
}

export interface FTMApiResponse {
  metaInfo: object;
  records: Array<{
    Career_Summary: {
      token: string;
      id: string;
      Career_Summary: string;
    };
  }>;
}
