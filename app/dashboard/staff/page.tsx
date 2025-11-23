"use client"

import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Plus, Edit2, Trash2, Search } from "lucide-react"
import { useToast } from "@/components/toast-provider"
import { DeleteModal } from "@/components/delete-modal"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"

interface StaffMember {
  _id: string
  name: string
  email: string
  role: string
  phone: string
  isActive: boolean
  photo?: string
}

const API_BASE_URL =
  process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:5000"

export default function StaffPage() {
  const { data: session, status } = useSession()
  const storeId = (session?.user as any)?.storeId
  const accessToken = (session?.user as any)?.accessToken // adjust if your token key is different

  const [staff, setStaff] = useState<StaffMember[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [editingId, setEditingId] = useState<string | null>(null)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    role: "Staff",
    phone: "",
    status: "Active" as "Active" | "Inactive",
  })
  const [loading, setLoading] = useState(false)

  const [deleteTarget, setDeleteTarget] = useState<StaffMember | null>(null)
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)

  const { addToast } = useToast()

  const filteredStaff = staff.filter(
    (s) =>
      s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.email.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const resetForm = () => {
    setFormData({
      name: "",
      email: "",
      role: "Staff",
      phone: "",
      status: "Active",
    })
    setEditingId(null)
  }

  // Fetch staff list from backend
  const fetchStaff = async () => {
    if (!storeId) return
    try {
      setLoading(true)
      const res = await fetch(`${API_BASE_URL}/store/${storeId}/staff`, {
        headers: {
          "Content-Type": "application/json",
          ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
        },
      })
      const json = await res.json()

      if (!json.status) {
        throw new Error(json.message || "Failed to fetch staff")
      }

      setStaff(json.data || [])
    } catch (err: any) {
      addToast({ title: err.message || "Failed to fetch staff", type: "error" })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (status === "authenticated" && storeId) {
      fetchStaff()
    }
  }, [status, storeId])

  const handleAddOrUpdateStaff = async () => {
    if (!formData.name || !formData.email || !formData.phone) {
      addToast({ title: "Please fill all fields", type: "error" })
      return
    }

    if (!storeId) {
      addToast({ title: "Store ID not found in session", type: "error" })
      return
    }

    const payload = {
      name: formData.name,
      email: formData.email,
      phone: formData.phone,
      role: formData.role,
      isActive: formData.status === "Active",
    }

    const isEdit = editingId !== null

    try {
      setLoading(true)

      const url = isEdit
        ? `${API_BASE_URL}/store/${storeId}/staff/${editingId}`
        : `${API_BASE_URL}/store/${storeId}/staff`

      const res = await fetch(url, {
        method: isEdit ? "PUT" : "POST",
        headers: {
          "Content-Type": "application/json",
          ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
        },
        body: JSON.stringify(payload),
      })

      const json = await res.json()
      if (!json.status) {
        throw new Error(json.message || "Something went wrong")
      }

      addToast({
        title: isEdit ? "Staff member updated successfully" : "Staff member added successfully",
        type: "success",
      })

      resetForm()
      setIsFormOpen(false)
      await fetchStaff()
    } catch (err: any) {
      addToast({ title: err.message || "Failed to save staff", type: "error" })
    } finally {
      setLoading(false)
    }
  }

  const openCreateModal = () => {
    resetForm()
    setIsFormOpen(true)
  }

  const handleEdit = (member: StaffMember) => {
    setFormData({
      name: member.name,
      email: member.email,
      role: member.role,
      phone: member.phone,
      status: member.isActive ? "Active" : "Inactive",
    })
    setEditingId(member._id)
    setIsFormOpen(true)
  }

  const handleDeleteClick = (member: StaffMember) => {
    setDeleteTarget(member)
    setDeleteModalOpen(true)
  }

  const handleConfirmDelete = async () => {
    if (!storeId || !deleteTarget?._id) return

    try {
      setLoading(true)

      const res = await fetch(
        `${API_BASE_URL}/store/${storeId}/staff/${deleteTarget._id}`,
        {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
            ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
          },
        }
      )

      const json = await res.json()
      if (!json.status) {
        throw new Error(json.message || "Failed to delete staff")
      }

      addToast({ title: "Staff member deleted successfully", type: "success" })
      setStaff((prev) => prev.filter((s) => s._id !== deleteTarget._id))
      setDeleteTarget(null)
      setDeleteModalOpen(false)
    } catch (err: any) {
      addToast({ title: err.message || "Failed to delete staff", type: "error" })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Manage Staff</h1>
        <Button onClick={openCreateModal} className="bg-blue-600 hover:bg-blue-700">
          <Plus className="w-4 h-4 mr-2" />
          Add Staff
        </Button>
      </div>

      {status === "authenticated" && !storeId && (
        <p className="text-sm text-red-600">
          No store associated with this account. Please contact support.
        </p>
      )}

      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Search staff..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-white"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading && staff.length === 0 ? (
            <p className="text-sm text-gray-500">Loading staff...</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Name</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Email</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Role</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Phone</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Status</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredStaff.map((member) => (
                    <tr key={member._id} className="border-b hover:bg-gray-50">
                      <td className="py-3 px-4 text-gray-900 font-medium">{member.name}</td>
                      <td className="py-3 px-4 text-gray-600">{member.email}</td>
                      <td className="py-3 px-4 text-gray-600">{member.role}</td>
                      <td className="py-3 px-4 text-gray-600">{member.phone}</td>
                      <td className="py-3 px-4">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-medium ${
                            member.isActive
                              ? "bg-green-100 text-green-700"
                              : "bg-gray-100 text-gray-700"
                          }`}
                        >
                          {member.isActive ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleEdit(member)}
                            className="p-1 hover:bg-gray-200 rounded"
                          >
                            <Edit2 className="w-4 h-4 text-blue-600" />
                          </button>
                          <button
                            onClick={() => handleDeleteClick(member)}
                            className="p-1 hover:bg-gray-200 rounded"
                          >
                            <Trash2 className="w-4 h-4 text-red-600" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}

                  {filteredStaff.length === 0 && !loading && (
                    <tr>
                      <td colSpan={6} className="py-4 px-4 text-center text-sm text-gray-500">
                        No staff found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add/Edit Staff Modal */}
      <Dialog
        open={isFormOpen}
        onOpenChange={(open) => {
          setIsFormOpen(open)
          if (!open) resetForm()
        }}
      >
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingId ? "Edit Staff Member" : "Add New Staff"}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4 mb-2">
              <Input
                placeholder="Full Name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="bg-white"
              />
              <Input
                placeholder="Email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="bg-white"
              />
              <Input
                placeholder="Phone"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="bg-white"
              />
              <select
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                className="px-3 py-2 border border-gray-300 rounded-lg bg-white"
              >
                <option>Staff</option>
                <option>Manager</option>
                <option>Supervisor</option>
                <option>Admin</option>
              </select>
              <select
                value={formData.status}
                onChange={(e) =>
                  setFormData({ ...formData, status: e.target.value as "Active" | "Inactive" })
                }
                className="px-3 py-2 border border-gray-300 rounded-lg bg-white col-span-2"
              >
                <option>Active</option>
                <option>Inactive</option>
              </select>
            </div>

            <DialogFooter className="flex gap-2">
              <Button
                onClick={handleAddOrUpdateStaff}
                className="flex-1 bg-blue-600 hover:bg-blue-700"
                disabled={loading}
              >
                {editingId ? "Update" : "Add"} Staff
              </Button>
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={() => {
                  setIsFormOpen(false)
                  resetForm()
                }}
              >
                Cancel
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation modal */}
      <DeleteModal
        open={deleteModalOpen}
        title="Delete Staff Member"
        message={`Are you sure you want to delete "${deleteTarget?.name}"? This action cannot be undone.`}
        onConfirm={handleConfirmDelete}
        onCancel={() => {
          setDeleteModalOpen(false)
          setDeleteTarget(null)
        }}
        loading={loading}
      />
    </div>
  )
}
