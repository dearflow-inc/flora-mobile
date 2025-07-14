export enum DearflowRole {
  USER = "user",
  ADMIN = "admin",
  VIRTUAL_ASSISTANT = "virtual_assistant",
}

export enum DearflowPaymentPlan {
  FREE = "free",
  EMAIL_ABILITIES_MONTHLY = "email_abilities_monthly",
  EMAIL_ABILITIES_YEARLY = "email_abilities_yearly",
}

export type AuthUserPlan = {
  plan: DearflowPaymentPlan;
  subscriptionId: string;
  cancelAtPeriodEnd: boolean;
  billingCycleAnchor: Date;
  cancelAt: Date;
  trialPeriod: number;
  cancelled: boolean;
  cancelledAt: Date;
};

export interface User {
  authUserId: string;
  email: string;
  emailVerified: boolean;
  paymentPlans: AuthUserPlan[];
  roles: DearflowRole[];
  usage?: {
    canRun: boolean;
    credits: number;
    usedCredits: number;
    storageUsed: number;
    storageAvailable: number;
  };
  timezone?: string;
  // Profile data will be fetched separately
  name?: string;
  avatar?: string;
}

export interface AuthState {
  user: User | null;
  authToken: string | null;
  refreshToken: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  isInitialized: boolean;
  error: string | null;
  emailUsage: AuthUserUsage | null;
  isFetchingUsage: boolean;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterCredentials {
  email: string;
  password: string;
  confirmPassword: string;
}

export interface AuthResponse {
  authUserId: string;
  email: string;
  emailVerified: boolean;
  paymentPlans: AuthUserPlan[];
  roles: DearflowRole[];
  authToken: string;
  refreshToken: string;
}

export interface RefreshAuthResponse {
  authUserId: string;
  email: string;
  emailVerified: boolean;
  paymentPlans: AuthUserPlan[];
  roles: DearflowRole[];
  authToken: string;
  refreshToken: string;
}

export interface VerifyEmailResponse {
  authUserId: string;
  email: string;
  emailVerified: boolean;
  paymentPlans: AuthUserPlan[];
  roles: DearflowRole[];
}

export interface PasswordResetResponse {
  success: boolean;
}

export interface UpdatePasswordResponse {
  success: boolean;
}

export interface sendVerificationCodeResponse {
  success: boolean;
}

export interface AuthUserUsage {
  authUserId: string;
  type: string;
  totalPassedThisMonth: number;
  totalPassedThisYear: number;
  totalDeclinedThisMonth: number;
  totalDeclinedThisYear: number;
  last: Date | null;
  cycleStarted: Date | null;
  createdAt: Date | null;
}
