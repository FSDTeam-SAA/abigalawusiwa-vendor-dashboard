// lib/socket.ts
"use client"

import { io, Socket } from "socket.io-client"

let socket: Socket | null = null

export const initSocket = () => {
  if (socket && socket.connected) return socket

  socket = io(process.env.NEXT_PUBLIC_SOCKET_BASE_URL || "http://localhost:5001", {
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
