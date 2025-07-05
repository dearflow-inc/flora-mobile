import { ChatAttachment, SystemReferenceType } from "@/types/attachment";

export const mockAttachments: ChatAttachment[] = [
  {
    id: "1",
    type: SystemReferenceType.EMAIL,
    emailId: "email-123",
    meta: {
      title: "Meeting Reminder",
      email: "john@example.com",
      name: "John Doe",
    },
    createdAt: new Date().toISOString(),
  },
  {
    id: "2",
    type: SystemReferenceType.TODO,
    externalId: "todo-456",
    meta: {
      title: "Complete project proposal",
      description:
        "Finish the quarterly project proposal and submit to management",
    },
    createdAt: new Date().toISOString(),
  },
  {
    id: "3",
    type: SystemReferenceType.CONTACT,
    externalId: "contact-789",
    meta: {
      name: "Sarah Johnson",
      email: "sarah@company.com",
      description: "Marketing Manager",
    },
    createdAt: new Date().toISOString(),
  },
  {
    id: "4",
    type: SystemReferenceType.DOCUMENT,
    externalId: "doc-101",
    meta: {
      name: "Q4 Budget Report.pdf",
      type: "PDF Document",
    },
    createdAt: new Date().toISOString(),
  },
  {
    id: "5",
    type: SystemReferenceType.VIDEO,
    externalId: "video-202",
    meta: {
      title: "Team Training Session",
      duration: "45 minutes",
    },
    createdAt: new Date().toISOString(),
  },
];

// Helper function to get a random attachment for testing
export const getRandomAttachment = (): ChatAttachment => {
  const randomIndex = Math.floor(Math.random() * mockAttachments.length);
  return mockAttachments[randomIndex];
};

// Helper function to get multiple random attachments
export const getRandomAttachments = (count: number = 1): ChatAttachment[] => {
  const result: ChatAttachment[] = [];
  for (let i = 0; i < count; i++) {
    result.push(getRandomAttachment());
  }
  return result;
};
