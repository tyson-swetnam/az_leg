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

/**
 * Provenance / verification marker for a person's profile data.
 *
 * `status` is the roll-up surfaced as the UI badge: a record is "verified"
 * when its primary contact info comes from an official government source
 * (e.g. a `*.gov` website), and "unverified" otherwise (campaign sites,
 * scraped/manual data, or no confirmed source). All fields are optional so
 * existing data stays valid; an absent `verification` is treated as
 * "unverified" by the UI.
 */
export type VerificationStatus = 'verified' | 'unverified';

export interface Verification {
  status: VerificationStatus;
  source?: string;       // e.g. "azleg.gov", "house.gov", "manual", "scraped"
  lastVerified?: string; // ISO date string, e.g. "2026-06-01"
  /** Optional per-field provenance for finer-grained audits. */
  fields?: Partial<Record<string, { status: VerificationStatus; source?: string }>>;
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
  verification?: Verification;
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
  verification?: Verification;
}

export interface LegislatureData {
  districts: District[];
  executive: Executive[];
  lastUpdated: string;
}
