"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts"
import { DollarSign, ShoppingCart, Users, TrendingUp } from "lucide-react"
import { useQuery } from "@tanstack/react-query"
import { vendorDashboardApi } from "@/lib/api"

type VendorOverviewRes = {
  totals: {
    totalEarnings: number
    totalOrders: number
    monthlyEarnings: number
    monthlyOrders: number
    pendingOrders: number
    completedOrders: number
    averageOrderValue: number
    totalCustomers: number
    totalProducts: number
    totalCommissionPaid: number
  }
  breakdowns: {
    orderStatus: { status: string; count: number }[]
  }
  lastUpdated: string
}

type VendorOrdersAnalyticsRes = {
  range: { start: string; end: string }
  granularity: string
  totals: { orders: number; amount: number; averageOrderValue: number }
  timeline: { date?: string; label?: string; orders?: number; amount?: number; value?: number }[]
}

const PIE_COLORS = ["#0052CC", "#B8B8FF", "#D4D4D4", "#22c55e", "#f97316", "#ef4444"]

export default function Dashboard() {
  const overviewQuery = useQuery<VendorOverviewRes>({
    queryKey: ["vendor-dashboard-overview"],
    queryFn: async () => {
      const res = await vendorDashboardApi.getOverview()
      return res.data.data
    },
  })

  const analyticsQuery = useQuery<VendorOrdersAnalyticsRes>({
    queryKey: ["vendor-dashboard-orders-analytics"],
    queryFn: async () => {
      const res = await vendorDashboardApi.getOrderAnalytics()
      return res.data.data
    },
  })

  const totals = overviewQuery.data?.totals
  const breakdown = overviewQuery.data?.breakdowns?.orderStatus ?? []

  // ✅ Pie chart from breakdowns.orderStatus
  const analyticsData =
    breakdown.length > 0
      ? breakdown.map((x, idx) => ({
          name: x.status,
          value: x.count,
          color: PIE_COLORS[idx % PIE_COLORS.length],
        }))
      : [{ name: "No Data", value: 1, color: "#D4D4D4" }]

  // ✅ Bar chart from timeline (fallback when empty)
  const orderTimeline =
    (analyticsQuery.data?.timeline ?? []).map((t) => ({
      month: t.label ?? (t.date ? new Date(t.date).toLocaleDateString() : "—"),
      value: t.orders ?? t.value ?? 0,
    })) || []

  const safeOrderTimeline = orderTimeline.length ? orderTimeline : [{ month: "—", value: 0 }]

  // ✅ Line chart: use monthlyEarnings as a single point (until backend provides a timeline)
  const paymentData = [{ month: "This month", value: totals?.monthlyEarnings ?? 0 }]

  return (
    <div className="p-8 space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Welcome to your dashboard</h1>
      </div>

      {/* Stats Cards */}
      <div>
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Dashboard Overview</h2>

        {overviewQuery.isLoading && <div className="text-gray-500">Loading overview...</div>}
        {overviewQuery.isError && <div className="text-red-500">Failed to load overview.</div>}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="bg-gradient-to-br from-blue-100 to-blue-50 border-0">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Total Earning</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {totals ? `$${totals.totalEarnings}` : "—"}
                  </p>
                </div>
                <div className="bg-blue-200 p-3 rounded-lg">
                  <DollarSign className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-blue-600 to-blue-500 border-0">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-blue-100 mb-1">Total Order</p>
                  <p className="text-2xl font-bold text-white">
                    {totals ? totals.totalOrders : "—"}
                  </p>
                </div>
                <div className="bg-blue-400 p-3 rounded-lg">
                  <ShoppingCart className="w-6 h-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-blue-500 to-blue-400 border-0">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-blue-100 mb-1">Total Customers</p>
                  <p className="text-2xl font-bold text-white">
                    {totals ? totals.totalCustomers : "—"}
                  </p>
                </div>
                <div className="bg-blue-300 p-3 rounded-lg">
                  <Users className="w-6 h-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-slate-800 to-slate-700 border-0">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-300 mb-1">Commission Paid</p>
                  <p className="text-2xl font-bold text-white">
                    {totals ? `$${totals.totalCommissionPaid}` : "—"}
                  </p>
                </div>
                <div className="bg-slate-600 p-3 rounded-lg">
                  <TrendingUp className="w-6 h-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Total Payment Volume</CardTitle>
            <CardDescription>
              Last updated:{" "}
              {overviewQuery.data?.lastUpdated
                ? new Date(overviewQuery.data.lastUpdated).toLocaleString()
                : "—"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={paymentData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="month" stroke="#9ca3af" />
                <YAxis stroke="#9ca3af" />
                <Tooltip />
                <Line type="monotone" dataKey="value" stroke="#0052CC" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Analytics</CardTitle>
            <CardDescription>Order status breakdown</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={analyticsData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={2}
                  dataKey="value"
                >
                  {analyticsData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={(entry as any).color} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>

            <div className="mt-4 space-y-2">
              {analyticsData.map((item) => (
                <div key={item.name} className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: (item as any).color }} />
                  <span className="text-sm text-gray-600">
                    {item.name} ({item.value})
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Order Range Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Total Order Range</CardTitle>
          <CardDescription>
            {analyticsQuery.data?.range?.start && analyticsQuery.data?.range?.end
              ? `${new Date(analyticsQuery.data.range.start).toLocaleDateString()} - ${new Date(
                  analyticsQuery.data.range.end
                ).toLocaleDateString()}`
              : "—"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {analyticsQuery.isLoading ? (
            <div className="text-center text-gray-500 py-10">Loading order analytics...</div>
          ) : analyticsQuery.isError ? (
            <div className="text-center text-red-500 py-10">Failed to load order analytics.</div>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={safeOrderTimeline}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="month" stroke="#9ca3af" />
                <YAxis stroke="#9ca3af" />
                <Tooltip />
                <Bar dataKey="value" fill="#0052CC" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      {/* Tables: keep mock for now (until you have endpoints) */}
      {/* You can wire "Recent Customer Info" and "Review Order" once API exists */}
    </div>
  )
}
