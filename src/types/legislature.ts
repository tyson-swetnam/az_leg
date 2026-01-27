import type { District } from './district';
import type { CampaignFinanceData } from './campaign-finance';

export type Party = 'R' | 'D';

export type Chamber = 'senate' | 'house';

export interface Office {
  phone: string;
  email: string;
  website: string;
}

export interface SocialMediaAccounts {
  twitter?: string;      // Twitter/X URL
  facebook?: string;     // Facebook URL
  instagram?: string;    // Instagram URL
  linkedin?: string;     // LinkedIn URL
  bluesky?: string;      // BlueSky URL
}

export interface SocialMedia {
  personal?: SocialMediaAccounts;   // Personal social media accounts
  official?: SocialMediaAccounts;   // Official/government accounts
}

export interface Legislator {
  name: string;
  party: Party;
  chamber: Chamber;
  district: number;
  office: Office;
  bio?: string;
  photoUrl?: string;
  committees?: string[];
  campaignWebsite?: string;
  campaignFinance?: CampaignFinanceData;
  socialMedia?: SocialMedia;
}

export interface Senator extends Legislator {
  chamber: 'senate';
}

export interface Representative extends Legislator {
  chamber: 'house';
}

export interface Executive {
  title: string;
  name: string;
  party: Party;
  birthDate?: string;
  age?: number;
  office: Office;
  socialMedia?: SocialMedia;
}

export interface LegislatureData {
  districts: District[];
  executive: Executive[];
  lastUpdated: string;
}
