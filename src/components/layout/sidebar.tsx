"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { signOut } from "next-auth/react"
import { useState } from "react"
import {
  LayoutDashboard, FileText, CheckSquare, BookTemplate, BarChart3,
  Zap, LogOut, Menu, Settings,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Button, buttonVariants } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"

const BASE_NAV = [
  { href: "/dashboard",              label: "Dashboard",    icon: LayoutDashboard, exact: true },
  { href: "/dashboard/requisitions", label: "Requisitions", icon: FileText },
  { href: "/dashboard/approvals",    label: "Approvals",    icon: CheckSquare },
  { href: "/dashboard/templates",    label: "Templates",    icon: BookTemplate },
  { href: "/dashboard/analytics",    label: "Analytics",    icon: BarChart3 },
]

const ADMIN_NAV = [
  { href: "/dashboard/settings", label: "Settings", icon: Settings, exact: false },
]

export interface SidebarUser { name: string; email: string; role: string }

function NavContent({ user, onNav }: { user: SidebarUser; onNav?: () => void }) {
  const pathname = usePathname()

  return (
    <div className="flex h-full flex-col">
      {/* Logo */}
      <div className="flex items-center gap-2.5 px-4 py-4 border-b">
        <div className="w-7 h-7 bg-indigo-600 rounded-md flex items-center justify-center shrink-0">
          <Zap className="w-4 h-4 text-white" />
        </div>
        <span className="font-bold text-gray-900">JDFlow</span>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5">
        {[...BASE_NAV, ...(["ADMIN", "HR"].includes(user.role) ? ADMIN_NAV : [])].map(({ href, label, icon: Icon, exact }) => {
          const active = exact ? pathname === href : pathname.startsWith(href)
          return (
            <Link
              key={href}
              href={href}
              onClick={onNav}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                active
                  ? "bg-indigo-50 text-indigo-700"
                  : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
              )}
            >
              <Icon className={cn("w-4 h-4 shrink-0", active ? "text-indigo-600" : "text-gray-400")} />
              {label}
            </Link>
          )
        })}
      </nav>

      {/* User */}
      <div className="border-t px-3 py-3 space-y-1">
        <div className="flex items-center gap-3 px-1 py-1">
          <Avatar className="w-8 h-8 shrink-0">
            <AvatarFallback className="bg-indigo-100 text-indigo-700 text-xs font-bold">
              {user.name.split(" ").map(n => n[0]).join("")}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">{user.name}</p>
            <p className="text-xs text-gray-500 capitalize truncate">
              {user.role.replace(/_/g, " ").toLowerCase()}
            </p>
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start text-gray-600 hover:text-red-600"
          onClick={() => signOut({ callbackUrl: "/login" })}
        >
          <LogOut className="w-4 h-4 mr-2" />
          Sign out
        </Button>
      </div>
    </div>
  )
}

export function Sidebar({ user }: { user: SidebarUser }) {
  return (
    <aside className="hidden lg:flex w-60 flex-col border-r bg-white shrink-0">
      <NavContent user={user} />
    </aside>
  )
}

export function MobileNav({ user }: { user: SidebarUser }) {
  const [open, setOpen] = useState(false)
  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger className={cn(buttonVariants({ variant: "ghost", size: "icon" }), "lg:hidden -ml-1")}>
        <Menu className="w-5 h-5" />
      </SheetTrigger>
      <SheetContent side="left" className="w-60 p-0">
        <NavContent user={user} onNav={() => setOpen(false)} />
      </SheetContent>
    </Sheet>
  )
}
