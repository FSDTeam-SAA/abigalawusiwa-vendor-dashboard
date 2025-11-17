// hooks/use-chat.ts
"use client"

import { useEffect, useState, useCallback } from "react"
import { useSession } from "next-auth/react"
import { getSocket } from "@/lib/socket"
import { chatApi } from "@/lib/api"

export interface Message {
  _id: string
  sender: {
    _id: string
    name: string
    role?: string
    profileImage?: string
  }
  text: string
  files?: { url: string; fileType: string }[]
  createdAt: string
}

export interface Conversation {
  _id: string
  participants: Array<{
    user: { _id: string; name: string; profileImage?: string }
    lastRead?: string
  }>
  lastMessage?: {
    text: string
    sender: string
    createdAt: string
  }
  store: { _id: string; name: string; storeLogo?: string }
}

export const useChat = (conversationId?: string) => {
  const { data: session } = useSession()
  const [messages, setMessages] = useState<Message[]>([])
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!session) return

    const socket = getSocket()

    const handleConnect = () => {
      console.log("Socket connected:", socket.id)
      // If user already has a conversation selected, ensure we’re in that room.
      if (conversationId) {
        socket.emit("joinConversation", conversationId)
      }
    }

    const handleNewMessage = (message: Message) => {
      // Optional: if your backend sends conversationId, you could filter here
      setMessages((prev) => [...prev, message])
    }

    socket.on("connect", handleConnect)
    socket.on("newMessage", handleNewMessage)

    // Join specific room when conversationId changes
    if (conversationId) {
      socket.emit("joinConversation", conversationId)
    }

    return () => {
      if (conversationId) {
        socket.emit("leaveConversation", conversationId)
      }
      socket.off("connect", handleConnect)
      socket.off("newMessage", handleNewMessage)
    }
  }, [session, conversationId])

  const fetchInbox = useCallback(async () => {
    try {
      setLoading(true)
      const response = await chatApi.getInbox()
      setConversations(response.data.data || [])
    } catch (error) {
      console.error("Failed to fetch inbox:", error)
    } finally {
      setLoading(false)
    }
  }, [])

  const fetchMessages = useCallback(async (id: string) => {
    try {
      setLoading(true)
      const response = await chatApi.getMessages(id)
      setMessages(response.data.data || [])
    } catch (error) {
      console.error("Failed to fetch messages:", error)
    } finally {
      setLoading(false)
    }
  }, [])

  const sendMessage = useCallback(
    async (text: string, files?: File[]) => {
      if (!conversationId) return

      try {
        const response = await chatApi.sendMessage(conversationId, text, files)
        // if backend also emits via socket, you don’t *have* to push here
        // but optimistic update is fine:
        // setMessages((prev) => [...prev, response.data.data])
        return response.data.data
      } catch (error) {
        console.error("Failed to send message:", error)
        throw error
      }
    },
    [conversationId],
  )

  const startConversation = useCallback(async (storeId: string) => {
    try {
      const response = await chatApi.startConversation(storeId)
      return response.data.data as Conversation
    } catch (error) {
      console.error("Failed to start conversation:", error)
      throw error
    }
  }, [])

  return {
    messages,
    conversations,
    loading,
    fetchInbox,
    fetchMessages,
    sendMessage,
    startConversation,
  }
}
