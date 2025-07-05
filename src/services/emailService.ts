import axios, { AxiosInstance } from "axios";
import {
  Email,
  EmailWithoutContent,
  EmailResponse,
  EmailWithoutContentResponse,
  SingleEmailResponse,
  MultipleEmailsResponse,
  GetEmailsRequest,
  UpdateEmailStatusRequest,
  SendEmailRequest,
  AddLookSessionRequest,
} from "@/types/email";
import { API_CONFIG } from "@/config/api";

class EmailService {
  private api: AxiosInstance;

  constructor() {
    this.api = axios.create({
      baseURL: API_CONFIG.API_BASE_URL,
      timeout: API_CONFIG.TIMEOUT,
      headers: API_CONFIG.HEADERS,
    });

    // Add request interceptor to include auth token
    this.api.interceptors.request.use(
      (config) => {
        // Token will be added by the auth interceptor when needed
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Add response interceptor for error handling
    this.api.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          // Token expired or invalid - will be handled by the auth flow
          return Promise.reject(error);
        }
        return Promise.reject(error);
      }
    );
  }

  setAuthToken(authToken: string, refreshToken: string): void {
    this.api.defaults.headers.Authorization = `JWT ${authToken};;;;;${refreshToken}`;
  }

  removeAuthToken(): void {
    delete this.api.defaults.headers.Authorization;
  }

  // GET /emails - Get my emails
  async getMyEmails(
    params?: GetEmailsRequest
  ): Promise<Array<EmailWithoutContent>> {
    try {
      const response = await this.api.get<EmailWithoutContentResponse>(
        "/emails",
        {
          params,
        }
      );
      return response.data.emails;
    } catch (error: any) {
      throw new Error(
        error.response?.data?.message || "Failed to fetch emails"
      );
    }
  }

  // GET /emails/:emailId - Get email by ID
  async getEmailById(emailId: string): Promise<Email> {
    try {
      const response = await this.api.get<SingleEmailResponse>(
        `/emails/${emailId}`
      );
      return response.data.email;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || "Failed to fetch email");
    }
  }

  // GET /emails/thread/:threadId - Get emails by thread ID
  async getEmailsByThreadId(threadId: string): Promise<Array<Email>> {
    try {
      const response = await this.api.get<EmailResponse>(
        `/emails/thread/${threadId}`
      );
      return response.data.emails;
    } catch (error: any) {
      throw new Error(
        error.response?.data?.message || "Failed to fetch emails by thread"
      );
    }
  }

  // POST /emails/:emailId/status - Update email status
  async updateEmailStatus(
    emailId: string,
    status: UpdateEmailStatusRequest
  ): Promise<Email> {
    try {
      const response = await this.api.post<SingleEmailResponse>(
        `/emails/${emailId}/status`,
        status
      );
      return response.data.email;
    } catch (error: any) {
      throw new Error(
        error.response?.data?.message || "Failed to update email status"
      );
    }
  }

  // POST /emails/:emailId/read - Mark email as read
  async markEmailAsRead(emailId: string): Promise<Array<Email>> {
    try {
      const response = await this.api.post<MultipleEmailsResponse>(
        `/emails/${emailId}/read`
      );
      return response.data.emails;
    } catch (error: any) {
      throw new Error(
        error.response?.data?.message || "Failed to mark email as read"
      );
    }
  }

  // POST /emails/:emailId/delete - Delete email
  async deleteEmail(emailId: string): Promise<Array<Email>> {
    try {
      const response = await this.api.post<MultipleEmailsResponse>(
        `/emails/${emailId}/delete`
      );
      return response.data.emails;
    } catch (error: any) {
      throw new Error(
        error.response?.data?.message || "Failed to delete email"
      );
    }
  }

  // POST /emails/:emailId/restore - Restore email
  async restoreEmail(emailId: string): Promise<Email> {
    try {
      const response = await this.api.post<SingleEmailResponse>(
        `/emails/${emailId}/restore`
      );
      return response.data.email;
    } catch (error: any) {
      throw new Error(
        error.response?.data?.message || "Failed to restore email"
      );
    }
  }

  // POST /emails/:emailId/look-session - Add new look session
  async addLookSession(
    emailId: string,
    lookSession: AddLookSessionRequest
  ): Promise<Email> {
    try {
      const response = await this.api.post<SingleEmailResponse>(
        `/emails/${emailId}/look-session`,
        lookSession
      );
      return response.data.email;
    } catch (error: any) {
      throw new Error(
        error.response?.data?.message || "Failed to add look session"
      );
    }
  }

  // GET /emails/by-contact/:contactId - Get emails by contact
  async getEmailsByContact(
    contactId: string,
    limit: number = 50,
    page: number = 0
  ): Promise<Array<Email>> {
    try {
      const response = await this.api.get<EmailResponse>(
        `/emails/by-contact/${contactId}`,
        {
          params: { limit, page },
        }
      );
      return response.data.emails;
    } catch (error: any) {
      throw new Error(
        error.response?.data?.message || "Failed to fetch emails by contact"
      );
    }
  }

  // POST /emails/inbox/:inboxId/fetch-unread - Fetch unread emails
  async fetchUnreadEmails(inboxId: string, limit: number = 30): Promise<void> {
    try {
      await this.api.post(`/emails/inbox/${inboxId}/fetch-unread`, null, {
        params: { limit },
      });
    } catch (error: any) {
      throw new Error(
        error.response?.data?.message || "Failed to fetch unread emails"
      );
    }
  }

  // POST /emails/send - Send email
  async sendEmail(emailData: SendEmailRequest): Promise<Email> {
    try {
      const response = await this.api.post<EmailResponse>(
        "/emails/send",
        emailData
      );
      return response.data.emails[0];
    } catch (error: any) {
      throw new Error(error.response?.data?.message || "Failed to send email");
    }
  }

  // POST /emails/:emailId/spam - Mark email as spam
  async markEmailAsSpam(emailId: string): Promise<Email> {
    try {
      const response = await this.api.post<SingleEmailResponse>(
        `/emails/${emailId}/spam`
      );
      return response.data.email;
    } catch (error: any) {
      throw new Error(
        error.response?.data?.message || "Failed to mark email as spam"
      );
    }
  }

  // POST /emails/:emailId/not-spam - Unspam email
  async unspamEmail(emailId: string): Promise<Email> {
    try {
      const response = await this.api.post<SingleEmailResponse>(
        `/emails/${emailId}/not-spam`
      );
      return response.data.email;
    } catch (error: any) {
      throw new Error(
        error.response?.data?.message || "Failed to unspam email"
      );
    }
  }

  // POST /emails/:emailId/archive - Archive email
  async archiveEmail(emailId: string): Promise<Array<Email>> {
    try {
      const response = await this.api.post<MultipleEmailsResponse>(
        `/emails/${emailId}/archive`
      );
      return response.data.emails;
    } catch (error: any) {
      throw new Error(
        error.response?.data?.message || "Failed to archive email"
      );
    }
  }

  // POST /emails/:emailId/unarchive - Unarchive email
  async unarchiveEmail(emailId: string): Promise<Email> {
    try {
      const response = await this.api.post<SingleEmailResponse>(
        `/emails/${emailId}/unarchive`
      );
      return response.data.email;
    } catch (error: any) {
      throw new Error(
        error.response?.data?.message || "Failed to unarchive email"
      );
    }
  }
}

export const emailService = new EmailService();
