"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Search } from "lucide-react"
import { useToast } from "@/components/toast-provider"
import { customerApi } from "@/lib/api"
import { Skeleton } from "@/components/ui/skeleton"

interface Customer {
  _id: string
  name: string
  email: string
  address: string
  totalOrders: number
  moneySpent: number
  lastOrderDate: string
  storeName: string
  storeAddress: string
}

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [loading, setLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const { addToast } = useToast()

  useEffect(() => {
    fetchCustomers()
  }, [currentPage])

  const fetchCustomers = async () => {
    setLoading(true)
    try {
      const response = await customerApi.getAll(currentPage, 10)

      if (response.data.status) {
        setCustomers(response.data.data.customers || [])
        setTotalPages(response.data.data.pagination?.totalPages || 1)
      }
    } catch (error: any) {
      addToast({
        title: error?.response?.data?.message || "Failed to fetch customers",
        type: "error",
      })
    } finally {
      setLoading(false)
    }
  }

  const filteredCustomers = customers.filter(
    (c) =>
      c.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.email?.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Customer List</h1>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Search customers..."
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
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Name</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Email</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Orders</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Spent</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Last Order</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Store</th>
                    </tr>
                  </thead>

                  <tbody>
                    {filteredCustomers.length > 0 ? (
                      filteredCustomers.map((customer) => (
                        <tr key={customer._id} className="border-b hover:bg-gray-50">
                          <td className="py-3 px-4 font-medium">{customer.name}</td>
                          <td className="py-3 px-4">{customer.email}</td>
                          <td className="py-3 px-4">{customer.totalOrders}</td>
                          <td className="py-3 px-4">${customer.moneySpent}</td>
                          <td className="py-3 px-4">
                            {new Date(customer.lastOrderDate).toLocaleDateString()}
                          </td>
                          <td className="py-3 px-4">{customer.storeName}</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={6} className="py-6 text-center text-gray-500">
                          No customers found
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              <div className="flex items-center justify-between mt-6 pt-6 border-t">
                <p className="text-sm text-gray-600">
                  Page {currentPage} of {totalPages}
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1 || loading}
                  >
                    Previous
                  </Button>

                  <Button
                    variant="outline"
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages || loading}
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
