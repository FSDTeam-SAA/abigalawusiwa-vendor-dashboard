"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Plus, Edit2, Trash2, Search } from "lucide-react"
import { useToast } from "@/components/toast-provider"
import { couponApi } from "@/lib/api"
import { DeleteModal } from "@/components/delete-modal"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"

interface Coupon {
  _id: string
  code: string
  discountType: "percentage" | "fixed"
  discountValue: number
  expiryDate: string
  usageLimit: number
  usedCount: number
  active: boolean
}

export default function CouponsPage() {
  const [coupons, setCoupons] = useState<Coupon[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [formData, setFormData] = useState({
    code: "",
    discountType: "percentage" as const,
    discountValue: "",
    expiryDate: "",
    usageLimit: "",
  })
  const { addToast } = useToast()

  useEffect(() => {
    fetchCoupons()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage])

  const resetForm = () => {
    setFormData({
      code: "",
      discountType: "percentage",
      discountValue: "",
      expiryDate: "",
      usageLimit: "",
    })
    setEditingId(null)
  }

  const fetchCoupons = async () => {
    setLoading(true)
    try {
      const response = await couponApi.getAll(currentPage, 10)
      if (response.data.status) {
        setCoupons(response.data.data.data || [])
        setTotalPages(response.data.data.pagination?.totalPages || 1)
      }
    } catch (error: any) {
      addToast({
        title: error?.response?.data?.message || "Failed to fetch coupons",
        type: "error",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleAddCoupon = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.code || !formData.discountValue || !formData.expiryDate) {
      addToast({ title: "Please fill all fields", type: "error" })
      return
    }

    setLoading(true)

    try {
      const payload = {
        code: formData.code.toUpperCase(),
        discountType: formData.discountType,
        discountValue: Number(formData.discountValue),
        expiryDate: new Date(formData.expiryDate).toISOString(),
        usageLimit: Number(formData.usageLimit) || 100,
        active: true,
      }

      if (editingId) {
        await couponApi.update(editingId, payload)
        addToast({ title: "Coupon updated successfully", type: "success" })
      } else {
        await couponApi.create(payload)
        addToast({ title: "Coupon created successfully", type: "success" })
      }

      resetForm()
      setIsFormOpen(false)
      fetchCoupons()
    } catch (error: any) {
      addToast({
        title: error?.response?.data?.message || "Failed to save coupon",
        type: "error",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!deleteId) return
    setDeleting(true)

    try {
      await couponApi.delete(deleteId)
      addToast({ title: "Coupon deleted successfully", type: "success" })
      setDeleteId(null)
      fetchCoupons()
    } catch (error: any) {
      addToast({
        title: error?.response?.data?.message || "Failed to delete coupon",
        type: "error",
      })
    } finally {
      setDeleting(false)
    }
  }

  const handleEdit = (coupon: Coupon) => {
    setFormData({
      code: coupon.code,
      discountType: coupon.discountType,
      discountValue: coupon.discountValue.toString(),
      expiryDate: new Date(coupon.expiryDate).toISOString().split("T")[0],
      usageLimit: coupon.usageLimit.toString(),
    })
    setEditingId(coupon._id)
    setIsFormOpen(true)
  }

  const filteredCoupons = coupons.filter((c) => c.code.toLowerCase().includes(searchTerm.toLowerCase()))

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Coupons & Offers</h1>
        <Button
          onClick={() => {
            resetForm()
            setIsFormOpen(true)
          }}
          className="bg-blue-600 hover:bg-blue-700"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Coupon
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Search coupons..."
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
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Coupon Code</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Discount</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Usage</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Expiry</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Status</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredCoupons.length > 0 ? (
                      filteredCoupons.map((coupon) => (
                        <tr key={coupon._id} className="border-b hover:bg-gray-50">
                          <td className="py-3 px-4 text-gray-900 font-medium">{coupon.code}</td>
                          <td className="py-3 px-4 text-gray-600">
                            {coupon.discountValue}
                            {coupon.discountType === "percentage" ? "%" : "$"}
                          </td>
                          <td className="py-3 px-4 text-gray-600">
                            {coupon.usedCount}/{coupon.usageLimit}
                          </td>
                          <td className="py-3 px-4 text-gray-600">
                            {new Date(coupon.expiryDate).toLocaleDateString()}
                          </td>
                          <td className="py-3 px-4">
                            <span
                              className={`px-3 py-1 rounded-full text-xs font-medium ${
                                coupon.active ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                              }`}
                            >
                              {coupon.active ? "Active" : "Inactive"}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => handleEdit(coupon)}
                                disabled={loading}
                                className="p-1 hover:bg-gray-200 rounded"
                              >
                                <Edit2 className="w-4 h-4 text-blue-600" />
                              </button>
                              <button
                                onClick={() => setDeleteId(coupon._id)}
                                disabled={loading}
                                className="p-1 hover:bg-gray-200 rounded"
                              >
                                <Trash2 className="w-4 h-4 text-red-600" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={6} className="py-6 text-center text-gray-500">
                          No coupons found
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
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1 || loading}
                    variant="outline"
                  >
                    Previous
                  </Button>
                  <Button
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages || loading}
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

      {/* Add / Edit Coupon Modal */}
      <Dialog
        open={isFormOpen}
        onOpenChange={(open) => {
          setIsFormOpen(open)
          if (!open) resetForm()
        }}
      >
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingId ? "Edit Coupon" : "Add New Coupon"}</DialogTitle>
          </DialogHeader>

          <form onSubmit={handleAddCoupon} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Coupon Code</label>
                <Input
                  placeholder="SUMMER20"
                  value={formData.code}
                  onChange={(e) =>
                    setFormData({ ...formData, code: e.target.value.toUpperCase() })
                  }
                  className="bg-white"
                  disabled={loading}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Discount Type</label>
                <select
                  value={formData.discountType}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      discountType: e.target.value as "percentage" | "fixed",
                    })
                  }
                  className="px-3 py-2 border border-gray-300 rounded-lg bg-white w-full"
                  disabled={loading}
                >
                  <option value="percentage">Percentage (%)</option>
                  <option value="fixed">Fixed ($)</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Discount Value</label>
                <Input
                  placeholder="20"
                  type="number"
                  value={formData.discountValue}
                  onChange={(e) =>
                    setFormData({ ...formData, discountValue: e.target.value })
                  }
                  className="bg-white"
                  disabled={loading}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Expiry Date</label>
                <Input
                  type="date"
                  value={formData.expiryDate}
                  onChange={(e) =>
                    setFormData({ ...formData, expiryDate: e.target.value })
                  }
                  className="bg-white"
                  disabled={loading}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Usage Limit</label>
                <Input
                  placeholder="100"
                  type="number"
                  value={formData.usageLimit}
                  onChange={(e) =>
                    setFormData({ ...formData, usageLimit: e.target.value })
                  }
                  className="bg-white"
                  disabled={loading}
                />
              </div>
            </div>

            <DialogFooter className="flex gap-2">
              <Button
                type="submit"
                disabled={loading}
                className="flex-1 bg-blue-600 hover:bg-blue-700"
              >
                {loading ? "Saving..." : editingId ? "Update" : "Add"} Coupon
              </Button>
              <Button
                type="button"
                onClick={() => setIsFormOpen(false)}
                variant="outline"
                className="flex-1"
                disabled={loading}
              >
                Cancel
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <DeleteModal
        open={!!deleteId}
        title="Delete Coupon"
        message="Are you sure you want to delete this coupon? This action cannot be undone."
        onConfirm={handleDelete}
        onCancel={() => setDeleteId(null)}
        loading={deleting}
      />
    </div>
  )
}
