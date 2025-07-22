export type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
  ForgotPassword: undefined;
  VerifyEmail: { email: string };
};

export type MainStackParamList = {
  // Main tabs
  Home: undefined;
  Emails: undefined;
  Chats: undefined;
  Todos: undefined;
  Profile: undefined;

  // Tool execution screens
  ToolExecution: { toolExecutionId: string };
  EmailCompose: { toolExecutionId?: string }; // Optional for new email drafts
};

export type OnboardingStackParamList = {
  ConnectInbox: undefined;
  FetchingUserInfo: undefined;
  OnboardingChat: undefined;
};

export type AppStackParamList = {
  Main: undefined;
  Profile: undefined;
  Settings: undefined;
  ContactSupport: undefined;
  Support: undefined;
  Scenarios: undefined;
  TodoDetail: { todoId: string };
  ToolExecution: {
    toolExecutionId: string;
    isReplyEdit?: boolean;
    isReply?: boolean;
    actionId?: string;
    userTaskId?: string;
    canBeDeleted?: boolean;
  };
  UserTaskDetail: {
    userTaskId: string;
    activeFilter?: string;
    selectedContextViewId?: string | null;
    searchQuery?: string;
  };
  EmailThreadDetail: { threadId: string };
};

export type MainTabParamList = {
  Chat: undefined;
  Emails: undefined;
  Todos: undefined;
  Profile: undefined;
};

export type RootStackParamList = {
  Auth: undefined;
  Onboarding: undefined;
  App: undefined;
  Loading: undefined;
};
