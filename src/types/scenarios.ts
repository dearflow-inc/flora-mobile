import { UserTaskType } from "./userTask";

export interface Author {
  type: AuthorType;
  externalId: string;
}

export enum AuthorType {
  PROFILE = "PROFILE",
}

export interface ContextViewContent {
  type:
    | "img"
    | "title"
    | "text"
    | "title_width_task_indicator"
    | "task_preview"
    | "current_date"
    | "space"
    | "email_sub_category_chips";
  value?: string;
}

export interface ContextView {
  id: string;
  name: string;
  description: string;
  importance: number;
  height: number;
  width: number;
  isDefault: boolean;
  color: string;
  background: string;
  contentPosition?: string;
  content: ContextViewContent[];
}

export interface TaskTypeWithComments {
  type: UserTaskType;
  instructions?: string;
}

export interface ScenarioItem {
  id: string;
  systemReferenceType: string;
  name: string;
  classificationPrompt: string;
  targetContextViewId: string;
  targetImportance: number;
  targetTaskTypes?: TaskTypeWithComments[];
  targetTags?: string[];
  notifyOnWhatsapp?: boolean;
}

export interface ScenarioTagColor {
  backgroundColor: string;
  textColor: string;
}

export interface ScenarioTag {
  internalId: string;
  name: string;
  description: string;
  color: ScenarioTagColor;
  show: boolean;
}

export interface ContactTypes {
  id: string;
  name: string;
  prompt: string;
}

export interface ForcedUserTaskRules {
  id: string;
  userTaskType: UserTaskType;
  targetContextViewId: string;
}

export interface Scenarios {
  id: string;
  dfOwner: Author;
  contextViews: ContextView[];
  scenarioItems: ScenarioItem[];
  tags: ScenarioTag[];
  createdAt: string;
  updatedAt: string;
}

// API Response types
export interface FetchScenariosResponse {
  scenarios: Scenarios;
}

// API Request types
export interface CreateContextViewRequest {
  name: string;
  importance: number;
  description: string;
  textColor: string;
  backgroundColor: string;
}

export interface UpdateContextViewRequest {
  name?: string;
  importance?: number;
  description?: string;
  textColor?: string;
  backgroundColor?: string;
}

export interface CreateScenarioItemRequest {
  create: {
    systemReferenceType: string;
    name: string;
    classificationPrompt: string;
  };
  targetContextViewId: string;
  targetImportance: number;
  targetTaskTypes: TaskTypeWithComments[];
  targetTags: string[];
  notifyOnWhatsapp?: boolean;
}

export interface CreateScenarioTagRequest {
  tag: {
    internalId: string;
    name: string;
    description: string;
    color: ScenarioTagColor;
    show?: boolean;
  };
}
