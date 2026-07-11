export class BasicInfoResponse {
  name?: string;
  region?: string;
  yearEstablished?: number;
  landAreaSm2?: number;
  officialWebsite?: string;
  motto?: string;
}

export class PopulationResponse {
  total?: number;
  male?: number;
  female?: number;
  youth?: number;
  lastUpdated?: Date;
}

export class KeyOfficialResponse {
  name?: string;
  title?: string;
  email?: string;
  phone?: string;
}

export class DepartmentResponse {
  name?: string;
  headName?: string;
  headEmail?: string;
}

export class ContactInfoResponse {
  address?: string;
  phone?: string;
  email?: string;
}

export class PartnershipHistoryResponse {
  agreementDate?: Date;
  summary?: string;
}
export class CityProfileResponse {
  id?: string;
  city?: string;
  basicInfo?: BasicInfoResponse;
  population?: PopulationResponse;
  keyOfficials?: KeyOfficialResponse[];
  departments?: DepartmentResponse[];
  areasOfFocus?: string[];
  contactInfo?: ContactInfoResponse;
  partnershipHistory?: PartnershipHistoryResponse;
  updatedAt?: Date;
  createdAt?: Date;
}
