"use client";

import { useEffect, useState } from "react";
import { ChatSidebar } from "@/components/chat-sidebar";
import { ChatWindow } from "@/components/chat-window";
import { useChat, type Conversation } from "@/hooks/use-chat";
import { useToast } from "@/components/toast-provider";

type ChatRow = {
  conversationId: string;
  storeId?: string;
  otherUser: { _id: string; name: string; role: string; profileImage?: string };
};

export default function MessagesPage() {
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const { addToast } = useToast();

  // ✅ you must get this from auth (session/user store/etc.)
  const currentUserId = "PUT_CURRENT_USER_ID_HERE";

  const { messages, loading, fetchMessages, sendMessage } = useChat(selectedConversation?._id);

  const openConversation = async (row: ChatRow) => {
    try {
      // if your hook expects a Conversation object, store minimal shape:
      setSelectedConversation({ _id: row.conversationId } as Conversation);
      await fetchMessages(row.conversationId);
    } catch (e) {
      addToast({ title: "Failed to open conversation", type: "error" });
    }
  };

  const handleSendMessage = async (text: string, file: File | null) => {
    if (!selectedConversation) return;
    try {
      // update your hook to support files if you want:
      // await sendMessage(text, file ? [file] : undefined);

      await sendMessage(text); // current behavior
    } catch (e) {
      addToast({ title: "Failed to send message", type: "error" });
    }
  };

  return (
    <div className="flex h-full bg-white gap-0">
      <ChatSidebar
        currentUserId={currentUserId}
        selectedConversationId={selectedConversation?._id ?? null}
        onSelectConversation={openConversation}
      />

      <ChatWindow
        conversation={selectedConversation}
        messages={messages}
        loading={loading}
        onSendMessage={handleSendMessage}
      />
    </div>
  );
}
