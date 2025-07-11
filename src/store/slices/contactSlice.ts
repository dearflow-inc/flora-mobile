import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import { ContactState, Contact, CreateContactRequest } from "@/types/contact";
import { contactService } from "@/services/contactService";

const initialState: ContactState = {
  contacts: [],
  isLoading: false,
  error: null,
  searchResults: [],
  isSearching: false,
  searchError: null,
};

// Async thunks
export const fetchContactsAsync = createAsyncThunk<
  { contacts: Contact[]; total: number },
  void,
  { rejectValue: string }
>("contacts/fetchContacts", async (_, { rejectWithValue }) => {
  try {
    const response = await contactService.getMyContacts();
    return response;
  } catch (error: any) {
    return rejectWithValue(error.message || "Failed to fetch contacts");
  }
});

export const searchContactsAsync = createAsyncThunk<
  { contacts: Contact[]; total: number },
  { searchTerm: string },
  { rejectValue: string }
>("contacts/searchContacts", async ({ searchTerm }, { rejectWithValue }) => {
  try {
    const response = await contactService.searchContacts(searchTerm);
    return response;
  } catch (error: any) {
    return rejectWithValue(error.message || "Failed to search contacts");
  }
});

export const createContactAsync = createAsyncThunk<
  Contact,
  CreateContactRequest,
  { rejectValue: string }
>("contacts/createContact", async (contactData, { rejectWithValue }) => {
  try {
    const contact = await contactService.createContact(contactData);
    return contact;
  } catch (error: any) {
    return rejectWithValue(error.message || "Failed to create contact");
  }
});

export const contactSlice = createSlice({
  name: "contacts",
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    clearSearchError: (state) => {
      state.searchError = null;
    },
    clearSearchResults: (state) => {
      state.searchResults = [];
    },
    addContact: (state, action: PayloadAction<Contact>) => {
      state.contacts.push(action.payload);
    },
    updateContact: (state, action: PayloadAction<Contact>) => {
      const index = state.contacts.findIndex((c) => c.id === action.payload.id);
      if (index !== -1) {
        state.contacts[index] = action.payload;
      }
    },
    removeContact: (state, action: PayloadAction<string>) => {
      state.contacts = state.contacts.filter((c) => c.id !== action.payload);
    },
  },
  extraReducers: (builder) => {
    // Fetch contacts
    builder
      .addCase(fetchContactsAsync.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchContactsAsync.fulfilled, (state, action) => {
        state.isLoading = false;
        state.contacts = action.payload.contacts;
        state.error = null;
      })
      .addCase(fetchContactsAsync.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload || "Failed to fetch contacts";
      });

    // Search contacts
    builder
      .addCase(searchContactsAsync.pending, (state) => {
        state.isSearching = true;
        state.searchError = null;
      })
      .addCase(searchContactsAsync.fulfilled, (state, action) => {
        state.isSearching = false;
        state.searchResults = action.payload.contacts;
        state.searchError = null;
      })
      .addCase(searchContactsAsync.rejected, (state, action) => {
        state.isSearching = false;
        state.searchError = action.payload || "Failed to search contacts";
      });

    // Create contact
    builder.addCase(createContactAsync.fulfilled, (state, action) => {
      state.contacts.push(action.payload);
    });
  },
});

export const {
  clearError,
  clearSearchError,
  clearSearchResults,
  addContact,
  updateContact,
  removeContact,
} = contactSlice.actions;

export default contactSlice.reducer;
