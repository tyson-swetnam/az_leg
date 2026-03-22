export interface LocalOfficial {
  name: string;
  title: string; // 'Supervisor', 'Council Member', 'Mayor', etc.
  district?: number;
  ward?: number;
  party?: string; // may be null for nonpartisan offices
  phone?: string;
  email?: string;
  website?: string;
  photo?: string;
  socialMedia?: {
    twitter?: string;
    facebook?: string;
    instagram?: string;
    linkedin?: string;
  };
  term?: string;
}

export interface LocalJurisdiction {
  name: string; // 'Maricopa County', 'City of Phoenix'
  type: 'county' | 'city' | 'town';
  id: string; // URL-safe slug: 'maricopa', 'phoenix'
  governingBody: string; // 'Board of Supervisors', 'City Council'
  website?: string;
  officials: LocalOfficial[];
  mayor?: LocalOfficial;
}

export interface LocalOfficialsData {
  jurisdictions: LocalJurisdiction[];
  lastUpdated: string;
}
