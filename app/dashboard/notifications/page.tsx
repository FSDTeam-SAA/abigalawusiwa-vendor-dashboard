"use client";

import { useEffect, useMemo } from "react";
import { toast } from "sonner";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { notificationApi } from "@/lib/api";
import type { Notification } from "@/lib/api";
import { getSocket } from "@/lib/socket";
import { useSession } from "next-auth/react";
import Image from "next/image";

type QueryData = {
  notifications: Notification[];
  pagination?: any;
};

const containerVariants = {
  visible: { transition: { staggerChildren: 0.06 } },
};

const itemVariants = {
  visible: { opacity: 1, y: 0 },
};

function formatTime(n: Notification) {
  const raw = (n as any).createdAt ?? n.sentAt;
  if (!raw) return "Just now";
  const d = new Date(raw);
  if (Number.isNaN(d.getTime())) return "Just now";
  return d.toLocaleString();
}

function normalizeIncoming(payload: any): Notification | null {
  if (!payload) return null;
  if (payload?._id) return payload as Notification;
  if (payload?.notification?._id) return payload.notification as Notification;
  if (payload?.data?._id) return payload.data as Notification;
  if (payload?.data?.notification?._id)
    return payload.data.notification as Notification;
  return null;
}

export default function NotificationsPage() {
  const queryClient = useQueryClient();
  const { data: session } = useSession();

  const userId =
    (session?.user as any)?.id ||
    (session?.user as any)?._id ||
    (session?.user as any)?.userId;

  const { data, isLoading, isError, error } = useQuery<QueryData>({
    queryKey: ["notifications"],
    queryFn: async () => {
      const res = await notificationApi.getMyNotifications();
      return res.data.data;
    },
  });

  const notifications = data?.notifications ?? [];

  const unreadCount = useMemo(
    () => notifications.filter((n) => n.status === "unread").length,
    [notifications]
  );

  // ✅ SOCKET
  useEffect(() => {
    if (!userId) return;

    const socket = getSocket();
    socket.emit("notifications:join", userId);

    const onNew = (payload: any) => {
      const incoming = normalizeIncoming(payload);
      if (!incoming) return;

      queryClient.setQueryData<QueryData>(["notifications"], (old) => {
        const prev = old?.notifications ?? [];
        const exists = prev.some((n) => n._id === incoming._id);
        if (exists) return old ?? { notifications: prev };
        return { ...(old ?? {}), notifications: [incoming, ...prev] };
      });

      toast.info(incoming.title || "New notification");
    };

    socket.on("notification:new", onNew);

    return () => {
      socket.off("notification:new", onNew);
      socket.emit("notifications:leave", userId);
    };
  }, [userId, queryClient]);

  const markAllAsReadMutation = useMutation({
    mutationFn: async () => notificationApi.markAllRead(),
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: ["notifications"] });
      const previous = queryClient.getQueryData<QueryData>(["notifications"]);

      queryClient.setQueryData<QueryData>(["notifications"], (old) => {
        if (!old) return old;
        return {
          ...old,
          notifications: old.notifications.map((n) => ({
            ...n,
            status: "read",
          })),
        };
      });

      return { previous };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.previous)
        queryClient.setQueryData(["notifications"], ctx.previous);
      toast.error("Failed to mark notifications");
    },
    onSuccess: () => toast.success("Marked all as read"),
    onSettled: () =>
      queryClient.invalidateQueries({ queryKey: ["notifications"] }),
  });

  const markSingleAsRead = useMutation({
    mutationFn: async (id: string) => notificationApi.markStatus(id, "read"),
    onMutate: async (id: string) => {
      await queryClient.cancelQueries({ queryKey: ["notifications"] });
      const previous = queryClient.getQueryData<QueryData>(["notifications"]);

      queryClient.setQueryData<QueryData>(["notifications"], (old) => {
        if (!old) return old;
        return {
          ...old,
          notifications: old.notifications.map((n) =>
            n._id === id ? { ...n, status: "read" } : n
          ),
        };
      });

      return { previous };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.previous)
        queryClient.setQueryData(["notifications"], ctx.previous);
      toast.error("Failed to mark as read");
    },
    onSuccess: () => toast.success("Marked as read"),
    onSettled: () =>
      queryClient.invalidateQueries({ queryKey: ["notifications"] }),
  });

  return (
    <div className="container mx-auto py-24">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold flex items-center gap-2">
          Notification
          <span className="inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-700">
            {unreadCount}
          </span>
        </h1>

        <button
          className={cn(
            "text-sm text-gray-500 hover:text-gray-700",
            markAllAsReadMutation.isPending && "opacity-50 cursor-not-allowed"
          )}
          onClick={() => markAllAsReadMutation.mutate()}
          disabled={markAllAsReadMutation.isPending || unreadCount === 0}
        >
          {markAllAsReadMutation.isPending ? "Marking..." : "Mark As Read"}
        </button>
      </div>

      {isLoading && (
        <div className="text-center text-gray-500">
          Loading notifications...
        </div>
      )}

      {isError && (
        <div className="text-center text-red-500">
          Error: {(error as any)?.message ?? "Failed to load notifications"}
        </div>
      )}

      {!isLoading && notifications.length === 0 && !isError && (
        <div className="text-center text-gray-500">No notifications found.</div>
      )}

      <motion.div
        className="space-y-3"
        variants={containerVariants}
        initial={false} // ✅ IMPORTANT: don’t start hidden
        animate="visible"
      >
        {notifications.map((notification) => {
          const isUnread = notification.status === "unread";

          return (
            <motion.div
              key={notification._id}
              className={cn(
                "flex items-center gap-4 p-3 rounded-lg shadow-sm transition-colors duration-200",
                isUnread ? "bg-blue-50" : "bg-white"
              )}
              variants={itemVariants}
            >
              <div className="relative flex-shrink-0 w-10 h-10 bg-gray-200">
                {notification?.data?.image ? (
                  <Image
                    src={notification.data.image}
                    alt={notification.title || "Notification"}
                    fill
                    className="object-cover"
                    sizes="40px"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-500 text-xs"/>
                )}
              </div>

              <div className="flex-grow">
                <p className="text-sm text-gray-800 leading-snug">
                  <span className="font-medium">{notification.title}</span>
                  <span className="text-gray-600">
                    {" "}
                    — {notification.message}
                  </span>
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {formatTime(notification)}
                </p>
              </div>

              {isUnread && (
                <div className="flex items-center gap-2 ml-auto">
                  <button
                    className={cn(
                      "text-xs text-blue-600 hover:text-blue-700 underline",
                      markSingleAsRead.isPending &&
                        "opacity-60 cursor-not-allowed"
                    )}
                    disabled={markSingleAsRead.isPending}
                    onClick={() => markSingleAsRead.mutate(notification._id)}
                  >
                    {markSingleAsRead.isPending ? "Marking..." : "Mark as read"}
                  </button>
                  <span className="flex-shrink-0 w-2 h-2 bg-red-500 rounded-full" />
                </div>
              )}
            </motion.div>
          );
        })}
      </motion.div>
    </div>
  );
}
