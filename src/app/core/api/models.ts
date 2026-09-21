// Wire types for the blitzpool-server-rust HTTP API (bp-api).
// Field names match the serde camelCase output exactly.

export type RangeParam = '1d' | '3d' | '7d' | '14d' | '1m';
export type ChartMode = 'solo' | 'pplns' | 'group-solo' | 'blockparty';

export interface ChartPoint {
  label: string; // ISO-8601 slot-end timestamp
  data: number;
}

export interface SlotCounts {
  time: string;
  counts: Record<string, number>;
}

export interface SlotDataResponse {
  slotData: SlotCounts[];
}

// ── /api/info* ─────────────────────────────────────────────────────

export interface FoundBlock {
  height: number;
  minerAddress: string;
  worker: string;
  sessionId: string;
}

export interface UserAgentEntry {
  userAgent: string | null;
  count: number;
  bestDifficulty: number | null;
  totalHashRate: number | null;
}

export interface HighScoreEntry {
  updatedAt: string | null;
  bestDifficulty: number;
  bestDifficultyUserAgent: string | null;
}

export interface InfoResponse {
  blockData: FoundBlock[];
  userAgents: UserAgentEntry[];
  highScores: HighScoreEntry[];
  uptime: string;
}

export interface PoolResponse {
  totalHashRate: number;
  blockHeight: number | null;
  totalMiners: number;
  blocksFound: FoundBlock[];
  fee: number;
}

export interface VersionResponse {
  version: string;
}

export interface PeerEntry {
  version: string;
  direction: 'inbound' | 'outbound' | string;
  location: string | null;
  bytesrecv: number;
  bytessent: number;
  network: string | null;
  pingtime: number | null;
}

export interface DifficultyResponse {
  current: number;
  previous: number | null;
  updatedAt: string;
}

export interface NextBlockReward {
  rewardSats: number;
  subsidySats: number;
  feeSats: number;
  height: number;
}

export interface PayoutInfoEntry {
  address: string;
  percent: number;
  sats: number;
}

export interface ClientBlockTemplateResponse {
  blockTemplate: Record<string, unknown>;
  mode: 'solo' | 'pplns' | 'group-solo' | 'blockparty' | string;
  payoutInformation: PayoutInfoEntry[];
  groupId?: string;
  blockHex: string;
  coinbaseTxHex: string;
}

export interface SharesResponse {
  accepted1d: number;
  rejected1d: number;
  accepted14d: number;
  rejected14d: number;
  accepted30d: number;
  rejected30d: number;
  acceptedSinceBlock: number;
  rejectedSinceBlock: number;
}

export interface HealthResponse {
  status: 'healthy' | 'degraded' | string;
  version: string;
  uptime: number;
  uptimeReadable: string;
  checks: {
    database: string;
    bitcoin?: string;
    cache?: string;
    tdp?: string;
  };
  timestamp: string;
}

// Raw passthroughs (bitcoin RPC). Loose on purpose.
export type CoreInfoResponse = Record<string, unknown>;
export type NetworkInfoResponse = {
  difficulty?: number;
  networkhashps?: number;
  blocks?: number;
  [key: string]: unknown;
};

// ── /api/client* ───────────────────────────────────────────────────

export interface WorkerEntry {
  sessionId: string;
  name: string;
  bestDifficulty: string;
  hashRate: number;
  currentDifficulty: number | null;
  channelCount: number;
  startTime: string;
  lastSeen: string;
  extranonce: string | null;
}

export interface ClientResponse {
  bestDifficulty: number | null;
  workersCount: number;
  totalShares: number;
  totalHashrate: number;
  workers: WorkerEntry[];
}

export interface WorkerShareEntry {
  workerName: string;
  totalShares: number;
  totalRejected: number;
}

export interface RejectCounts {
  count: number;
  diffMinusOne: number;
}

export interface RejectedSlot {
  time: string;
  counts: Record<string, RejectCounts>;
}

export interface RejectedResponse {
  slotData: RejectedSlot[];
}

export interface DiffScoreSlot {
  time: string;
  difficulty: number;
}

export interface DiffScoresResponse {
  slotData: DiffScoreSlot[];
}

export interface WorkerChartEntry {
  label: string;
  data: number;
  accepted: number;
  rejectedJobNotFound: number;
  rejectedJobNotFoundDiff1: number;
  rejectedDuplicatedShare: number;
  rejectedDuplicatedShareDiff1: number;
  rejectedLowDifficultyShare: number;
  rejectedLowDifficultyShareDiff1: number;
  rejectedVersionRolling: number;
  rejectedVersionRollingDiff1: number;
  rejectedStale: number;
  rejectedStaleDiff1: number;
}

export interface WorkerResponse {
  name: string;
  bestDifficulty: number;
  chartData: WorkerChartEntry[];
}

export interface SessionResponse {
  sessionId: string;
  name: string;
  bestDifficulty: number;
  chartData: ChartPoint[];
  startTime: string;
}

export interface StatusResponse {
  status: string;
  address?: string;
}

// ── /api/pplns* ────────────────────────────────────────────────────

export interface PplnsUserAgent {
  userAgent: string | null;
  count: string; // string-as-number on the wire
  bestDifficulty: number | null;
  totalHashRate: number | null;
}

export interface PplnsStatus {
  enabled: boolean;
  totalShares: number;
  windowSize: number;
  minerCount: number;
}

export interface PplnsRoot extends PplnsStatus {
  userAgents: PplnsUserAgent[];
}

export interface PplnsModeResponse {
  mode: 'solo' | 'pplns' | 'group-solo' | 'blockparty' | string;
  groupId?: string;
}

export interface PplnsFees {
  feePercent: number;
  feeAddress: string | null;
  coinbaseWeightBudget: number;
  groupFeePercent: number;
  groupFeeAddress: string | null;
  dustLimitSats: number;
  minPayoutSats: number;
  coinbaseBaseWeight: number;
  coinbaseOutputWeight: number;
  coinbaseWitnessCommitmentWeight: number;
  maxMinerOutputs: number;
  maxMinerOutputsAdaptive: number;
  minDifficulty: number;
  warmupShares: number;
}

export interface PplnsDistributionEntry {
  address: string;
  totalShares: number;
  percent: number;
}

export interface PplnsLedger {
  totalCreditSats: number;
  totalDebitSats: number;
  netDriftSats: number;
  creditHolderCount: number;
  debitHolderCount: number;
  abandonedCreditSats: number;
  abandonedDebitSats: number;
  lifetimePaidSats: number;
  abandonedDays: number;
}

export interface PplnsAddressSummary {
  balanceSats: number;
  totalPaidSats: number;
  currentWindowShares: number;
  currentWindowPercent: number;
  balanceLabel: 'credit' | 'debit' | 'zero' | string;
}

export interface PplnsHistoryEntry {
  id: number;
  blockHeight: number;
  address: string;
  paidSats: number;
  percent: number;
  rowType: string;
  createdAt: string;
}

// ── /api/pplns/groups* ─────────────────────────────────────────────

export interface GroupSummary {
  id: string;
  name: string;
  creatorAddress?: string;
  active: boolean;
  createdAt: string;
  roundResetPreset: string | null;
  roundResetIntervalDays: number | null;
  roundResetTimezone: string | null;
  finderBonusPpm: number;
  lastRoundResetAt: string | null;
  nextResetAt: string | null;
  isPublic: boolean;
  resetRoundOnBlock: boolean;
  maxMembers: number | null;
  mode: string; // 'prop' | 'window'
}

export interface CreateGroupResponse extends GroupSummary {
  adminToken: string;
  members: { address: string; role: string }[];
}

export interface TransferResponse extends GroupSummary {
  adminToken: string;
}

export interface PublicGroupEntry extends GroupSummary {
  memberCount: number;
  totalHashrate: number;
}

export interface PublicGroupListResponse {
  page: number;
  pageSize: number;
  total: number;
  items: PublicGroupEntry[];
}

export interface RecentBlock {
  id: number;
  groupId: string;
  blockHeight: number;
  createdAt: string;
  addressLabel: string;
  paidSats: number;
  percent: number;
  sharesInRound: number;
  totalSharesInRound: number;
  rowType: string;
}

export interface PublicGroupDetail extends GroupSummary {
  memberCount: number;
  totalHashrate: number;
  recentBlocks: RecentBlock[];
}

export interface MemberEntry {
  memberId: string;
  addressLabel: string;
  address?: string; // admin-token callers only
  isSelf: boolean;
  role: string;
  joinedAt: string;
  hashrate: number;
  bestDifficulty: number;
  startTime?: string;
  lastSeen?: string;
  lastAcceptedShareAt: string | null;
  email?: string;
  verifiedVia?: 'email' | 'signature';
}

export interface GroupDetailResponse extends GroupSummary {
  totalHashrate: number;
  members: MemberEntry[];
}

export interface GroupHashrateResponse {
  groupId: string;
  totalHashrate: number;
  members: { memberId: string; addressLabel: string; hashrate: number }[];
}

export interface GroupDistributionResponse {
  totalShares: number;
  totalRejected: number;
  perAddress: {
    memberId: string;
    addressLabel: string;
    totalShares: number;
    percent: number;
    totalRejected: number;
  }[];
}

export interface WindowTimelineResponse {
  windowDays: number;
  contributors: { memberId: string; addressLabel: string }[];
  days: { date: string; values: number[] }[];
}

export interface BestDifficultyResponse {
  bestDifficulty: number;
  addressLabel: string | null;
  time: string | null;
}

export interface GroupHistoryEntry {
  id: number;
  groupId: string;
  blockHeight: number;
  createdAt: string;
  addressLabel: string;
  paidSats: number;
  percent: number;
  sharesInRound: number;
  totalSharesInRound: number;
  rowType: string;
}

export interface CoinbaseCapacity {
  maxMembers: number;
  weightBudget: number;
  hasFeeOutput: boolean;
}

export interface OpenInvite {
  token: string;
  expiresAt: string;
  approvalRequired: boolean;
  link: string;
}

export interface OpenInviteStatus {
  active: boolean;
  token: string | null;
  expiresAt: string | null;
  createdAt: string | null;
  approvalRequired: boolean | null;
  link: string | null;
}

export interface JoinRequestEntry {
  id: string;
  address: string;
  email: string;
  message: string | null;
  status: string;
  createdAt: string;
  decidedAt: string | null;
}

export interface AddressJoinRequest {
  groupId: string;
  groupName: string;
  status: string;
  createdAt: string;
}

export interface CreateJoinRequestResponse {
  id: string;
  groupId: string;
  status: string;
  createdAt: string;
}

export interface UpdateGroupSettingsBody {
  preset?: string | null;
  intervalDays?: number | null;
  timezone?: string | null;
  finderBonusPpm?: number | null;
  isPublic?: boolean;
  resetRoundOnBlock?: boolean;
  maxMembers?: number | null;
}

// ── /api/pplns/invitations* ────────────────────────────────────────

export interface OpenInviteDetails {
  token: string;
  groupId: string;
  groupName: string;
  expiresAt: string;
  approvalRequired: boolean;
}

export interface InviteAcceptResponse {
  address: string;
  role: string;
  joinedAt: string;
  groupId: string;
}

// ── /api/blockparty* ───────────────────────────────────────────────

export interface BlockpartyGroup {
  id: string;
  name: string;
  adminAddress: string;
  status: string;
  lastShareAt: number | null;
  createdAt: number;
  dissolvedAt: number | null;
  rentalProviderHint: string | null;
  confirmationRequestedAt: number | null;
}

export interface BlockpartyMember {
  address: string;
  email: string;
  percentBp: number;
  role: string;
  confirmed: boolean;
  verifiedVia?: 'email' | 'signature';
}

export interface BlockpartyDetail extends BlockpartyGroup {
  members: BlockpartyMember[];
}

export interface BlockpartyByAddress {
  groupId: string | null;
  groupName?: string;
  status?: string;
  role?: string;
}

export interface BlockpartyHistoryRow {
  blockHeight: number;
  blockHash: string;
  foundAt: number;
  coinbaseValueSats: number;
  poolFeeSats: number;
  splits: { address: string; percentBp: number; sats?: number }[];
}

export interface BlockpartyCreateResponse {
  group: BlockpartyGroup;
  adminToken: string;
  poolFeePercent: number;
}

export interface BlockpartyJoinContext {
  groupId: string;
  groupName: string;
  expiresAt: number;
}

export interface BlockpartyJoinResponse {
  memberToken: string;
  groupId: string;
}

export interface BlockpartyJoinLinkStatus {
  active: boolean;
  token: string | null;
  expiresAt: number | null;
}

// ── /api/address/* (ownership + extranonce) ────────────────────────

export interface ChallengeResponse {
  message: string;
  expiresAt: number;
}

export interface OwnershipVerifyResponse {
  address: string;
  method: string;
  scriptType: string;
  verifiedAt: number;
}

export interface OwnershipByAddress {
  verified: boolean;
  method: string | null;
  scriptType: string | null;
  verifiedAt: number | null;
}

export interface VerifiedStatus {
  verified: boolean;
  emailVerified: boolean;
  signatureVerified: boolean;
}

export interface ExtranonceTokenResponse {
  address: string;
  token: string;
  createdAt: number;
}

export interface ExtranonceSetResponse {
  address: string;
  updated: { worker: string; extranonce: string }[];
  updatedAt: number;
}

// ── /api/email* ────────────────────────────────────────────────────

export interface EmailRegisterResponse {
  ok: boolean;
  verificationSent: boolean;
}

export interface EmailVerifyResponse {
  address: string;
  email: string;
  verifiedAt: string;
}

export interface EmailByAddress {
  email: string | null;
  verifiedAt: string | null;
}

// ── /api/push* ─────────────────────────────────────────────────────

export interface PushSubscription {
  id: number;
  platform: string;
  endpoint: string;
  subscriptionType: string;
  createdAt: string;
  lastNotificationAt: string | null;
  bestDiffNotificationsEnabled: boolean;
  deviceNotificationsEnabled: boolean;
  blockNotificationsEnabled: boolean;
}

export interface PushStatus {
  address: string;
  subscriptionCount: number;
  subscriptions: PushSubscription[];
  tracker: { bestDifficulty: number; lastCheckedAt: string } | null;
}

export interface FcmRegisterResponse {
  success: boolean;
  subscriptionType: string;
  subscription: PushSubscription;
}

// ── /api/share* ────────────────────────────────────────────────────

export interface TopDifficultyEntry {
  userAgent: string | null;
  time: number;
  externalPoolName: string | null;
  difficulty: number;
}

export interface ExternalShareBody {
  worker: string;
  address: string;
  userAgent: string;
  externalPoolName: string;
  header: string;
}

export interface ExternalShareResponse {
  success: boolean;
  calculatedDifficulty: number;
}

// ── /api/downstream-report ─────────────────────────────────────────

export interface DownstreamMiner {
  vendor: string;
  hardwareVersion?: string;
  firmware?: string;
  deviceId?: string;
  nominalHashRate?: number;
  userIdentity?: string;
  connectedAt?: string;
}

export interface DownstreamReport {
  schemaVersion: number;
  jdcUserIdentity: string;
  miners: DownstreamMiner[];
}
