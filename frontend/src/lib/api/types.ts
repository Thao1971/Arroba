/**
 * arroba.com API contract types.
 * Hand-written for E1.1; will be replaced by openapi-typescript output in E1.x
 * once we wire CI to regen from /api/openapi.json.
 */

export type Role =
  | 'anonymous'
  | 'subscriber'
  | 'corporate'
  | 'investor'
  | 'advisor'
  | 'admin';

export type OrgRole = 'owner' | 'admin' | 'operator';
export type MembershipStatus = 'pending' | 'active' | 'removed';
export type OrgStatus = 'active' | 'suspended' | 'archived';

export interface UserPublic {
  user_id: string;
  email: string;
  full_name: string | null;
  role: Role;
  email_verified: boolean;
  created_at: string;
  last_login: string | null;
}

export interface MembershipPublic {
  membership_id: string;
  user_id: string;
  org_id: string;
  role_in_org: OrgRole;
  status: MembershipStatus;
  created_at: string;
  accepted_at: string | null;
}

export interface MembershipWithOrgName extends MembershipPublic {
  legal_name?: string | null;
}

export interface OrgPublic {
  org_id: string;
  legal_name: string;
  tax_id: string | null;
  country: string;
  created_by: string;
  created_at: string;
  plan_type: string | null;
  status: OrgStatus;
}

export interface OrgWithMembership {
  org: OrgPublic;
  membership: MembershipPublic;
}

export interface AuthResponse {
  user: UserPublic;
  session_expires_at: string;
}

export interface MeResponse {
  user: UserPublic;
  memberships: MembershipPublic[];
}

export interface ApiErrorBody {
  detail: string;
  code: string;
  errors?: unknown;
}

export interface RegisterPayload {
  email: string;
  password: string;
  full_name?: string | null;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface SessionExchangePayload {
  session_id: string;
}

export interface CreateOrgPayload {
  legal_name: string;
  tax_id?: string | null;
  country?: string;
}

export interface CreateOrgResponse {
  org: OrgPublic;
  membership: MembershipPublic;
}

// ===================== Platform =====================

export type Lineage = 'raw' | 'normalized' | 'inferred' | 'ai_generated';

export interface PlatformStats {
  companies_analyzed: number;
  active_opportunities: number;
  market_movements: number;
  signals_detected: number;
  last_updated: string;
  confidence: number;
  lineage: Lineage;
  valid_until: string | null;
  /** legacy `source` (`mock | real`) — el canónico es `provenance`. */
  source?: string;
  /** Nomenclatura canónica: `demo` (dataset de demostración local) o
   *  `live` (proveedor real en producción). */
  provenance: 'demo' | 'live';
}
