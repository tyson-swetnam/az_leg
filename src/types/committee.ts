export interface Committee {
  id: string;
  committeeId: number;
  name: string;
  shortName: string;
  chair: string;
  viceChair?: string;
  members: string[];
  chamber: 'senate' | 'house';
}

export interface CommitteeData {
  senate: Committee[];
  house: Committee[];
  lastUpdated: string;
}
