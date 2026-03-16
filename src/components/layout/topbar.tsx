"use client"

import { usePathname } from "next/navigation"
import { signOut } from "next-auth/react"
import Link from "next/link"
import { Bell, ChevronDown } from "lucide-react"
import { buttonVariants } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { MobileNav, type SidebarUser } from "./sidebar"
import { timeAgo, cn } from "@/lib/utils"

const PAGE_TITLES: Record<string, string> = {
  "/dashboard":                    "Dashboard",
  "/dashboard/requisitions":       "Requisitions",
  "/dashboard/requisitions/new":   "New Requisition",
  "/dashboard/approvals":          "Approvals",
  "/dashboard/templates":          "Templates",
  "/dashboard/analytics":          "Analytics",
}

function getTitle(pathname: string) {
  if (PAGE_TITLES[pathname]) return PAGE_TITLES[pathname]
  if (pathname.endsWith("/jd"))   return "Job Description"
  if (/\/dashboard\/requisitions\/.+/.test(pathname)) return "Requisition Detail"
  return "JDFlow"
}

export interface NotificationItem {
  id: string; title: string; body: string
  actionUrl: string | null; read: boolean; createdAt: string
}

interface TopbarProps {
  user: SidebarUser
  notificationCount: number
  notifications: NotificationItem[]
}

export function Topbar({ user, notificationCount, notifications }: TopbarProps) {
  const pathname = usePathname()

  return (
    <header className="flex h-14 items-center gap-3 border-b bg-white px-4 shrink-0">
      <MobileNav user={user} />

      <h1 className="text-sm font-semibold flex-1 text-gray-900">{getTitle(pathname)}</h1>

      {/* Notifications */}
      <DropdownMenu>
        <DropdownMenuTrigger
          className={cn(buttonVariants({ variant: "ghost", size: "icon" }), "relative")}
        >
          <Bell className="w-4 h-4" />
          {notificationCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 h-4 w-4 rounded-full bg-indigo-600 text-white text-[9px] font-bold flex items-center justify-center">
              {notificationCount > 9 ? "9+" : notificationCount}
            </span>
          )}
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-80">
          <p className="px-3 py-2 text-sm font-semibold">Notifications</p>
          <DropdownMenuSeparator />
          {notifications.length === 0 ? (
            <p className="px-3 py-6 text-sm text-muted-foreground text-center">All caught up!</p>
          ) : (
            notifications.slice(0, 5).map(n => (
              <DropdownMenuItem
                key={n.id}
                className="p-0 cursor-pointer"
                render={<Link href={n.actionUrl ?? "/dashboard"} />}
              >
                <span className="flex gap-2 px-3 py-2.5 w-full">
                  <span className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${n.read ? "bg-gray-300" : "bg-indigo-500"}`} />
                  <span className="min-w-0">
                    <span className="block text-sm font-medium leading-tight">{n.title}</span>
                    <span className="block text-xs text-muted-foreground line-clamp-1 mt-0.5">{n.body}</span>
                    <span className="block text-[10px] text-muted-foreground mt-1">{timeAgo(n.createdAt)}</span>
                  </span>
                </span>
              </DropdownMenuItem>
            ))
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* User menu */}
      <DropdownMenu>
        <DropdownMenuTrigger
          className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "gap-2 h-9 px-2")}
        >
          <Avatar className="w-7 h-7">
            <AvatarFallback className="bg-indigo-100 text-indigo-700 text-xs font-bold">
              {user.name.split(" ").map(n => n[0]).join("")}
            </AvatarFallback>
          </Avatar>
          <span className="text-sm font-medium hidden sm:inline">{user.name.split(" ")[0]}</span>
          <ChevronDown className="w-3 h-3 text-muted-foreground" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          <div className="px-3 py-2">
            <p className="text-sm font-medium">{user.name}</p>
            <p className="text-xs text-muted-foreground truncate">{user.email}</p>
          </div>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            className="text-red-600 cursor-pointer"
            onClick={() => signOut({ callbackUrl: "/login" })}
          >
            Sign out
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  )
}
