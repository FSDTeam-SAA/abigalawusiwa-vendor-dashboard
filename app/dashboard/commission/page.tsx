"use client"

import { useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useQuery } from "@tanstack/react-query"
import { commissionApi } from "@/lib/api"

type Commission = {
  _id: string
  product?: string
  sales?: number
  rate?: number | string
  amount?: number | string
  status?: "Paid" | "Pending" | string
  createdAt?: string
}

type CommissionResponse = {
  commissions: Commission[]
  pagination: {
    currentPage: number
    pageSize: number
    totalItems: number
    totalPages: number
    hasNextPage: boolean
  }
}

export default function CommissionPage() {
  const page = 1
  const limit = 10

  const { data, isLoading, isError, error } = useQuery<CommissionResponse>({
    queryKey: ["my-commissions", page, limit],
    queryFn: async () => {
      const res = await commissionApi.getMy(page, limit)
      return res.data.data // { commissions, pagination }
    },
  })

  const commissions = data?.commissions ?? []
  const pagination = data?.pagination

  const totalProducts = useMemo(() => commissions.length, [commissions])

  const totalCommissions = useMemo(() => {
    const sum = commissions.reduce((acc, c) => {
      const raw = c.amount ?? 0
      const num =
        typeof raw === "number"
          ? raw
          : Number(String(raw).replace(/[^0-9.-]/g, "")) || 0
      return acc + num
    }, 0)
    return sum
  }, [commissions])

  const commissionRate = useMemo(() => {
    const first = commissions.find((c) => c.rate !== undefined)?.rate
    return first ?? "-"
  }, [commissions])

  return (
    <div className="p-8 space-y-6">
      <h1 className="text-3xl font-bold text-gray-900">Commission</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-gray-600 mb-1">Total Products</p>
            <p className="text-2xl font-bold text-gray-900">
              {isLoading ? "—" : totalProducts}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-gray-600 mb-1">Total Commissions</p>
            <p className="text-2xl font-bold text-gray-900">
              {isLoading ? "—" : `$${totalCommissions.toFixed(2)}`}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-gray-600 mb-1">Commission Rate</p>
            <p className="text-2xl font-bold text-gray-900">
              {isLoading
                ? "—"
                : typeof commissionRate === "number"
                ? `${commissionRate}%`
                : String(commissionRate)}
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Commission Details</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading && (
            <div className="text-center text-gray-500 py-10">
              Loading commissions...
            </div>
          )}

          {isError && (
            <div className="text-center text-red-500 py-10">
              Error: {(error as any)?.message ?? "Failed to load commissions"}
            </div>
          )}

          {!isLoading && !isError && commissions.length === 0 && (
            <div className="text-center text-gray-500 py-10">
              No commissions found.
            </div>
          )}

          {!isLoading && !isError && commissions.length > 0 && (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">
                      Product
                    </th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">
                      Sales
                    </th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">
                      Rate
                    </th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">
                      Amount
                    </th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {commissions.map((commission) => (
                    <tr
                      key={commission._id}
                      className="border-b hover:bg-gray-50"
                    >
                      <td className="py-3 px-4 text-gray-900 font-medium">
                        {commission.product ?? "—"}
                      </td>
                      <td className="py-3 px-4 text-gray-600">
                        {commission.sales ?? "—"}
                      </td>
                      <td className="py-3 px-4 text-gray-600">
                        {commission.rate ?? "—"}
                      </td>
                      <td className="py-3 px-4 text-gray-900 font-semibold">
                        {commission.amount ?? "—"}
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-medium ${
                            commission.status === "Paid"
                              ? "bg-green-100 text-green-700"
                              : "bg-yellow-100 text-yellow-700"
                          }`}
                        >
                          {commission.status ?? "Pending"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Optional: show pagination info */}
          {!isLoading && !isError && pagination && (
            <div className="mt-4 text-xs text-gray-500">
              Page {pagination.currentPage} of {pagination.totalPages} — Total{" "}
              {pagination.totalItems}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
