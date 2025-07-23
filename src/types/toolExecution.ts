import { Author } from "./email";

// Enums
export enum ToolProvider {
  DEARFLOW_PROFILE = "dearflow_profile",
  GOOGLE = "google",
  STRIPE = "stripe",
  DEARFLOW = "dearflow",
  FIREFLIES = "fireflies",
}

export enum ToolEndpointAction {
  GMAIL_SEND = "gmail_send",
}

export enum ToolExecutionType {
  MANUAL = "MANUAL",
  AUTOMATIC = "AUTOMATIC",
}

export enum ParameterType {
  STRING = "string",
  NUMBER = "number",
  BOOLEAN = "boolean",
  ARRAY = "array",
  OBJECT = "object",
  DATE = "date",
}

// Parameter Value
export interface ParameterValue {
  parameterId: string;
  type: ParameterType;
  value?: string;
}

// System Reference (for internal listeners)
export interface SystemReference {
  id: string;
  type: string;
  externalId?: string;
  emailId?: string;
  meta?: {
    name?: string;
    email?: string;
    title?: string;
    description?: string;
    type?: string;
    [key: string]: any;
  };
}

// Tool Execution
export interface ToolExecution {
  id: string;
  dfOwner: Author;
  toolProvider: ToolProvider;
  toolEndpointAction: ToolEndpointAction;
  input: ParameterValue[];
  successful?: boolean;
  executedAt?: Date;
  output: ParameterValue[];
  internalListeners: SystemReference[];
  createdAt: Date;
  updatedAt: Date;
  cronjobManagerId?: string;
  cronjobId?: string;
  type: ToolExecutionType;
}

// Email Draft Data (parsed from tool execution parameters)
export interface EmailDraftData {
  to: { id: string; email: string }[];
  cc: { id: string; email: string }[];
  bcc: { id: string; email: string }[];
  subject: string;
  body: string;
  attachments: string[];
  followUpSettings?: {
    followUpRequired: boolean;
    followUpAt?: Date;
    followUpIn?: number;
  };
}

// Request Types
export interface CreateToolExecutionRequest {
  toolEndpointAction: ToolEndpointAction;
  input: ParameterValue[];
  internalListeners: SystemReference[];
}

export interface UpdateToolExecutionRequest {
  input: ParameterValue[];
}

export interface ExecuteToolExecutionRequest {
  input: ParameterValue[];
}

export interface ScheduleToolExecutionRequest {
  schedule: string; // cron expression
  timeZone: string;
  input: ParameterValue[];
}

// Response Types
export interface ToolExecutionResponse {
  toolExecution: ToolExecution;
}

export interface ToolExecutionsResponse {
  toolExecutions: ToolExecution[];
}

// Helper function to parse email draft data from tool execution
export const parseEmailDraftFromToolExecution = (
  toolExecution: ToolExecution
): EmailDraftData => {
  const getParameterValue = (parameterId: string): string => {
    return (
      toolExecution.input.find((param) => param.parameterId === parameterId)
        ?.value || ""
    );
  };

  const parseArrayParameter = (parameterId: string): any[] => {
    try {
      const value = getParameterValue(parameterId);
      return value ? JSON.parse(value) : [];
    } catch {
      return [];
    }
  };

  const parseObjectParameter = (parameterId: string): any => {
    try {
      const value = getParameterValue(parameterId);
      return value ? JSON.parse(value) : {};
    } catch {
      return {};
    }
  };

  // Parse body content
  const getBodyContent = (): string => {
    try {
      const bodyArray = parseArrayParameter("body");
      if (Array.isArray(bodyArray)) {
        return bodyArray
          .map(
            (content: any) => content?.body?.split("\n").join("<br />") || ""
          )
          .join("");
      }
      // Handle case where body might be a string directly
      const bodyValue = getParameterValue("body");
      if (typeof bodyValue === "string" && bodyValue.trim() !== "") {
        try {
          // Try to parse as JSON in case it's a stringified array
          const parsed = JSON.parse(bodyValue);
          if (Array.isArray(parsed)) {
            return parsed
              .map(
                (content: any) =>
                  content?.body?.split("\n").join("<br />") || ""
              )
              .join("");
          }
        } catch {
          // If it's not JSON, treat it as plain text
          return bodyValue;
        }
      }
      return "";
    } catch {
      return "";
    }
  };

  // Parse email arrays and ensure proper format
  const parseEmailArray = (
    parameterId: string
  ): { id: string; email: string }[] => {
    const emails = parseArrayParameter(parameterId);
    return emails.map((email: any) =>
      typeof email === "string" ? { id: email, email } : email
    );
  };

  const followUpSettings = parseObjectParameter("followUpSettings");
  if (followUpSettings?.followUpIn && !followUpSettings?.followUpAt) {
    followUpSettings.followUpAt = new Date(
      Date.now() + followUpSettings.followUpIn
    );
  }

  return {
    to: parseEmailArray("to"),
    cc: parseEmailArray("cc"),
    bcc: parseEmailArray("bcc"),
    subject: getParameterValue("subject"),
    body: getBodyContent(),
    attachments: parseArrayParameter("attachments"),
    followUpSettings:
      followUpSettings?.followUpRequired !== undefined
        ? followUpSettings
        : undefined,
  };
};

// Helper function to create tool execution parameters from email draft data
export const createEmailDraftParameters = (
  data: EmailDraftData
): ParameterValue[] => {
  const messageContent = {
    body: data.body || "",
    type: "text/html",
  };

  const parameters: ParameterValue[] = [
    {
      parameterId: "subject",
      type: ParameterType.STRING,
      value: data.subject,
    },
    {
      parameterId: "body",
      type: ParameterType.ARRAY,
      value: JSON.stringify([messageContent]),
    },
    {
      parameterId: "to",
      type: ParameterType.ARRAY,
      value: JSON.stringify(data.to),
    },
    {
      parameterId: "cc",
      type: ParameterType.ARRAY,
      value: JSON.stringify(data.cc),
    },
    {
      parameterId: "bcc",
      type: ParameterType.ARRAY,
      value: JSON.stringify(data.bcc),
    },
    {
      parameterId: "attachments",
      type: ParameterType.ARRAY,
      value: JSON.stringify(data.attachments),
    },
  ];

  if (typeof data.followUpSettings?.followUpRequired === "boolean") {
    parameters.push({
      parameterId: "followUpSettings",
      type: ParameterType.OBJECT,
      value: JSON.stringify({
        followUpRequired: data.followUpSettings.followUpRequired,
        followUpIn:
          data.followUpSettings.followUpIn ||
          (data.followUpSettings.followUpAt
            ? data.followUpSettings.followUpAt.getTime() - Date.now()
            : undefined),
      }),
    });
  }

  return parameters;
};
