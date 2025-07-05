import {
  ChatMessageSuggestedAction,
  SuggestedActionType,
} from "@/types/suggestedAction";

export const mockSuggestedActions: ChatMessageSuggestedAction[] = [
  {
    id: "1",
    type: SuggestedActionType.SUGGESTED_RESPONSE_BUTTON,
    entityId: "Yes, that sounds great!",
    complete: false,
  },
  {
    id: "2",
    type: SuggestedActionType.SUGGESTED_RESPONSE_BUTTON,
    entityId: "I need more details",
    complete: false,
  },
  {
    id: "3",
    type: SuggestedActionType.SUGGESTED_RESPONSE_BUTTON,
    entityId: "Let me think about it",
    complete: false,
  },
  {
    id: "4",
    type: SuggestedActionType.CONNECT_TOOL,
    entityId: "gmail",
    complete: false,
    meta: {
      title: "Connect Gmail",
      description: "Connect your Gmail account to get started",
    },
  },
  {
    id: "5",
    type: SuggestedActionType.CONNECT_TOOL,
    entityId: "google-calendar",
    complete: false,
    meta: {
      title: "Connect Google Calendar",
      description: "Connect your Google Calendar to manage events",
    },
  },
  {
    id: "6",
    type: SuggestedActionType.SUGGEST_BUY_PLAN,
    entityId: "premium_monthly",
    complete: false,
    meta: {
      title: "Upgrade to Premium",
      description: "Get access to advanced features",
    },
  },
  {
    id: "7",
    type: SuggestedActionType.DISPLAY,
    entityId: "spaces-overview",
    complete: false,
    meta: {
      title: "Spaces Overview",
      description: "View all your spaces",
    },
  },
];

// Helper function to get random suggested actions
export const getRandomSuggestedActions = (
  count: number = 2
): ChatMessageSuggestedAction[] => {
  const shuffled = [...mockSuggestedActions].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
};

// Helper function to get response button suggestions
export const getResponseSuggestions = (): ChatMessageSuggestedAction[] => {
  return mockSuggestedActions.filter(
    (action) => action.type === SuggestedActionType.SUGGESTED_RESPONSE_BUTTON
  );
};

// Helper function to get connect tool suggestions
export const getConnectToolSuggestions = (): ChatMessageSuggestedAction[] => {
  return mockSuggestedActions.filter(
    (action) => action.type === SuggestedActionType.CONNECT_TOOL
  );
};
