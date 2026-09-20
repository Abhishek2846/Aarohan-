export type UserRole =
  | "PIA"
  | "CENTRAL_MINISTRY"
  | "STATE_AUTHORITY"
  | "DISTRICT_OFFICER"
  | "FIELD_OFFICER"
  | "AUDITOR"
  | "CITIZEN";

export interface Jurisdiction {
  level: "NATIONAL" | "STATE" | "DISTRICT" | "TALUK";
  stateCode?: string;
  stateName?: string;
  districtCode?: string;
  districtName?: string;
  agencyCode?: string;
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: UserRole;
  designation: string;
  department: string;
  jurisdiction: Jurisdiction;
  avatarUrl?: string;
}
