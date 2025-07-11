import axios, { AxiosInstance } from "axios";
import {
  Contact,
  ContactResponse,
  ContactsResponse,
  CreateContactRequest,
  UpdateContactRequest,
} from "@/types/contact";
import { API_CONFIG } from "@/config/api";

class ContactService {
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

  // GET /contacts/my - Get contacts by owner
  async getMyContacts(
    q?: string
  ): Promise<{ contacts: Contact[]; total: number }> {
    try {
      const response = await this.api.get<ContactsResponse>("/contacts/my", {
        params: q ? { q } : undefined,
      });
      return response.data;
    } catch (error: any) {
      throw new Error(
        error.response?.data?.message || "Failed to fetch contacts"
      );
    }
  }

  // GET /contacts/search - Search contacts by name or email
  async searchContacts(
    searchTerm: string
  ): Promise<{ contacts: Contact[]; total: number }> {
    try {
      const response = await this.api.get<ContactsResponse>("/contacts/my", {
        params: {
          q: searchTerm,
        },
      });
      return response.data;
    } catch (error: any) {
      throw new Error(
        error.response?.data?.message || "Failed to search contacts"
      );
    }
  }

  // GET /contacts/:contactId - Get contact by ID
  async getContactById(contactId: string): Promise<Contact> {
    try {
      const response = await this.api.get<ContactResponse>(
        `/contacts/${contactId}`
      );
      return response.data.contact;
    } catch (error: any) {
      throw new Error(
        error.response?.data?.message || "Failed to fetch contact"
      );
    }
  }

  // POST /contacts - Create a new contact
  async createContact(contactData: CreateContactRequest): Promise<Contact> {
    try {
      const response = await this.api.post<ContactResponse>(
        "/contacts",
        contactData
      );
      return response.data.contact;
    } catch (error: any) {
      throw new Error(
        error.response?.data?.message || "Failed to create contact"
      );
    }
  }

  // POST /contacts/:id - Update contact
  async updateContact(
    contactId: string,
    contactData: UpdateContactRequest
  ): Promise<Contact> {
    try {
      const response = await this.api.post<ContactResponse>(
        `/contacts/${contactId}`,
        contactData
      );
      return response.data.contact;
    } catch (error: any) {
      throw new Error(
        error.response?.data?.message || "Failed to update contact"
      );
    }
  }

  // DELETE /contacts/:contactId - Delete contact
  async deleteContact(contactId: string): Promise<boolean> {
    try {
      const response = await this.api.delete<{ success: boolean }>(
        `/contacts/${contactId}`
      );
      return response.data.success;
    } catch (error: any) {
      throw new Error(
        error.response?.data?.message || "Failed to delete contact"
      );
    }
  }

  // POST /contacts/:contactId/unsubscribe - Unsubscribe from contact's email address
  async unsubscribeContactAddress(
    contactId: string,
    emailAddress: string
  ): Promise<Contact> {
    try {
      const response = await this.api.post<ContactResponse>(
        `/contacts/${contactId}/unsubscribe`,
        { emailAddress }
      );
      return response.data.contact;
    } catch (error: any) {
      throw new Error(
        error.response?.data?.message || "Failed to unsubscribe from contact"
      );
    }
  }
}

export const contactService = new ContactService();
