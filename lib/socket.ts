// lib/socket.ts
"use client"

import { io, Socket } from "socket.io-client"

let socket: Socket | null = null

const sanitizeUrl = (raw: string) => raw.trim().replace(/\/+$/, "")

const deriveSocketUrl = () => {
  const socketSpecific =
    process.env.NEXT_PUBLIC_SOCKET_BASE_URL ||
    process.env.NEXT_PUBLIC_SOCKET_URL

  if (socketSpecific && socketSpecific.trim().length > 0) {
    return sanitizeUrl(socketSpecific)
  }

  const base = process.env.NEXT_PUBLIC_BASE_URL
  if (base && base.trim().length > 0) {
    return sanitizeUrl(base.replace(/\/api(?:\/v\d+)?\/?$/i, ""))
  }

  return "http://localhost:5001"
}

const SOCKET_URL = deriveSocketUrl()

export const initSocket = () => {
  if (socket && socket.connected) return socket

  socket = io(SOCKET_URL, {
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
    reconnectionAttempts: 5,
    withCredentials: true,
    transports: ["websocket"], // optional but recommended
  })

  return socket
}

export const getSocket = () => {
  if (!socket) {
    return initSocket()
  }
  return socket
}

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect()
    socket = null
  }
}
