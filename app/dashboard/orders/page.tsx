"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Search, FileText, Box, Truck, Package, Check } from "lucide-react"
import { useToast } from "@/components/toast-provider"
import { orderApi } from "@/lib/api"
import { Skeleton } from "@/components/ui/skeleton"
import { useSession } from "next-auth/react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"

interface Order {
  _id: string
  productTitle: string
  customerName: string
  totalAmount: number
  status: string
  createdAt: string
}

// Timeline steps
const shippingSteps = [
  { key: "items_discounted", label: "Items Discounted" },
  { key: "in_progress", label: "In Progress" },
  { key: "shipped", label: "Shipped" },
  { key: "delivered", label: "Delivered" },
]

// Icons for right side of each step
const shippingIcons = [FileText, Box, Truck, Package]

// Map backend statuses to step index in the timeline
const statusToStepIndex: Record<string, number> = {
  "items discounted": 0,
  discounted: 0,
  "in progress": 1,
  processing: 1,
  pending: 1,
  shipped: 2,
  "out for delivery": 2,
  delivered: 3,
  completed: 3,
}

const getCurrentStepIndex = (status?: string) => {
  if (!status) return 0
  const normalized = status.toLowerCase()
  return statusToStepIndex[normalized] ?? 0
}

const formatFullDate = (dateStr?: string) => {
  if (!dateStr) return ""
  return new Date(dateStr).toLocaleDateString(undefined, {
    day: "2-digit",
    month: "long",
    year: "numeric",
  })
}

const STATUS_OPTIONS = [
  "items discounted",
  "in progress",
  "shipped",
  "delivered",
]

export default function OrdersPage() {
  const { addToast } = useToast()
  const { data: session } = useSession()

  const [orders, setOrders] = useState<Order[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [filterStatus] = useState("all") // kept for future filter use
  const [loading, setLoading] = useState(true)

  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  // shipping modal state
  const [shippingModalOpen, setShippingModalOpen] = useState(false)
  const [activeOrder, setActiveOrder] = useState<Order | null>(null)

  // dropdown updating indicator
  const [updatingStatusId, setUpdatingStatusId] = useState<string | null>(null)

  // ----------------------------------------
  // 🔥 FETCH ORDERS
  // ----------------------------------------
  const fetchOrders = async () => {
    try {
      setLoading(true)

      const res = await orderApi.getAll(currentPage, 10)

      const rawOrders = res.data.data.orders
      const pagination = res.data.data.pagination

      const mappedOrders = rawOrders.map((o: any) => ({
        _id: o._id,
        productTitle: o.productDetails?.title || "N/A",
        customerName: o.buyer?.name || "N/A",
        createdAt: o.createdAt,
        totalAmount: o.amount,
        status: o.orderStatus,
      }))

      setOrders(mappedOrders)
      setTotalPages(pagination?.totalPages || 1)
    } catch (err: any) {
      addToast({
        type: "error",
        message: err?.response?.data?.message || "Failed to load orders",
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!session) return
    fetchOrders()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session, currentPage])

  // ----------------------------------------
  // 🔁 UPDATE STATUS (select + PATCH)
  // ----------------------------------------
  const handleStatusChange = async (id: string, newStatus: string) => {
    const prevOrders = [...orders]
    setUpdatingStatusId(id)

    // optimistic UI update
    setOrders((prev) =>
      prev.map((o) => (o._id === id ? { ...o, status: newStatus } : o)),
    )

    try {
      const res = await orderApi.updateStatus(id, newStatus)

      if (!res.data?.success && !res.data?.status) {
        // depending on your response format
        throw new Error(res.data?.message || "Failed to update status")
      }

      addToast({
        type: "success",
        message: "Order status updated successfully",
      })
    } catch (error: any) {
      // revert on error
      setOrders(prevOrders)
      addToast({
        type: "error",
        message: error?.response?.data?.message || "Failed to update status",
      })
    } finally {
      setUpdatingStatusId(null)
    }
  }

  // ----------------------------------------
  // 🔍 FILTERING
  // ----------------------------------------
  const filteredOrders = orders.filter((order) => {
    const search = searchTerm.toLowerCase()

    const matchesSearch =
      order.productTitle.toLowerCase().includes(search) ||
      order.customerName.toLowerCase().includes(search)

    const matchesStatus =
      filterStatus === "all" ||
      order.status.toLowerCase() === filterStatus.toLowerCase()

    return matchesSearch && matchesStatus
  })

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case "completed":
      case "paid":
      case "delivered":
        return "bg-green-100 text-green-700"
      case "pending":
      case "in progress":
      case "processing":
        return "bg-yellow-100 text-yellow-700"
      case "accepted":
      case "shipped":
        return "bg-blue-100 text-blue-700"
      case "cancelled":
      case "rejected":
        return "bg-red-100 text-red-700"
      default:
        return "bg-gray-100 text-gray-700"
    }
  }

  const openShippingModal = (order: Order) => {
    setActiveOrder(order)
    setShippingModalOpen(true)
  }

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Orders</h1>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Search orders..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-white"
              />
            </div>
          </div>
        </CardHeader>

        <CardContent>
          {loading ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : (
            <>
              {/* TABLE */}
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-4">Product</th>
                      <th className="text-left py-3 px-4">Customer</th>
                      <th className="text-left py-3 px-4">Date</th>
                      <th className="text-left py-3 px-4">Amount</th>
                      <th className="text-left py-3 px-4">Status</th>
                      <th className="text-left py-3 px-4">Shipping</th>
                    </tr>
                  </thead>

                  <tbody>
                    {filteredOrders.length > 0 ? (
                      filteredOrders.map((order) => (
                        <tr key={order._id} className="border-b hover:bg-gray-50">
                          <td className="py-3 px-4">{order.productTitle}</td>
                          <td className="py-3 px-4 text-gray-600">{order.customerName}</td>
                          <td className="py-3 px-4 text-gray-600">
                            {new Date(order.createdAt).toLocaleDateString()}
                          </td>
                          <td className="py-3 px-4 font-semibold">
                            ${order.totalAmount}
                          </td>
                          <td className="py-3 px-4">
                            <span
                              className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(
                                order.status
                              )}`}
                            >
                              {order.status}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <select
                              value={order.status.toLowerCase()}
                              onChange={(e) =>
                                handleStatusChange(order._id, e.target.value)
                              }
                              disabled={updatingStatusId === order._id}
                              className={`px-3 py-1 rounded-full text-xs font-medium border bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 ${getStatusColor(
                                order.status,
                              )}`}
                            >
                              {STATUS_OPTIONS.map((status) => (
                                <option key={status} value={status}>
                                  {status.charAt(0).toUpperCase() + status.slice(1)}
                                </option>
                              ))}
                            </select>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={6} className="py-6 text-center text-gray-500">
                          No orders found
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* PAGINATION */}
              <div className="flex items-center justify-between mt-6 pt-6 border-t">
                <p className="text-sm text-gray-600">
                  Page {currentPage} of {totalPages}
                </p>

                <div className="flex gap-2">
                  <Button
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    variant="outline"
                  >
                    Previous
                  </Button>

                  <Button
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    variant="outline"
                  >
                    Next
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

    </div>
  )
}
