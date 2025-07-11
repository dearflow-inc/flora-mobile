import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { RootState, AppDispatch } from "@/store";
import {
  fetchContactsAsync,
  searchContactsAsync,
  createContactAsync,
  clearSearchResults,
} from "@/store/slices/contactSlice";
import { Contact, CreateContactRequest } from "@/types/contact";

export const useContacts = () => {
  const dispatch = useDispatch<AppDispatch>();
  const {
    contacts,
    isLoading,
    error,
    searchResults,
    isSearching,
    searchError,
  } = useSelector((state: RootState) => state.contacts);
  const { isAuthenticated } = useSelector((state: RootState) => state.auth);

  // Fetch all contacts when user is authenticated
  useEffect(() => {
    if (isAuthenticated && contacts.length === 0) {
      dispatch(fetchContactsAsync());
    }
  }, [isAuthenticated, dispatch, contacts.length]);

  const searchContacts = (searchTerm: string) => {
    if (searchTerm.length >= 2) {
      dispatch(searchContactsAsync({ searchTerm }));
    } else {
      dispatch(clearSearchResults());
    }
  };

  const createContact = (contactData: CreateContactRequest) => {
    return dispatch(createContactAsync(contactData));
  };

  const clearSearch = () => {
    dispatch(clearSearchResults());
  };

  return {
    contacts,
    searchResults,
    isLoading,
    isSearching,
    error,
    searchError,
    searchContacts,
    createContact,
    clearSearch,
  };
};
