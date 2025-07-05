import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import {
  Email,
  EmailWithoutContent,
  EmailStatus,
  GetEmailsRequest,
  UpdateEmailStatusRequest,
  SendEmailRequest,
  AddLookSessionRequest,
} from "@/types/email";
import { emailService } from "@/services/emailService";

interface EmailState {
  emails: Array<EmailWithoutContent>;
  currentEmail: Email | null;
  threadEmails: Array<Email>;
  contactEmails: Array<Email>;
  isLoading: boolean;
  isFetching: boolean;
  isUpdating: boolean;
  isDeleting: boolean;
  isArchiving: boolean;
  isMarking: boolean;
  isSending: boolean;
  isRestoring: boolean;
  error: string | null;
  totalEmails: number;
  currentPage: number;
  hasMore: boolean;
}

const initialState: EmailState = {
  emails: [],
  currentEmail: null,
  threadEmails: [],
  contactEmails: [],
  isLoading: false,
  isFetching: false,
  isUpdating: false,
  isDeleting: false,
  isArchiving: false,
  isMarking: false,
  isSending: false,
  isRestoring: false,
  error: null,
  totalEmails: 0,
  currentPage: 1,
  hasMore: true,
};

// Async thunks
export const fetchMyEmailsAsync = createAsyncThunk<
  Array<EmailWithoutContent>,
  GetEmailsRequest | undefined,
  { rejectValue: string }
>("emails/fetchMyEmails", async (params, { rejectWithValue }) => {
  try {
    return await emailService.getMyEmails(params);
  } catch (error: any) {
    return rejectWithValue(error.message || "Failed to fetch emails");
  }
});

export const fetchEmailByIdAsync = createAsyncThunk<
  Email,
  string,
  { rejectValue: string }
>("emails/fetchEmailById", async (emailId, { rejectWithValue }) => {
  try {
    return await emailService.getEmailById(emailId);
  } catch (error: any) {
    return rejectWithValue(error.message || "Failed to fetch email");
  }
});

export const fetchEmailsByThreadIdAsync = createAsyncThunk<
  Array<Email>,
  string,
  { rejectValue: string }
>("emails/fetchEmailsByThreadId", async (threadId, { rejectWithValue }) => {
  try {
    return await emailService.getEmailsByThreadId(threadId);
  } catch (error: any) {
    return rejectWithValue(error.message || "Failed to fetch emails by thread");
  }
});

export const updateEmailStatusAsync = createAsyncThunk<
  Email,
  { emailId: string; status: UpdateEmailStatusRequest },
  { rejectValue: string }
>(
  "emails/updateEmailStatus",
  async ({ emailId, status }, { rejectWithValue }) => {
    try {
      return await emailService.updateEmailStatus(emailId, status);
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to update email status");
    }
  }
);

export const markEmailAsReadAsync = createAsyncThunk<
  Array<Email>,
  string,
  { rejectValue: string }
>("emails/markEmailAsRead", async (emailId, { rejectWithValue }) => {
  try {
    return await emailService.markEmailAsRead(emailId);
  } catch (error: any) {
    return rejectWithValue(error.message || "Failed to mark email as read");
  }
});

export const deleteEmailAsync = createAsyncThunk<
  Array<Email>,
  string,
  { rejectValue: string }
>("emails/deleteEmail", async (emailId, { rejectWithValue }) => {
  try {
    return await emailService.deleteEmail(emailId);
  } catch (error: any) {
    return rejectWithValue(error.message || "Failed to delete email");
  }
});

export const restoreEmailAsync = createAsyncThunk<
  Email,
  string,
  { rejectValue: string }
>("emails/restoreEmail", async (emailId, { rejectWithValue }) => {
  try {
    return await emailService.restoreEmail(emailId);
  } catch (error: any) {
    return rejectWithValue(error.message || "Failed to restore email");
  }
});

export const addLookSessionAsync = createAsyncThunk<
  Email,
  { emailId: string; lookSession: AddLookSessionRequest },
  { rejectValue: string }
>(
  "emails/addLookSession",
  async ({ emailId, lookSession }, { rejectWithValue }) => {
    try {
      return await emailService.addLookSession(emailId, lookSession);
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to add look session");
    }
  }
);

export const fetchEmailsByContactAsync = createAsyncThunk<
  Array<Email>,
  { contactId: string; limit?: number; page?: number },
  { rejectValue: string }
>(
  "emails/fetchEmailsByContact",
  async ({ contactId, limit = 50, page = 0 }, { rejectWithValue }) => {
    try {
      return await emailService.getEmailsByContact(contactId, limit, page);
    } catch (error: any) {
      return rejectWithValue(
        error.message || "Failed to fetch emails by contact"
      );
    }
  }
);

export const fetchUnreadEmailsAsync = createAsyncThunk<
  void,
  { inboxId: string; limit?: number },
  { rejectValue: string }
>(
  "emails/fetchUnreadEmails",
  async ({ inboxId, limit = 30 }, { rejectWithValue }) => {
    try {
      return await emailService.fetchUnreadEmails(inboxId, limit);
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to fetch unread emails");
    }
  }
);

export const sendEmailAsync = createAsyncThunk<
  Email,
  SendEmailRequest,
  { rejectValue: string }
>("emails/sendEmail", async (emailData, { rejectWithValue }) => {
  try {
    return await emailService.sendEmail(emailData);
  } catch (error: any) {
    return rejectWithValue(error.message || "Failed to send email");
  }
});

export const markEmailAsSpamAsync = createAsyncThunk<
  Email,
  string,
  { rejectValue: string }
>("emails/markEmailAsSpam", async (emailId, { rejectWithValue }) => {
  try {
    return await emailService.markEmailAsSpam(emailId);
  } catch (error: any) {
    return rejectWithValue(error.message || "Failed to mark email as spam");
  }
});

export const unspamEmailAsync = createAsyncThunk<
  Email,
  string,
  { rejectValue: string }
>("emails/unspamEmail", async (emailId, { rejectWithValue }) => {
  try {
    return await emailService.unspamEmail(emailId);
  } catch (error: any) {
    return rejectWithValue(error.message || "Failed to unspam email");
  }
});

export const archiveEmailAsync = createAsyncThunk<
  Array<Email>,
  string,
  { rejectValue: string }
>("emails/archiveEmail", async (emailId, { rejectWithValue }) => {
  try {
    return await emailService.archiveEmail(emailId);
  } catch (error: any) {
    return rejectWithValue(error.message || "Failed to archive email");
  }
});

export const unarchiveEmailAsync = createAsyncThunk<
  Email,
  string,
  { rejectValue: string }
>("emails/unarchiveEmail", async (emailId, { rejectWithValue }) => {
  try {
    return await emailService.unarchiveEmail(emailId);
  } catch (error: any) {
    return rejectWithValue(error.message || "Failed to unarchive email");
  }
});

export const emailSlice = createSlice({
  name: "emails",
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    setCurrentEmail: (state, action: PayloadAction<Email | null>) => {
      state.currentEmail = action.payload;
    },
    clearCurrentEmail: (state) => {
      state.currentEmail = null;
    },
    clearThreadEmails: (state) => {
      state.threadEmails = [];
    },
    clearContactEmails: (state) => {
      state.contactEmails = [];
    },
    resetEmails: (state) => {
      state.emails = [];
      state.currentPage = 1;
      state.hasMore = true;
      state.totalEmails = 0;
    },
    updateEmailFromWebSocket: (state, action: PayloadAction<Email>) => {
      const email = action.payload;

      // Update in emails list if it exists
      const existingEmailIndex = state.emails.findIndex(
        (e) => e.id === email.id
      );
      if (existingEmailIndex !== -1) {
        // Convert full Email to EmailWithoutContent for the list
        const { message, ...emailWithoutContent } = email;
        state.emails[existingEmailIndex] =
          emailWithoutContent as EmailWithoutContent;
      }

      // Update current email if it's the same one
      if (state.currentEmail?.id === email.id) {
        state.currentEmail = email;
      }

      // Update in thread emails if it exists
      const threadEmailIndex = state.threadEmails.findIndex(
        (e) => e.id === email.id
      );
      if (threadEmailIndex !== -1) {
        state.threadEmails[threadEmailIndex] = email;
      }

      // Update in contact emails if it exists
      const contactEmailIndex = state.contactEmails.findIndex(
        (e) => e.id === email.id
      );
      if (contactEmailIndex !== -1) {
        state.contactEmails[contactEmailIndex] = email;
      }
    },
    removeEmailFromList: (state, action: PayloadAction<string>) => {
      const emailId = action.payload;

      // Remove from emails list
      state.emails = state.emails.filter((email) => email.id !== emailId);

      // Clear current email if it's the one being removed
      if (state.currentEmail?.id === emailId) {
        state.currentEmail = null;
      }

      // Remove from thread emails
      state.threadEmails = state.threadEmails.filter(
        (email) => email.id !== emailId
      );

      // Remove from contact emails
      state.contactEmails = state.contactEmails.filter(
        (email) => email.id !== emailId
      );

      // Adjust total count
      state.totalEmails = Math.max(0, state.totalEmails - 1);
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch My Emails
      .addCase(fetchMyEmailsAsync.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchMyEmailsAsync.fulfilled, (state, action) => {
        state.isLoading = false;
        state.emails = action.payload;
        state.totalEmails = action.payload.length;
        state.error = null;
      })
      .addCase(fetchMyEmailsAsync.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload || "Failed to fetch emails";
      })
      // Fetch Email by ID
      .addCase(fetchEmailByIdAsync.pending, (state) => {
        state.isFetching = true;
        state.error = null;
      })
      .addCase(fetchEmailByIdAsync.fulfilled, (state, action) => {
        state.isFetching = false;
        state.currentEmail = action.payload;
        state.error = null;
      })
      .addCase(fetchEmailByIdAsync.rejected, (state, action) => {
        state.isFetching = false;
        state.error = action.payload || "Failed to fetch email";
      })
      // Fetch Emails by Thread ID
      .addCase(fetchEmailsByThreadIdAsync.pending, (state) => {
        state.isFetching = true;
        state.error = null;
      })
      .addCase(fetchEmailsByThreadIdAsync.fulfilled, (state, action) => {
        state.isFetching = false;
        state.threadEmails = action.payload;
        state.error = null;
      })
      .addCase(fetchEmailsByThreadIdAsync.rejected, (state, action) => {
        state.isFetching = false;
        state.error = action.payload || "Failed to fetch emails by thread";
      })
      // Update Email Status
      .addCase(updateEmailStatusAsync.pending, (state) => {
        state.isUpdating = true;
        state.error = null;
      })
      .addCase(updateEmailStatusAsync.fulfilled, (state, action) => {
        state.isUpdating = false;
        state.currentEmail = action.payload;
        state.error = null;
      })
      .addCase(updateEmailStatusAsync.rejected, (state, action) => {
        state.isUpdating = false;
        state.error = action.payload || "Failed to update email status";
      })
      // Mark Email as Read
      .addCase(markEmailAsReadAsync.pending, (state) => {
        state.isMarking = true;
        state.error = null;
      })
      .addCase(markEmailAsReadAsync.fulfilled, (state, action) => {
        state.isMarking = false;
        // Update multiple emails that were marked as read
        action.payload.forEach((email) => {
          const emailIndex = state.emails.findIndex((e) => e.id === email.id);
          if (emailIndex !== -1) {
            const { message, ...emailWithoutContent } = email;
            state.emails[emailIndex] =
              emailWithoutContent as EmailWithoutContent;
          }
        });
        state.error = null;
      })
      .addCase(markEmailAsReadAsync.rejected, (state, action) => {
        state.isMarking = false;
        state.error = action.payload || "Failed to mark email as read";
      })
      // Delete Email
      .addCase(deleteEmailAsync.pending, (state) => {
        state.isDeleting = true;
        state.error = null;
      })
      .addCase(deleteEmailAsync.fulfilled, (state, action) => {
        state.isDeleting = false;
        // Update multiple emails that were affected by the delete
        action.payload.forEach((email) => {
          const emailIndex = state.emails.findIndex((e) => e.id === email.id);
          if (emailIndex !== -1) {
            const { message, ...emailWithoutContent } = email;
            state.emails[emailIndex] =
              emailWithoutContent as EmailWithoutContent;
          }
        });
        state.error = null;
      })
      .addCase(deleteEmailAsync.rejected, (state, action) => {
        state.isDeleting = false;
        state.error = action.payload || "Failed to delete email";
      })
      // Restore Email
      .addCase(restoreEmailAsync.pending, (state) => {
        state.isRestoring = true;
        state.error = null;
      })
      .addCase(restoreEmailAsync.fulfilled, (state, action) => {
        state.isRestoring = false;
        state.currentEmail = action.payload;
        state.error = null;
      })
      .addCase(restoreEmailAsync.rejected, (state, action) => {
        state.isRestoring = false;
        state.error = action.payload || "Failed to restore email";
      })
      // Add Look Session
      .addCase(addLookSessionAsync.pending, (state) => {
        state.isUpdating = true;
        state.error = null;
      })
      .addCase(addLookSessionAsync.fulfilled, (state, action) => {
        state.isUpdating = false;
        state.currentEmail = action.payload;
        state.error = null;
      })
      .addCase(addLookSessionAsync.rejected, (state, action) => {
        state.isUpdating = false;
        state.error = action.payload || "Failed to add look session";
      })
      // Fetch Emails by Contact
      .addCase(fetchEmailsByContactAsync.pending, (state) => {
        state.isFetching = true;
        state.error = null;
      })
      .addCase(fetchEmailsByContactAsync.fulfilled, (state, action) => {
        state.isFetching = false;
        state.contactEmails = action.payload;
        state.error = null;
      })
      .addCase(fetchEmailsByContactAsync.rejected, (state, action) => {
        state.isFetching = false;
        state.error = action.payload || "Failed to fetch emails by contact";
      })
      // Fetch Unread Emails
      .addCase(fetchUnreadEmailsAsync.pending, (state) => {
        state.isFetching = true;
        state.error = null;
      })
      .addCase(fetchUnreadEmailsAsync.fulfilled, (state) => {
        state.isFetching = false;
        state.error = null;
      })
      .addCase(fetchUnreadEmailsAsync.rejected, (state, action) => {
        state.isFetching = false;
        state.error = action.payload || "Failed to fetch unread emails";
      })
      // Send Email
      .addCase(sendEmailAsync.pending, (state) => {
        state.isSending = true;
        state.error = null;
      })
      .addCase(sendEmailAsync.fulfilled, (state, action) => {
        state.isSending = false;
        // Add the sent email to the emails list
        const { message, ...emailWithoutContent } = action.payload;
        state.emails.unshift(emailWithoutContent as EmailWithoutContent);
        state.totalEmails += 1;
        state.error = null;
      })
      .addCase(sendEmailAsync.rejected, (state, action) => {
        state.isSending = false;
        state.error = action.payload || "Failed to send email";
      })
      // Mark Email as Spam
      .addCase(markEmailAsSpamAsync.pending, (state) => {
        state.isMarking = true;
        state.error = null;
      })
      .addCase(markEmailAsSpamAsync.fulfilled, (state, action) => {
        state.isMarking = false;
        state.currentEmail = action.payload;
        state.error = null;
      })
      .addCase(markEmailAsSpamAsync.rejected, (state, action) => {
        state.isMarking = false;
        state.error = action.payload || "Failed to mark email as spam";
      })
      // Unspam Email
      .addCase(unspamEmailAsync.pending, (state) => {
        state.isMarking = true;
        state.error = null;
      })
      .addCase(unspamEmailAsync.fulfilled, (state, action) => {
        state.isMarking = false;
        state.currentEmail = action.payload;
        state.error = null;
      })
      .addCase(unspamEmailAsync.rejected, (state, action) => {
        state.isMarking = false;
        state.error = action.payload || "Failed to unspam email";
      })
      // Archive Email
      .addCase(archiveEmailAsync.pending, (state) => {
        state.isArchiving = true;
        state.error = null;
      })
      .addCase(archiveEmailAsync.fulfilled, (state, action) => {
        state.isArchiving = false;
        // Update multiple emails that were affected by the archive
        action.payload.forEach((email) => {
          const emailIndex = state.emails.findIndex((e) => e.id === email.id);
          if (emailIndex !== -1) {
            const { message, ...emailWithoutContent } = email;
            state.emails[emailIndex] =
              emailWithoutContent as EmailWithoutContent;
          }
        });
        state.error = null;
      })
      .addCase(archiveEmailAsync.rejected, (state, action) => {
        state.isArchiving = false;
        state.error = action.payload || "Failed to archive email";
      })
      // Unarchive Email
      .addCase(unarchiveEmailAsync.pending, (state) => {
        state.isArchiving = true;
        state.error = null;
      })
      .addCase(unarchiveEmailAsync.fulfilled, (state, action) => {
        state.isArchiving = false;
        state.currentEmail = action.payload;
        state.error = null;
      })
      .addCase(unarchiveEmailAsync.rejected, (state, action) => {
        state.isArchiving = false;
        state.error = action.payload || "Failed to unarchive email";
      });
  },
});

export const {
  clearError,
  setCurrentEmail,
  clearCurrentEmail,
  clearThreadEmails,
  clearContactEmails,
  resetEmails,
  updateEmailFromWebSocket,
  removeEmailFromList,
} = emailSlice.actions;

// Selectors
export const selectEmailById = (
  state: { emails: EmailState },
  emailId: string
) => {
  // First check in the main emails list
  const emailInList = state.emails.emails.find((email) => email.id === emailId);
  if (emailInList) {
    return emailInList;
  }

  // Then check the current email (full email with content)
  if (state.emails.currentEmail?.id === emailId) {
    return state.emails.currentEmail;
  }

  // Check thread emails
  const emailInThread = state.emails.threadEmails.find(
    (email) => email.id === emailId
  );
  if (emailInThread) {
    return emailInThread;
  }

  // Check contact emails
  const emailInContact = state.emails.contactEmails.find(
    (email) => email.id === emailId
  );
  if (emailInContact) {
    return emailInContact;
  }

  return null;
};

export const selectEmailByExternalId = (
  state: { emails: EmailState },
  externalId: string
) => {
  // First check in the main emails list
  const emailInList = state.emails.emails.find(
    (email) => email.emailId === externalId
  );
  if (emailInList) {
    return emailInList;
  }

  // Then check the current email (full email with content)
  if (state.emails.currentEmail?.emailId === externalId) {
    return state.emails.currentEmail;
  }

  // Check thread emails
  const emailInThread = state.emails.threadEmails.find(
    (email) => email.emailId === externalId
  );
  if (emailInThread) {
    return emailInThread;
  }

  // Check contact emails
  const emailInContact = state.emails.contactEmails.find(
    (email) => email.emailId === externalId
  );
  if (emailInContact) {
    return emailInContact;
  }

  return null;
};

export default emailSlice.reducer;
