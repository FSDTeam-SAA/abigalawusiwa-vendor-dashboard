"use client"

import { useEffect, useRef, useState, useMemo } from "react"
import { Paperclip, Send, MoreVertical, Loader2, Smile, X } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { useToast } from "@/components/toast-provider"
import type { Message, Conversation } from "@/hooks/use-chat"

type SelectedFile = File | null

interface ChatWindowProps {
  conversation: Conversation | null
  messages: Message[]
  loading: boolean
  onSendMessage: (text: string, file: SelectedFile) => Promise<void>
  isLoadingMessage?: boolean
}

// Emoji Picker
const EmojiPickerPlaceholder = ({
  onEmojiSelect,
  onClose,
}: {
  onEmojiSelect: (emoji: string) => void
  onClose: () => void
}) => {
  const commonEmojis = ["😀", "😂", "🥰", "👍", "🙏", "🚀", "💡", "🥳"]

  return (
    <div className="absolute bottom-16 left-4 w-64 bg-white border border-gray-200 rounded-xl shadow-lg p-3 z-20">
      <div className="flex justify-between items-center mb-2 border-b pb-2">
        <h4 className="text-xs font-semibold text-gray-700 uppercase tracking-wide">
          Pick an emoji
        </h4>
        <button
          onClick={onClose}
          className="p-1 rounded-full hover:bg-gray-100 active:bg-gray-200"
          type="button"
          aria-label="Close emoji picker"
        >
          <X className="w-4 h-4 text-gray-500" />
        </button>
      </div>
      <div className="flex flex-wrap gap-2">
        {commonEmojis.map((emoji) => (
          <button
            key={emoji}
            onClick={() => onEmojiSelect(emoji)}
            className="text-xl p-1.5 hover:bg-gray-100 rounded-md transition-colors"
            title={emoji}
            type="button"
          >
            {emoji}
          </button>
        ))}
      </div>
    </div>
  )
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
  const [selectedFile, setSelectedFile] = useState<SelectedFile>(null)
  const [showEmojiPicker, setShowEmojiPicker] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { addToast } = useToast()

  const headerTitle = useMemo(
    () => conversation?.store?.name || "Conversation",
    [conversation],
  )

  const customerName = useMemo(
    () => conversation?.participants?.[0]?.user?.name || "Customer",
    [conversation],
  )

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages])

  const formatTime = (dateInput: string | Date) =>
    new Date(dateInput).toLocaleTimeString([], {
      hour: "numeric",
      minute: "2-digit",
    })

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        addToast({
          title: "File too large",
          description: "Please select a file smaller than 5MB.",
          type: "error",
        })
        e.target.value = ""
        setSelectedFile(null)
        return
      }
      setSelectedFile(file)
    }
  }

  const handleEmojiClick = (emoji: string) => {
    setMessageText((prev) => prev + emoji)
    setShowEmojiPicker(false)
  }

  const handleToggleEmojiPicker = () => {
    setShowEmojiPicker((prev) => !prev)
  }

  const handleSendMessage = async () => {
    if (!messageText.trim() && !selectedFile) return
    if (!conversation) return

    try {
      setIsSending(true)
      await onSendMessage(messageText.trim(), selectedFile)
      setMessageText("")
      setSelectedFile(null)
      if (fileInputRef.current) {
        fileInputRef.current.value = ""
      }
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
      {/* Header */}
      <div className="px-4 md:px-6 py-3 border-b border-gray-200 flex items-center justify-between bg-white/80 backdrop-blur">
        <div>
          <h3 className="text-sm font-semibold text-gray-900">
            {headerTitle}
          </h3>
          <p className="text-xs text-gray-500">From: {customerName}</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-[11px] text-gray-500">
            <span className="h-2 w-2 rounded-full bg-green-500 shadow-[0_0_0_3px_rgba(34,197,94,0.3)]" />
            <span>Active now</span>
          </div>
          <button
            className="p-1.5 hover:bg-gray-100 rounded-lg"
            type="button"
            aria-label="More options"
          >
            <MoreVertical className="w-4 h-4 text-gray-600" />
          </button>
        </div>
      </div>

      {/* Messages */}
      <div
        ref={scrollRef}
        className="flex-1 bg-[#E8F2FF] px-4 md:px-8 py-4 md:py-6 overflow-y-auto space-y-4 md:space-y-6"
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
                      ? "bg-[#1A73E8] text-white"
                      : "bg-white text-gray-900 border border-gray-100"
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
              <div className="flex gap-1 px-2 py-1">
                <span className="w-1.5 h-1.5 rounded-full bg-gray-400 animate-bounce" />
                <span className="w-1.5 h-1.5 rounded-full bg-gray-400 animate-bounce [animation-delay:0.15s]" />
                <span className="w-1.5 h-1.5 rounded-full bg-gray-400 animate-bounce [animation-delay:0.3s]" />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Input */}
      <div className="px-6 py-4 border-t border-gray-200 bg-white relative">
        {showEmojiPicker && (
          <EmojiPickerPlaceholder
            onEmojiSelect={handleEmojiClick}
            onClose={() => setShowEmojiPicker(false)}
          />
        )}

        {selectedFile && (
          <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-gray-100 px-3 py-1 text-xs text-gray-700 max-w-full">
            <Paperclip className="w-3 h-3" />
            <span className="truncate max-w-[200px]">
              <span className="font-semibold">Attached:</span>{" "}
              {selectedFile.name} (
              {(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
            </span>
            <button
              onClick={() => {
                setSelectedFile(null)
                if (fileInputRef.current) fileInputRef.current.value = ""
              }}
              className="ml-1 rounded-full px-1 leading-none text-gray-500 hover:bg-gray-200 hover:text-gray-800"
              type="button"
              aria-label="Remove attached file"
            >
              ×
            </button>
          </div>
        )}

        <div className="flex items-center gap-3 rounded-full bg-gray-100 border border-gray-200 px-4 py-1.5">
          {/* Hidden file input */}
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            disabled={isSending}
            className="hidden"
            accept="image/*,application/pdf,.doc,.docx"
          />

          {/* File button */}
          <button
            type="button"
            className="flex-shrink-0 p-1 hover:opacity-80"
            onClick={() => fileInputRef.current?.click()}
            disabled={isSending}
            aria-label="Attach file"
          >
            <Paperclip className="w-4 h-4 text-gray-500" />
          </button>

          {/* Emoji button */}
          <button
            type="button"
            className="flex-shrink-0 p-1 hover:opacity-80"
            onClick={handleToggleEmojiPicker}
            disabled={isSending}
            aria-label="Open emoji picker"
          >
            <Smile className="w-4 h-4 text-gray-500" />
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
            disabled={isSending || (!messageText.trim() && !selectedFile)}
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
