export interface CongressMember {
  district: number; // 1-9
  name: string;
  party: 'R' | 'D';
  office: {
    phone: string;
    email: string;
    website: string;
  };
  bio?: string;
}

export interface FederalMapping {
  stateToFederal: Record<string, number>; // "1" -> 4
  congressMembers: CongressMember[];
}
