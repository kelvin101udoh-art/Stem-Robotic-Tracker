// packages/stemtrack-sdk/src/types/index.ts

export type TrackBranch = 'ROBOTICS_CLUB' | 'SEND_PROVISION' | 'EARLY_YEARS';

export interface BranchConfig {
  branch: TrackBranch;
  displayName: string;
  sessionTerm: string;
  learnerTerm: string;
  allowDraftQueue: boolean;
  defaultFramework: string;
  accentColor: string;
}

export const BRANCH_CONFIGS: Record<TrackBranch, BranchConfig> = {
  ROBOTICS_CLUB: {
    branch: 'ROBOTICS_CLUB',
    displayName: 'STEM & Robotics Club',
    sessionTerm: 'Build Session',
    learnerTerm: 'Student',
    allowDraftQueue: false,
    defaultFramework: 'UK Computing & Engineering Milestones',
    accentColor: '#3b82f6',
  },
  SEND_PROVISION: {
    branch: 'SEND_PROVISION',
    displayName: 'SEND & Alternative Provision',
    sessionTerm: 'Targeted Intervention',
    learnerTerm: 'Learner',
    allowDraftQueue: true,
    defaultFramework: 'EHCP Statutory & Zones of Regulation',
    accentColor: '#8b5cf6',
  },
  EARLY_YEARS: {
    branch: 'EARLY_YEARS',
    displayName: 'Early Years Foundation Stage',
    sessionTerm: 'Continuous Provision',
    learnerTerm: 'Child',
    allowDraftQueue: true,
    defaultFramework: 'EYFS Development Matters',
    accentColor: '#10b981',
  },
};

export interface RosterMemberDTO {
  id: string;
  firstName: string;
  lastName: string;
  avatarUrl?: string;
  externalIdentifier?: string;
}

export interface SessionContextDTO {
  sessionId: string;
  organizationId: string;
  organizationName: string;
  branch: TrackBranch;
  sessionName: string;
  instructorId: string;
  instructorName: string;
  activeRoster: RosterMemberDTO[];
}

export interface BaseEvidenceMetadata {
  captureMode: 'LIVE_VOICE' | 'RETROSPECTIVE_DRAFT';
  clientTimestamp: string;
}

export interface RoboticsEvidenceMetadata extends BaseEvidenceMetadata {
  branch: 'ROBOTICS_CLUB';
  engineeringConcept?: string;
  debuggingIterations?: number;
  hardwareKitId?: string;
}

export interface SENDEvidenceMetadata extends BaseEvidenceMetadata {
  branch: 'SEND_PROVISION';
  regulationZone?: 'BLUE' | 'GREEN' | 'YELLOW' | 'RED';
  triggerObserved?: string;
  coRegulationStrategy?: string;
  ehcpTargetReference?: string;
}

export interface EYFSEvidenceMetadata extends BaseEvidenceMetadata {
  branch: 'EARLY_YEARS';
  provisionArea?: 'CONSTRUCTION' | 'WATER' | 'OUTDOOR' | 'PHONICS' | 'CREATIVE' | 'ROLEPLAY';
  isChildInitiated?: boolean;
  developmentMattersArea?: string;
}

export type EvidenceMetadata =
  | RoboticsEvidenceMetadata
  | SENDEvidenceMetadata
  | EYFSEvidenceMetadata;

export interface IngestEvidenceRequestDTO {
  sessionId: string;
  organizationId: string;
  branch: TrackBranch;
  taggedStudentIds: string[];
  transcriptionAudioBase64?: string;
  mediaFileUrl?: string;
  manualNote?: string;
  metadata: EvidenceMetadata;
}

export interface IngestEvidenceResponseDTO {
  success: boolean;
  evidenceId: string;
  structuredInsight: {
    summary: string;
    curriculumTags: string[];
    behaviorOrRegulationNote?: string;
  };
}