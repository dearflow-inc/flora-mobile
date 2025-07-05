export enum SuggestedActionType {
  CONNECT_TOOL = "connect_tool",
  SUGGESTED_RESPONSE_BUTTON = "suggested_response_button",
  SUGGEST_BUY_PLAN = "suggest_buy_plan",
  DISPLAY = "display",
}

export interface ChatMessageSuggestedAction {
  id: string;
  type: SuggestedActionType;
  entityId: string;
  complete?: boolean;
  meta?: {
    title?: string;
    description?: string;
    [key: string]: any;
  };
}
