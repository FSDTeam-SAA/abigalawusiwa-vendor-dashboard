"use client"

import { useEffect, useRef, useState, useMemo } from "react"
import { Paperclip, Send, MoreVertical, Loader2 } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { useToast } from "@/components/toast-provider"
import type { Message, Conversation } from "@/hooks/use-chat"

interface ChatWindowProps {
  conversation: Conversation | null
  messages: Message[]
  loading: boolean
  onSendMessage: (text: string) => Promise<void>
  isLoadingMessage?: boolean
}

export function ChatWindow({
  conversation,
  messages,
  loading,
  onSendMessage,
  isLoadingMessage = false,
}: ChatWindowProps) {
  const [messageText, setMessageText] = useState("")
  const [isSending, setIsSending] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)
  const { addToast } = useToast()

  // Header info similar to the design
  const headerTitle = useMemo(
    () => conversation?.store?.name || "Conversation",
    [conversation],
  )

  const customerName = useMemo(() => {
    // assume first participant is the customer side
    return conversation?.participants?.[0]?.user?.name || "Customer"
  }, [conversation])

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages])

  const formatTime = (dateStr: string) =>
    new Date(dateStr).toLocaleTimeString([], {
      hour: "numeric",
      minute: "2-digit",
    })

  const handleSendMessage = async () => {
    if (!messageText.trim() || !conversation) return

    try {
      setIsSending(true)
      await onSendMessage(messageText.trim())
      setMessageText("")
    } catch (error) {
      addToast({
        title: "Failed to send message",
        type: "error",
      })
    } finally {
      setIsSending(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey && !isSending) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  if (!conversation) {
    return (
      <div className="flex-1 flex items-center justify-center bg-white">
        <p className="text-gray-500">Select a customer to start chatting</p>
      </div>
    )
  }

  return (
    <div className="flex-1 flex flex-col bg-white">
      {/* Header – matches design */}
      <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-gray-900">
            {headerTitle}
          </h3>
          <p className="text-xs text-gray-500">From: {customerName}</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <span className="h-2 w-2 rounded-full bg-green-500" />
            <span>Active now</span>
          </div>
          <button className="p-1.5 hover:bg-gray-100 rounded-lg">
            <MoreVertical className="w-4 h-4 text-gray-600" />
          </button>
        </div>
      </div>

      {/* Messages area – light blue background like screenshot */}
      <div
        ref={scrollRef}
        className="flex-1 bg-[#E8F2FF] px-8 py-6 overflow-y-auto space-y-6"
      >
        {loading && messages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <Loader2 className="w-6 h-6 text-gray-400 animate-spin" />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex items-center justify-center h-full text-gray-500">
            No messages yet. Start the conversation!
          </div>
        ) : (
          messages.map((msg) => {
            // VENDOR = you (right, blue bubble), USER = customer (left, white bubble)
            const isVendor = msg.sender.role === "VENDOR"

            const avatar = (
              <div className="flex-shrink-0">
                {msg.sender.profileImage ? (
                  <img
                    src={msg.sender.profileImage}
                    alt={msg.sender.name}
                    className="w-8 h-8 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center text-xs font-semibold text-gray-700">
                    {msg.sender.name?.charAt(0).toUpperCase() ?? "U"}
                  </div>
                )}
              </div>
            )

            return (
              <div
                key={msg._id}
                className={`flex items-end gap-3 ${
                  isVendor ? "justify-end" : "justify-start"
                }`}
              >
                {!isVendor && avatar}

                <div
                  className={`max-w-md rounded-2xl px-4 py-3 shadow-sm ${
                    isVendor
                      ? "bg-[#1976F9] text-white"
                      : "bg-white text-gray-900"
                  }`}
                >
                  <p className="text-sm leading-relaxed whitespace-pre-line">
                    {msg.text}
                  </p>

                  {msg.files && msg.files.length > 0 && (
                    <div className="mt-2 space-y-1">
                      {msg.files.map((file, idx) => (
                        <a
                          key={idx}
                          href={file.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={`block text-xs underline ${
                            isVendor ? "text-blue-100" : "text-blue-600"
                          }`}
                        >
                          {file.fileType === "image" ? "📷 Image" : "📎 File"}
                        </a>
                      ))}
                    </div>
                  )}

                  <p
                    className={`mt-2 text-[11px] tracking-wide text-right ${
                      isVendor ? "text-blue-100" : "text-gray-400"
                    }`}
                  >
                    {formatTime(msg.createdAt)}
                  </p>
                </div>

                {isVendor && avatar}
              </div>
            )
          })
        )}

        {isLoadingMessage && (
          <div className="flex justify-start">
            <div className="bg-white px-4 py-2 rounded-2xl shadow-sm">
              <div className="flex gap-1">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-100" />
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-200" />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Input – grey bar with attach + send like the design */}
      <div className="px-6 py-4 border-t border-gray-200 bg-white">
        <div className="flex items-center gap-3 rounded-full bg-gray-100 px-4 py-2">
          <button
            type="button"
            className="flex-shrink-0 p-1 hover:opacity-80"
            // Hook this up to a file input when you add uploads
          >
            <Paperclip className="w-4 h-4 text-gray-500" />
          </button>

          <Input
            placeholder="Type your message here"
            value={messageText}
            onChange={(e) => setMessageText(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isSending}
            className="flex-1 border-none bg-transparent shadow-none focus-visible:ring-0 focus-visible:ring-offset-0 text-sm"
          />

          <Button
            type="button"
            onClick={handleSendMessage}
            disabled={isSending || !messageText.trim()}
            className="flex-shrink-0 rounded-full px-6 bg-[#1976F9] hover:bg-[#165fd0]"
          >
            {isSending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <span className="flex items-center gap-2 text-sm font-medium">
                <Send className="w-4 h-4" />
                <span>Send</span>
              </span>
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}
