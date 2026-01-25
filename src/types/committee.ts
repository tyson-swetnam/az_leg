export interface Committee {
  id: string;
  name: string;
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
