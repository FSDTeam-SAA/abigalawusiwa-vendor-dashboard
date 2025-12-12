"use client"

import { useCallback, useEffect, useState } from "react"
import { signOut, useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Menu, Search, Bell, User, MessageCircleMore } from "lucide-react"
import { Input } from "@/components/ui/input"
import Link from "next/link"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { DeleteModal } from "./delete-modal"
import Image from "next/image"
import { toast } from "sonner"
import { getSocket } from "@/lib/socket"
import { chatApi } from "@/lib/api"
import { cn } from "@/lib/utils"

const parseTimestamp = (value?: string | number | Date) => {
  if (!value) return 0
  const date = value instanceof Date ? value : new Date(value)
  const time = date.getTime()
  return Number.isFinite(time) ? time : 0
}

const getParticipantId = (participant: any): string | null => {
  if (!participant) return null
  const candidate =
    participant?.user?._id ??
    participant?.user?.id ??
    participant?.userId ??
    participant?._id ??
    null

  return typeof candidate === "string" ? candidate : null
}

const pickDirectUnreadCount = (conversation: any, participant: any): number => {
  const candidates = [
    participant?.unreadCount,
    conversation?.unreadCount,
    conversation?.unreadMessages,
    conversation?.unread,
    conversation?.pendingCount,
    conversation?.messagesCount,
  ]

  for (const candidate of candidates) {
    if (typeof candidate === "number" && candidate > 0) {
      return candidate
    }
  }

  return 0
}

const computeUnreadFromConversations = (conversations: any[], userId: string) => {
  if (!userId) return 0

  return conversations.reduce((total, conversation) => {
    const participants = Array.isArray(conversation?.participants)
      ? conversation.participants
      : []
    const participant = participants.find((p: any) => getParticipantId(p) === userId) ?? null

    const direct = pickDirectUnreadCount(conversation, participant)
    if (direct > 0) {
      return total + direct
    }

    const lastRead = parseTimestamp(
      participant?.lastRead || conversation?.lastRead || conversation?.lastSeen
    )
    const lastMessage = parseTimestamp(
      conversation?.lastMessage?.createdAt ||
        conversation?.lastMessageAt ||
        conversation?.updatedAt
    )

    if (lastMessage > lastRead && lastMessage > 0) {
      return total + 1
    }

    return total
  }, 0)
}

const extractUnreadCount = (payload: any): number => {
  if (!payload || Array.isArray(payload) || typeof payload !== "object") return 0

  const keys = [
    "totalUnread",
    "unreadCount",
    "unreadMessages",
    "unread",
    "count",
    "messagesCount",
  ]

  for (const key of keys) {
    const value = payload[key]
    if (typeof value === "number" && value >= 0) return value
  }

  if (payload.meta) {
    for (const key of keys) {
      const value = payload.meta?.[key]
      if (typeof value === "number" && value >= 0) return value
    }
  }

  return 0
}

const extractInboxConversations = (payload: any) => {
  if (Array.isArray(payload)) return payload
  if (!payload || typeof payload !== "object") return []

  if (Array.isArray(payload.conversations)) return payload.conversations
  if (Array.isArray(payload.items)) return payload.items
  if (Array.isArray(payload.data)) return payload.data

  return []
}

const getMessageSenderId = (payload: any): string | null => {
  if (!payload || typeof payload !== "object") return null

  const candidate =
    payload?.senderId ??
    payload?.from ??
    payload?.userId ??
    payload?.sender?._id ??
    payload?.sender?.id ??
    payload?.sender?.userId ??
    payload?.data?.senderId ??
    payload?.data?.sender?._id ??
    null

  return typeof candidate === "string" ? candidate : null
}

export function Header({ onMenuClick }: { onMenuClick: () => void }) {
  const { data: session } = useSession()
  const router = useRouter()
  const [showLogoutModal, setShowLogoutModal] = useState(false)

  const userId =
    (session?.user as any)?.id ||
    (session?.user as any)?._id ||
    (session?.user as any)?.userId ||
    null

  const [unreadCount, setUnreadCount] = useState(0)
  const [messageCount, setMessageCount] = useState(0)

  const fetchMessageCount = useCallback(async () => {
    if (!userId) return
    try {
      const res = await chatApi.getInbox()
      const payload = res?.data?.data ?? []
      const conversations = extractInboxConversations(payload)
      const fallback = extractUnreadCount(payload)

      if (!conversations.length) {
        setMessageCount(fallback)
        return
      }

      const computed = computeUnreadFromConversations(conversations, userId)
      setMessageCount(computed || fallback)
    } catch (error) {
      console.error("Failed to load message count:", error)
    }
  }, [userId])

  useEffect(() => {
    if (!userId) return

    const socket = getSocket()

    socket.emit("notifications:join", userId)

    const onCount = (payload: { count: number }) => {
      setUnreadCount(payload?.count ?? 0)
    }

    const onNew = () => {
      // quick optimistic bump (server will also send notification:count)
      setUnreadCount((prev) => prev + 1)
    }

    socket.on("notification:count", onCount)
    socket.on("notification:new", onNew)

    return () => {
      socket.off("notification:count", onCount)
      socket.off("notification:new", onNew)
      socket.emit("notifications:leave", userId)
    }
  }, [userId])

  useEffect(() => {
    if (!userId) return

    fetchMessageCount()

    const socket = getSocket()
    socket.emit("messages:join", userId)

    const onCount = (payload: { count?: number }) => {
      if (typeof payload?.count === "number" && payload.count >= 0) {
        setMessageCount(payload.count)
      }
    }

    const onNew = (payload: any) => {
      const sender = getMessageSenderId(payload)
      if (sender && sender === userId) return
      setMessageCount((prev) => prev + 1)
    }

    socket.on("message:count", onCount)
    socket.on("newMessage", onNew)

    return () => {
      socket.off("message:count", onCount)
      socket.off("newMessage", onNew)
      socket.emit("messages:leave", userId)
    }
  }, [userId, fetchMessageCount])

  const handleLogout = async () => {
    await signOut({ redirect: false })
    toast.success("Logged out successfully")
    router.push("/auth/login")
    setShowLogoutModal(false)
  }

  return (
    <>
      <header className="bg-[#E8F0F8] border-b border-gray-200 px-8 py-4 flex items-center justify-between">
        <button
          onClick={onMenuClick}
          className="lg:hidden p-2 hover:bg-gray-100 rounded-lg"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="flex-1 max-w-md mx-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input placeholder="Search" className="pl-10 bg-white border-gray-200" />
          </div>
        </div>

        <div className="flex items-center gap-4">
          {/* 🔔 Notifications + badge */}
          <Link
            href="/dashboard/notifications"
            className="relative p-2 hover:bg-blue-600 hover:text-white rounded-lg"
          >
            <Bell className="w-5 h-5 hover:text-white" />

            {unreadCount > 0 && (
              <span
                className={cn(
                  "absolute -top-1 -right-1 min-w-[18px] h-[18px]",
                  "rounded-full bg-red-600 text-white text-[10px] font-semibold",
                  "flex items-center justify-center px-1"
                )}
              >
                {unreadCount > 99 ? "99+" : unreadCount}
              </span>
            )}
          </Link>

          <Link
            href="/dashboard/messages"
            className="relative p-2 hover:bg-blue-600 hover:text-white rounded-lg"
          >
            <MessageCircleMore className="w-5 h-5 hover:text-white" />

            {messageCount > 0 && (
              <span
                className={cn(
                  "absolute -top-1 -right-1 min-w-[18px] h-[18px]",
                  "rounded-full bg-red-600 text-white text-[10px] font-semibold",
                  "flex items-center justify-center px-1"
                )}
              >
                {messageCount > 99 ? "99+" : messageCount}
              </span>
            )}
          </Link>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="w-10 h-10 bg-gradient-to-br from-purple-400 to-pink-400 rounded-full flex items-center justify-center hover:opacity-80 transition-opacity overflow-hidden">
                {session?.user?.image ? (
                  <Image
                    src={session.user.image || "/placeholder.svg"}
                    alt="Profile"
                    width={40}
                    height={40}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <User className="w-5 h-5 text-white" />
                )}
              </button>
            </DropdownMenuTrigger>

            <DropdownMenuContent align="end" className="w-48">
              <div className="px-4 py-2 border-b">
                <p className="text-xs text-gray-500">{(session?.user as any)?.role}</p>
              </div>

              <DropdownMenuItem asChild>
                <Link href="/dashboard/account" className="cursor-pointer">
                  <User className="w-4 h-4 mr-2" />
                  Profile
                </Link>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      <DeleteModal
        open={showLogoutModal}
        title="Log Out"
        message="Are you sure you want to log out?"
        onConfirm={handleLogout}
        onCancel={() => setShowLogoutModal(false)}
      />
    </>
  )
}
