import axios, { AxiosInstance } from "axios";
import { getSession } from "next-auth/react";

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3001";

let apiInstance: AxiosInstance;

export type NotificationStatus = "read" | "unread";

export type Notification = {
  _id: string;
  recipient: string;
  title: string;
  message: string;
  type?: string;
  entityType?: string;
  entityId?: string;
  data?: Record<string, any>;
  status: NotificationStatus;
  sentAt: string;
  createdAt?: string;
  updatedAt?: string;
};

export type NotificationsResponse = {
  notifications: Notification[];
  pagination?: {
    currentPage: number;
    pageSize: number;
    totalItems: number;
    totalPages: number;
    hasNextPage: boolean;
  };
};

export type CampaignStatus = "ACTIVE" | "INACTIVE" | "EXPIRED";
export type DiscountType = "PERCENT" | "FIXED";

export const initializeApi = () => {
  apiInstance = axios.create({
    baseURL: BASE_URL,
    headers: {
      "Content-Type": "application/json",
    },
  });

  // 🔥 Attach Access Token from NextAuth
  apiInstance.interceptors.request.use(async (config) => {
    const session = await getSession();
    const token = session?.user?.accessToken;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  });

  // 🔥 Auto-logout on 401
  apiInstance.interceptors.response.use(
    (response) => response,
    (error) => {
      if (error.response?.status === 401) {
        if (typeof window !== "undefined") {
          window.location.href = "/auth/login";
        }
      }
      return Promise.reject(error);
    }
  );

  return apiInstance;
};

export const getApi = () => {
  if (!apiInstance) initializeApi();
  return apiInstance;
};

// 🔐 AUTH APIs
export const authApi = {
  login: (email: string, password: string) =>
    getApi().post("/auth/login", { email, password }),
  forgotPassword: (email: string) =>
    getApi().post("/auth/forget-password", { email }),
  verifyCode: (email: string, otp: string) =>
    getApi().post("/auth/verify-code", { email, otp }),
  resetPassword: (email: string, newPassword: string) =>
    getApi().post("/auth/reset-password", { email, newPassword }),
  changePassword: (oldPassword: string, newPassword: string) =>
    getApi().post("/user/change-password", { oldPassword, newPassword }),
};

// 📦 PRODUCT APIs
export const productApi = {
  getAll: (storeId?: string, mainCategory?: string, page = 1, limit = 10) => {
    const params = new URLSearchParams();
    if (storeId) params.append("storeId", storeId);
    if (mainCategory) params.append("mainCategory", mainCategory);
    params.append("page", page.toString());
    params.append("limit", limit.toString());
    return getApi().get(`/vendor/get-all-products?${params.toString()}`);
  },
  getById: (id: string) => getApi().get(`/product/${id}`),
  create: (data: FormData) =>
    getApi().post("/product", data, {
      headers: { "Content-Type": "multipart/form-data" },
    }),
  update: (id: string, data: FormData) =>
    getApi().put(`/product/${id}`, data, {
      headers: { "Content-Type": "multipart/form-data" },
    }),
  delete: (id: string) => getApi().delete(`/product/${id}`),
};

// 📂 CATEGORY APIs
export const categoryApi = {
  getAll: (page = 1, limit = 10) =>
    getApi().get(`/category?page=${page}&limit=${limit}`),
};

// ✅ Add this INSIDE your existing api.ts (bottom or near other exports)

export const bigSaveCampaignApi = {
  // POST /vendor/big-save-campaign
  create: (data: {
    name?: string;
    discountType: DiscountType;
    discountValue: number;
    startAt: string;
    endAt: string;
    status?: CampaignStatus;
    productIds?: string[];
  }) => getApi().post("/vendor/big-save-campaigns", data),

  // GET /vendor/big-save-campaign?page=&limit=&status=
  getAll: (page = 1, limit = 10, status?: CampaignStatus) => {
    const params = new URLSearchParams();
    params.append("page", page.toString());
    params.append("limit", limit.toString());
    if (status) params.append("status", status);
    return getApi().get(`/vendor/big-save-campaigns?${params.toString()}`);
  },

  // GET /vendor/big-save-campaign/:campaignId
  getById: (campaignId: string) =>
    getApi().get(`/vendor/big-save-campaigns/${campaignId}`),

  // PATCH /vendor/big-save-campaign/:campaignId
  update: (
    campaignId: string,
    data: Partial<{
      name: string;
      discountType: DiscountType;
      discountValue: number;
      startAt: string;
      endAt: string;
      status: CampaignStatus;
    }>
  ) => getApi().patch(`//vendor/big-save-campaigns/${campaignId}`, data),

  // DELETE /vendor/big-save-campaign/:campaignId
  delete: (campaignId: string) =>
    getApi().delete(`/vendor/big-save-campaigns/${campaignId}`),
  // GET /vendor/big-save-campaign/active/products
  getActiveProducts: () =>
    getApi().get("/vendor/big-save-campaigns/active/products"),

  // POST /vendor/big-save-campaign/:campaignId/products
  attachProducts: (campaignId: string, productIds: string[] | string) =>
    getApi().post(`/vendor/big-save-campaigns/${campaignId}/products`, {
      productIds,
    }),

  // DELETE /vendor/big-save-campaign/:campaignId/products/:productId
  removeProduct: (campaignId: string, productId: string) =>
    getApi().delete(
      `/vendor/big-save-campaigns/${campaignId}/products/${productId}`
    ),
};

// 🧾 ORDER APIs
export const orderApi = {
  getAll: (page = 1, limit = 10) =>
    getApi().get(`/vendor/orders?page=${page}&limit=${limit}`),

  // adjust the URL if your route is different
  updateStatus: (id: string, orderStatus: string) =>
    getApi().patch(`/vendor/${id}/status`, { orderStatus }),
};

// 👥 CUSTOMER APIs
export const customerApi = {
  getAll: (page = 1, limit = 10) =>
    getApi().get(`/vendor/customers?page=${page}&limit=${limit}`),
};

// 🎟 COUPON APIs
export const couponApi = {
  getAll: (page = 1, limit = 10) =>
    getApi().get(`/promocode?page=${page}&limit=${limit}`),

  getById: (id: string) => getApi().get(`/promocode/${id}`),

  create: (data: any) => {
    // ✅ If FormData, send multipart
    if (data instanceof FormData) {
      return getApi().post("/promocode", data, {
        headers: { "Content-Type": "multipart/form-data" },
      });
    }
    // fallback JSON
    return getApi().post("/promocode", data);
  },

  update: (id: string, data: any) => {
    // ✅ If FormData, send multipart
    if (data instanceof FormData) {
      return getApi().put(`/promocode/${id}`, data, {
        headers: { "Content-Type": "multipart/form-data" },
      });
    }
    // fallback JSON
    return getApi().put(`/promocode/${id}`, data);
  },

  delete: (id: string) => getApi().delete(`/promocode/${id}`),
};

export const erningApi = {
  getEarnings: () => getApi().get("/vendor/earnings"),
};

// 💳 Subscription APIs
export const subscriptionApi = {
  getAll: () => getApi().get("/subscription/get-all"),
};

// 👤 Account / Profile APIs
export const accountApi = {
  // Basic profile
  getAccountDetails: (userId: string) => getApi().get(`/user/${userId}`),

  updateAccountDetails: (userId: string, data: FormData) =>
    getApi().put(`/user/${userId}`, data, {
      headers: { "Content-Type": "multipart/form-data" },
    }),

  // Avatar
  getAvatar: (userId: string) => getApi().get(`/user/upload-avatar/${userId}`),
  uploadAvatar: (userId: string, data: FormData) =>
    getApi().put(`/user/upload-avatar/${userId}`, data, {
      headers: { "Content-Type": "multipart/form-data" },
    }),
  // ⭐ NEW: upload store logo using storeId
  uploadStoreLogo: (storeId: string, data: FormData) =>
    getApi().put(`/vendor/store/${storeId}/upload-logo`, data, {
      headers: { "Content-Type": "multipart/form-data" },
    }),
};

/// get all admin APIs
export const adminApi = {
  getAllAdmins: (page = 1, limit = 10) =>
    getApi().get(`/user/all-admins?page=${page}&limit=${limit}`),
};

// Chat APIs
export const chatApi = {
  startConversation: (storeId: string) =>
    getApi().post("/chat/conversations", { storeId }),

  getInbox: () => getApi().get("/chat/inbox"),

  getMessages: (conversationId: string) =>
    getApi().get(`/chat/conversations/${conversationId}/messages`),

  sendMessage: (conversationId: string, text: string, files?: File[]) => {
    const formData = new FormData();
    formData.append("text", text);
    if (files) {
      files.forEach((file) => formData.append("chatFile", file));
    }
    return getApi().post(
      `/chat/conversations/${conversationId}/messages`,
      formData,
      {
        headers: { "Content-Type": "multipart/form-data" },
      }
    );
  },

  deleteConversations: (conversationIds: string[]) =>
    getApi().delete("/chat/conversations", { data: { conversationIds } }),

  markAsRead: (conversationIds: string[]) =>
    getApi().patch("/chat/conversations/read", { conversationIds }),
};

export const vendorDashboardApi = {
  getOverview: () => getApi().get("/vendor/dashboard/overview"),
  getOrderAnalytics: () => getApi().get("/vendor/dashboard/analytics/orders"),
};

// 💰 COMMISSION APIs
export const commissionApi = {
  // GET /commissions/my?page=&limit=
  getMy: (page = 1, limit = 10) =>
    getApi().get(`/commissions/my?page=${page}&limit=${limit}`),
};

export const notificationApi = {
  // GET /v1/notifications
  getMyNotifications: () => getApi().get("/notifications"),

  // PATCH /v1/notifications/mark-all
  markAllRead: () => getApi().patch("/notifications/mark-all"),

  // PATCH /v1/notifications/:id/status
  markStatus: (id: string, status: NotificationStatus) =>
    getApi().patch(`/notifications/${id}/status`, { status }),
};
