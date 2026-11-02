import type { MilestoneStatus } from "./config";

export type EntityType = "bloc" | "alliance" | "party" | "politician";
export type Bloc = "government" | "opposition" | "independent";
export type Role = "rakyat" | "politician" | "admin";
export type RequestStatus = "awaiting_payment" | "pending_review" | "approved" | "rejected";

export interface Entity {
  id: string;
  type: EntityType;
  slug: string;
  name: string;
  short_name: string | null;
  bloc: Bloc;
  parent_id: string | null;
  position: string | null;
  constituency: string | null;
  state: string | null;
  description: string | null;
  website: string | null;
  owner_id: string | null;
  upvotes: number;
  is_sample: boolean;
  created_at: string;
  updated_at: string;
}

export type EntityRef = Pick<Entity, "id" | "slug" | "name" | "short_name" | "type" | "bloc">;

export interface Milestone {
  id: string;
  entity_id: string;
  title: string;
  description: string | null;
  category: string;
  status: MilestoneStatus;
  progress: number;
  target_date: string | null;
  evidence_url: string | null;
  source_type: "editorial" | "self_reported";
  is_sample: boolean;
  upvotes: number;
  created_at: string;
  updated_at: string;
  entity?: EntityRef | null;
}

export interface Profile {
  id: string;
  display_name: string | null;
  role: Role;
  subscription_status: string;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  politician_entity_id: string | null;
  created_at: string;
}

export interface PoliticianRequest {
  id: string;
  user_id: string;
  full_name: string;
  party_id: string | null;
  position: string | null;
  constituency: string | null;
  bio: string | null;
  claim_entity_id: string | null;
  status: RequestStatus;
  admin_note: string | null;
  created_at: string;
  updated_at: string;
}

export const MILESTONE_SELECT =
  "id, entity_id, title, description, category, status, progress, target_date, evidence_url, source_type, is_sample, upvotes, created_at, updated_at, entity:entities(id, slug, name, short_name, type, bloc)";
