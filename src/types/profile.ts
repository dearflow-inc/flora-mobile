// Profile Types
export interface Profile {
  id: string;
  authUserId: string;
  plans: Array<DearflowPaymentPlan>;
  avatar?: string;
  name?: string;
  email?: string;
  phone?: string;
  whatsApp?: string;
  jobRole?: string;
  department?: string;
  industry?: string;
  company?: string;
  source?: string;
  companySize?: string;
  country?: Country;
  description?: string;
  occupation?: string;
  interests?: Array<string>;
  location?: string;
  communicationStyle?: string;
  currentMainTargets: Array<MainTarget>;
  emailPreferences?: Array<ProfileEmailPreference>;
  onboarding?: number;
  memory?: Array<ProfileMemoryItem>;
  introducedBy?: Author;
  mainTimeZone?: string;
  accountReferralCode?: string;
  usageFor?: Array<string>;
  workType?: string;
  documentTypes: Array<ProfileDocumentType>;
  sharing?: Array<ProfileSharing>;
  promptRules?: Array<ProfilePromptRules>;
  sortFocus: "newest" | "ai";
  preferredView: "email" | "context";
  assistantId?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface MainTarget {
  id: string;
  text: string;
}

export interface ProfileEmailPreference {
  emailType: ProfileEmailPreferenceType;
  active: boolean;
}

export interface ProfileMemoryItem {
  id: string;
  memory?: string;
  category?: ProfileMemoryItemCategory;
  createdAt: Date;
}

export interface ProfileDocumentType {
  id: string;
  name: string;
  description: string;
}

export interface ProfileSharing {
  id: string;
  type: ProfileSharingType;
  key: string;
  url: string;
  active: boolean;
  createdAt: Date;
}

export interface ProfilePromptRules {
  id: string;
  rule: string;
  deleted: boolean;
}

export interface Author {
  type: string;
  externalId: string;
  meta?: {
    name?: string;
    email?: string;
    avatar?: string;
  };
}

export interface FeedItem {
  id: string;
  title: string;
  description?: string;
  type: string;
  data?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

export interface CronJobManager {
  id: string;
  name: string;
  schedule: string;
  active: boolean;
  lastRun?: Date;
  nextRun?: Date;
}

// Enums
export enum DearflowPaymentPlan {
  FREE = "free",
  BASIC = "basic",
  PREMIUM = "premium",
  ENTERPRISE = "enterprise",
}

export enum Country {
  UnitedStates = "US",
  Canada = "CA",
  UnitedKingdom = "GB",
  Germany = "DE",
  France = "FR",
  Spain = "ES",
  Italy = "IT",
  Netherlands = "NL",
  Australia = "AU",
  Japan = "JP",
  // Add more countries as needed
}

export enum ProfileSharingType {
  AVATAR = "avatar",
  BANNER = "banner",
  LOGO = "logo",
  BACKGROUND = "background",
}

export enum ProfileEmailPreferenceType {
  NEWSLETTER = "newsletter",
  WEEKLY = "weekly",
  TECHNICAL_REQUIREMENTS = "technical_requirements",
}

export enum ProfileMemoryItemCategory {
  PERSONAL_LIFE = "personal_life",
  WORK = "work",
  PREFERENCES = "preferences",
  GENERAL = "general",
  REQUESTS = "requests",
}

// Request Types
export interface UpdateMyProfileRequest {
  name?: string;
  phone?: string;
  whatsApp?: string;
  description?: string;
  emailPreferences?: Array<ProfileEmailPreference>;
  onboarding?: number;
  jobRole?: string;
  department?: string;
  industry?: string;
  companySize?: string;
  country?: Country;
  workType?: string;
  usageFor?: Array<string>;
  timeZone?: string;
  promptRules?: Array<ProfilePromptRules>;
  sortFocus?: "newest" | "ai";
  source?: string;
  preferredView?: "email" | "context";
  documentTypes?: Array<ProfileDocumentType>;
}

export interface AddDocumentTypesRequest {
  documentTypes: Array<{
    id: string;
    name: string;
    description?: string;
  }>;
}

export interface ProfileSharingUploadRequest {
  sharingType: ProfileSharingType;
}

// Response Types
export interface FetchMyProfileResponse {
  profile: Profile;
}

export interface UpdateMyProfileResponse {
  profile: Profile;
}

export interface FetchMyDashboardResponse {
  profile: Profile;
  feedItems: Array<FeedItem>;
  cronJobManagers: Array<CronJobManager>;
}

export interface ProfileSharingResponse {
  owner: boolean;
  profileSharing: ProfileSharing;
  imageDownloadUrl: string;
}

export interface AdminProfilesResponse {
  profiles: Profile[];
  total: number;
}

export interface FetchEmailsOnboardingResponse {
  chatId: string;
}

// Feedback Types
export enum FeedbackPurpose {
  GENERAL_HELP = "general_help",
  ASK_FEATURE = "ask_feature",
  REPORT_BUG_ERROR = "report_bug_error",
}

export interface CreateFeedbackRequest {
  authUserId: string;
  email: string;
  name: string;
  feedback: string;
  purpose: FeedbackPurpose;
}

export interface Feedback {
  authUserId: string;
  email: string;
  name: string;
  feedback: string;
  purpose: FeedbackPurpose;
}

export interface CreateFeedbackResponse {
  feedback: Feedback;
}
