"use client";

import { useEffect, useMemo, useState } from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { chatApi } from "@/lib/api"; // <-- adjust path
import { InboxConversation, InboxUser } from "@/types/chat";

type ChatRow = {
  conversationId: string;
  storeId?: string;
  otherUser: InboxUser;
  lastMessageText?: string;
  lastMessageAt?: string;
};

interface ChatSidebarProps {
  selectedConversationId: string | null;
  onSelectConversation: (row: ChatRow) => void;
  currentUserId: string; // <-- needed to know who is "other user"
}

export function ChatSidebar({
  selectedConversationId,
  onSelectConversation,
  currentUserId,
}: ChatSidebarProps) {
  const [rows, setRows] = useState<ChatRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const fetchInbox = async () => {
    try {
      setLoading(true);
      const res = await chatApi.getInbox();

      const inbox: InboxConversation[] = res?.data?.data || [];

      const mapped: ChatRow[] = inbox
        .map((conv) => {
          const other = conv.participants.find((p) => p.user._id !== currentUserId)?.user;
          if (!other) return null;

          return {
            conversationId: conv._id,
            storeId: conv.store?._id,
            otherUser: other,
            lastMessageText: conv.lastMessage?.text,
            lastMessageAt: conv.lastMessage?.createdAt,
          };
        })
        .filter(Boolean) as ChatRow[];

      // optional: sort by updatedAt/lastMessage time
      mapped.sort((a, b) => {
        const ta = a.lastMessageAt ? new Date(a.lastMessageAt).getTime() : 0;
        const tb = b.lastMessageAt ? new Date(b.lastMessageAt).getTime() : 0;
        return tb - ta;
      });

      setRows(mapped);
    } catch (e) {
      console.error("Failed to load inbox", e);
      setRows([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInbox();
  }, []);

  const term = useMemo(() => searchTerm.toLowerCase().trim(), [searchTerm]);

  const filtered = useMemo(() => {
    if (!term) return rows;
    return rows.filter((r) => {
      const name = (r.otherUser.name || "").toLowerCase();
      const role = (r.otherUser.role || "").toLowerCase();
      return name.includes(term) || role.includes(term);
    });
  }, [rows, term]);

  return (
    <div className="w-80 border-r border-gray-200 flex flex-col bg-white">
      <div className="p-6 border-b border-gray-200">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Messages</h2>
        <p className="text-sm text-gray-500">Inbox (from /chat/inbox)</p>
      </div>

      <div className="p-4 border-b border-gray-200">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            placeholder="Search by name or role"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 bg-gray-50"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="p-4 text-center text-gray-500">Loading inbox...</div>
        ) : filtered.length === 0 ? (
          <div className="p-4 text-center text-gray-500">No conversations found</div>
        ) : (
          filtered.map((row) => {
            const isSelected = selectedConversationId === row.conversationId;

            return (
              <div
                key={row.conversationId}
                role="button"
                tabIndex={0}
                onClick={() => onSelectConversation(row)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") onSelectConversation(row);
                }}
                className={`w-full p-4 border-b border-gray-100 text-left transition-colors cursor-pointer ${
                  isSelected ? "bg-blue-50" : "hover:bg-gray-50"
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className="relative">
                    {row.otherUser.profileImage ? (
                      <img
                        src={row.otherUser.profileImage || "/placeholder.svg"}
                        alt={row.otherUser.name}
                        className="w-12 h-12 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-12 h-12 bg-gradient-to-br from-purple-400 to-pink-400 rounded-full flex items-center justify-center text-white font-semibold">
                        {(row.otherUser.name || "?").charAt(0).toUpperCase()}
                      </div>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900 truncate">
                      {row.otherUser.name}{" "}
                      <span className="ml-1 inline-flex items-center rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-medium text-gray-600">
                        {row.otherUser.role}
                      </span>
                    </p>

                    <p className="text-xs text-gray-500 truncate">
                      {row.lastMessageText ? row.lastMessageText : "No messages yet"}
                    </p>

                    {row.storeId && (
                      <p className="text-[10px] text-gray-400 mt-1 truncate">Store: {row.storeId}</p>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
