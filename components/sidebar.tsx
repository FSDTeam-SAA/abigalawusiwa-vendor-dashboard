"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import Image from "next/image"
import {
  LayoutDashboard,
  Package,
  Layers,
  ShoppingCart,
  Users,
  Gift,
  TrendingUp,
  Users2,
  Percent,
  Bell,
  LogOut,
  X,
  MessageSquare,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useState } from "react"
import { DeleteModal } from "./delete-modal"
import { signOut } from "next-auth/react"
import { useToast } from "@/components/toast-provider"

const menuItems = [
  { icon: LayoutDashboard, label: "Dashboard", href: "/dashboard" },
  { icon: Package, label: "Product", href: "/dashboard/products" },
  { icon: Layers, label: "Category", href: "/dashboard/categories" },
  { icon: ShoppingCart, label: "Orders", href: "/dashboard/orders" },
  { icon: Users, label: "Customer", href: "/dashboard/customers" },
  { icon: Gift, label: "Save Campaign", href: "/dashboard/saveCampaign" },
  { icon: Gift, label: "Coupons", href: "/dashboard/coupons" },
  { icon: TrendingUp, label: "Earnings", href: "/dashboard/earnings" },
  { icon: Users2, label: "Manage Staff", href: "/dashboard/staff" },
  { icon: Percent, label: "Commission", href: "/dashboard/commission" },
  { icon: MessageSquare, label: "Messages", href: "/dashboard/messages" },
  { icon: Bell, label: "Notifications", href: "/dashboard/notifications" },
  { icon: Bell, label: "Subscribe", href: "/dashboard/subscribe" },
]

export function Sidebar({ open, setOpen }: { open: boolean; setOpen: (open: boolean) => void }) {
  const pathname = usePathname()
  const [showLogoutModal, setShowLogoutModal] = useState(false)
  const router = useRouter()
  const { addToast } = useToast()

  const handleLogout = async () => {
    await signOut({ redirect: false })
    addToast({ title: "Logged out successfully", type: "success" })
    router.push("/auth/login")
    setShowLogoutModal(false)
  }

  return (
    <>
      {open && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setOpen(false)}
        />
      )}

      <aside
        className={cn(
          "fixed lg:static inset-y-0 left-0 z-50 w-56 bg-[#E8F0F8] border-r border-gray-200 flex flex-col transition-transform duration-300 lg:translate-x-0",
          open ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="p-6 border-b border-gray-200 flex items-center justify-between">
          <Link href="/dashboard" className="flex items-center gap-2">
            <Image
              src="/logo.png"
              alt="Mimi Africa"
              width={120}
              height={40}
              className="h-8 w-auto"
            />
          </Link>
          <button onClick={() => setOpen(false)} className="lg:hidden">
            <X className="w-5 h-5" />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto py-4">
          {menuItems.map((item) => {
            const Icon = item.icon

            const isDashboard = item.href === "/dashboard"
            const isActive = isDashboard
              ? pathname === "/dashboard"
              : pathname === item.href || pathname.startsWith(item.href + "/")

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className={cn(
                  "flex items-center gap-3 px-6 py-3 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-blue-600 text-white"
                    : "text-gray-700 hover:bg-gray-100",
                )}
              >
                <Icon className="w-5 h-5" />
                {item.label}
              </Link>
            )
          })}
        </nav>

        <div className="border-t border-gray-200 p-4">
          <button
            onClick={() => setShowLogoutModal(true)}
            className="flex items-center gap-3 w-full px-6 py-3 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors"
          >
            <LogOut className="w-5 h-5" />
            Log Out
          </button>
        </div>
      </aside>

      <DeleteModal
        open={showLogoutModal}
        title="Log Out"
        message="Are you sure you want to log out?"
        onConfirm={handleLogout}
        onCancel={() => setShowLogoutModal(false)}
      />
    </>
  )
}
