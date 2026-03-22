export interface LocalOfficial {
  name: string;
  title?: string;
  district?: number;
  ward?: number;
  party?: string | null;
  phone?: string | null;
  email?: string | null;
  website?: string | null;
  photo?: string | null;
  socialMedia?: {
    twitter?: string;
    facebook?: string;
    instagram?: string;
    linkedin?: string;
  };
  term?: string | null;
}

export interface CountyData {
  name: string;
  website?: string;
  phone?: string;
  address?: string;
  supervisors: LocalOfficial[];
}

export interface CityData {
  name: string;
  website?: string;
  governingBody?: string;
  phone?: string;
  address?: string;
  mayor?: LocalOfficial;
  members: LocalOfficial[];
}

export interface LocalOfficialsData {
  lastUpdated: string;
  counties: Record<string, CountyData>;
  cities: Record<string, CityData>;
  research_status?: {
    tier1_complete?: string[];
    tier2_partial?: string[];
    tier3_missing?: string[];
    data_quality_notes?: Record<string, string>;
  };
}

// Unified view for components
export interface LocalJurisdiction {
  name: string;
  type: 'county' | 'city';
  id: string;
  governingBody: string;
  website?: string;
  officials: LocalOfficial[];
  mayor?: LocalOfficial;
}
