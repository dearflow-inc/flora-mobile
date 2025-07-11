export interface ContactEmailAddress {
  name: string;
  address: string;
  primary: boolean;
  description?: string;
  latestUnsubscribeActions?: Array<any>;
  unsubscribed?: boolean;
}

export interface ContactPhoneNumber {
  phone: string;
  primary: boolean;
  description?: string;
}

export interface ContactClassification {
  type?: string;
  relationshipTags: string[];
  authenticity: number;
}

export interface Contact {
  id: string;
  avatar?: string;
  firstName?: string;
  lastName?: string;
  emailAddresses: ContactEmailAddress[];
  phoneNumbers: ContactPhoneNumber[];
  companyName?: string;
  companySize?: string;
  job?: string;
  firstSystemContact?: Date;
  address?: string;
  dfOwner: any;
  createdAt: Date;
  updatedAt?: Date;
  isEncrypted: boolean;
  defaultInboxOutgoing?: string;
  classification?: ContactClassification;
  searchFirstName?: string;
  searchLastName?: string;
  searchEmails?: string[];
}

export interface ContactResponse {
  contact: Contact;
}

export interface ContactsResponse {
  contacts: Contact[];
  total: number;
}

export interface CreateContactRequest {
  avatar?: string;
  firstName?: string;
  lastName?: string;
  emailAddresses?: {
    name: string;
    address: string;
    primary?: boolean;
    description?: string;
  }[];
  phoneNumbers?: {
    phone: string;
    primary?: boolean;
    description?: string;
  }[];
  companyName?: string;
  companySize?: string;
  job?: string;
  firstSystemContact?: Date;
  classification?: {
    relationshipTags: string[];
    authenticity: number;
  };
}

export interface UpdateContactRequest {
  avatar?: string;
  firstName?: string;
  lastName?: string;
  emailAddresses?: {
    address: string;
    primary?: boolean;
    description?: string;
  }[];
  phoneNumbers?: {
    phone: string;
    primary?: boolean;
    description?: string;
  }[];
  companyName?: string;
  companySize?: string;
  job?: string;
  firstSystemContact?: Date;
  classification?: {
    type?: string;
    relationshipTags: string[];
    authenticity: number;
  };
}

export interface ContactState {
  contacts: Contact[];
  isLoading: boolean;
  error: string | null;
  searchResults: Contact[];
  isSearching: boolean;
  searchError: string | null;
}
