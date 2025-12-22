// chat types (you can place in /types/chat.ts)
export type InboxUser = {
  _id: string;
  name: string;
  role: "ADMIN" | "VENDOR" | "CUSTOMER" | string;
  profileImage?: string;
};

export type InboxParticipant = {
  user: InboxUser;
  lastRead?: string;
};

export type InboxLastMessage = {
  text: string;
  sender: string;
  createdAt: string;
};

export type InboxConversation = {
  _id: string;
  participants: InboxParticipant[];
  store?: { _id: string };
  lastMessage?: InboxLastMessage;
  createdAt: string;
  updatedAt: string;
};
