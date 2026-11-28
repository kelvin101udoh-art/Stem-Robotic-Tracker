// packages/stemtrack-sdk/src/types/evidence.ts

import type { TrackBranch } from './index';

export type SubscriptionTier =
  | 'STARTER'
  | 'GROWTH'
  | 'PRO_UNLIMITED'
  | 'MAT_CUSTOM';

export type EvidenceSeverity =
  | 'INFO'
  | 'LOW'
  | 'MEDIUM'
  | 'HIGH'
  | 'SAFEGUARDING';

export type ReviewStatus = 'PENDING_REVIEW' | 'CONFIRMED' | 'REJECTED';

export type FollowupStatus = 'NONE' | 'OPEN' | 'IN_PROGRESS' | 'RESOLVED';

export type EvidenceType =
  | 'voice_debrief'
  | 'live_video_debrief'
  | 'text_note';

/** Enforced on apps/mobile to bound token cost and upload size */
export const CAPTURE_LIMITS = {
  VOICE_MAX_SECONDS: 90,
  VIDEO_MAX_SECONDS: 60,
} as const;

export const PLAN_MONTHLY_QUOTAS: Record<SubscriptionTier, number> = {
  STARTER: 600,
  GROWTH: 2000,
  PRO_UNLIMITED: 5000,
  MAT_CUSTOM: 15000,
};

// --- Branch-Specific AI Insight Shapes ---

export interface RoboticsInsight {
  competencyArea?:
    | 'Hardware'
    | 'Coding'
    | 'Debugging'
    | 'Teamwork'
    | 'Creativity'
    | 'Leadership';
  independenceLevel?: 'Guided' | 'Peer-Supported' | 'Independent';
  resilienceNote?: string;
  parentFriendlyHighlight?: string;
}

export interface SendInsight {
  regulationZone?: 'Blue' | 'Green' | 'Yellow' | 'Red' | 'Unknown';
  antecedent?: string | null;
  behaviour?: string;
  consequenceOrDeescalation?: string | null;
  ehcpOutcomeAlignment?: string;
}

export interface EarlyYearsInsight {
  eyfsArea?: string;
  playContext?: string;
  wellbeingStatus?:
    | 'Settled & Happy'
    | 'Engaged'
    | 'Needed Reassurance'
    | 'Unsettled';
  suggestedNextStep?: string;
  parentFriendlyHighlight?: string;
}

export type StructuredInsight =
  | RoboticsInsight
  | SendInsight
  | EarlyYearsInsight
  | Record<string, unknown>;

// --- API Contracts: submit-evidence ---

export interface EvidenceDraftItem {
  id: string;
  branch: TrackBranch;
  summary: string;
  attributedStudentIds: string[];
  linkedGoalIds: string[];
  structuredInsight: StructuredInsight;
  severity: EvidenceSeverity;
  followupStatus: FollowupStatus;
  reviewStatus: ReviewStatus;
  clientTimestamp: string;
}

export interface QuotaStatus {
  used: number;
  limit: number;
  fallbackReason:
    | 'monthly_quota_reached'
    | 'pro_fair_use_gemini_only'
    | 'missing_gemini_key'
    | null;
}

export interface SubmitEvidenceResponse {
  success: boolean;
  evidenceId: string | null;
  reviewStatus: ReviewStatus;
  splitCount: number;
  quotaStatus: QuotaStatus;
  items: EvidenceDraftItem[];
}

// --- API Contracts: confirm-evidence ---

export interface ConfirmEvidenceRequest {
  evidenceId: string;
  status: 'CONFIRMED' | 'REJECTED';
  editedSummary?: string;
  attributedStudentIds?: string[];
  linkedGoalIds?: string[];
  structuredInsight?: StructuredInsight;
  parentVisible?: boolean;
  followupNotes?: string;
}

export interface ConfirmEvidenceResponse {
  success: boolean;
  evidence: {
    id: string;
    review_status: ReviewStatus;
    parent_visible: boolean;
    reviewed_at: string;
  };
}