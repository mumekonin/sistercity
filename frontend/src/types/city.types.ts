export interface BasicInfo {
  name: string;
  region: string;
  yearEstablished: number;
  landAreaSm2: number;
  officialWebsite?: string;
  motto?: string;
}

export interface Population {
  total: number;
  male: number;
  female: number;
  youth: number;
  lastUpdated: Date;
}

export interface KeyOfficial {
  name: string;
  title: string;
  email: string;
  phone: string;
}

export interface Department {
  name: string;
  headName: string;
  headEmail: string;
}

export interface ContactInfo {
  address: string;
  phone: string;
  email: string;
}

export interface PartnershipHistory {
  agreementDate: Date;
  summary: string;
}

export interface CityProfile {
  id: string;
  city: string;
  basicInfo: BasicInfo;
  population: Population;
  keyOfficials: KeyOfficial[];
  departments: Department[];
  areasOfFocus: string[];
  contactInfo: ContactInfo;
  partnershipHistory: PartnershipHistory;
  createdAt: Date;
  updatedAt: Date;
}