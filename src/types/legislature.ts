export type Party = 'R' | 'D';

export type Chamber = 'senate' | 'house';

export interface Office {
  phone: string;
  email: string;
  website: string;
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
}
