import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import Link from "next/link"
import { redirect } from "next/navigation"
import { FileText, Clock, CheckCircle, Rocket, Plus, ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { StatusBadge } from "@/components/shared/status-badge"
import { timeAgo } from "@/lib/utils"

export default async function DashboardPage() {
  const session = await auth()
  if (!session?.user) redirect("/login")

  const isPrivileged = ["ADMIN", "HR"].includes(session.user.role)

  const [reqs, attentionItems, recentActivity] = await Promise.all([
    prisma.requisition.findMany({
      where: isPrivileged ? {} : { createdById: session.user.id },
      select: { status: true },
    }),
    prisma.requisition.findMany({
      where: {
        ...(isPrivileged ? {} : { createdById: session.user.id }),
        status: { in: ["DRAFT", "PENDING_APPROVAL", "APPROVED"] },
      },
      include: {
        createdBy: { select: { name: true } },
        workflows: {
          where: { isLatest: true },
          include: { steps: { where: { status: "PENDING" }, take: 1 } },
          take: 1,
        },
        jobDescription: { select: { status: true } },
      },
      orderBy: { updatedAt: "desc" },
      take: 5,
    }),
    prisma.notification.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: "desc" },
      take: 8,
    }),
  ])

  const stats = {
    total: reqs.length,
    pending: reqs.filter(r => r.status === "PENDING_APPROVAL").length,
    approved: reqs.filter(r => r.status === "APPROVED").length,
    posted: reqs.filter(r => r.status === "POSTED").length,
  }

  function getAttentionReason(req: typeof attentionItems[0]) {
    if (req.status === "APPROVED") {
      const jd = req.jobDescription
      if (!jd) return "JD ready to generate"
      if (jd.status === "DRAFT") return "JD draft in progress"
      if (jd.status === "IN_REVIEW") return "JD awaiting review"
    }
    if (req.status === "PENDING_APPROVAL") return "Awaiting approval"
    if (req.status === "DRAFT") return "Draft — not yet submitted"
    return null
  }

  return (
    <div className="p-6 space-y-8 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">
            Welcome back, {session.user.name?.split(" ")[0]}
          </h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            {isPrivileged
              ? "Here\u2019s what\u2019s happening across the organisation."
              : "Here\u2019s what\u2019s happening with your requisitions."}
          </p>
        </div>
        <Button asChild>
          <Link href="/dashboard/requisitions/new" className="gap-2">
            <Plus className="w-4 h-4" /> New Requisition
          </Link>
        </Button>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {[
          { label: "Total Reqs", value: stats.total, icon: FileText, color: "text-indigo-600", bg: "bg-indigo-50" },
          { label: "Pending Approval", value: stats.pending, icon: Clock, color: "text-amber-600", bg: "bg-amber-50" },
          { label: "Approved", value: stats.approved, icon: CheckCircle, color: "text-green-600", bg: "bg-green-50" },
          { label: "Posted", value: stats.posted, icon: Rocket, color: "text-emerald-600", bg: "bg-emerald-50" },
        ].map(({ label, value, icon: Icon, color, bg }) => (
          <div key={label} className="rounded-xl border bg-white p-5 space-y-3">
            <div className={`w-9 h-9 rounded-lg ${bg} flex items-center justify-center`}>
              <Icon className={`w-5 h-5 ${color}`} />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{value}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Requires Attention */}
        <div className="rounded-xl border bg-white">
          <div className="flex items-center justify-between px-5 py-4 border-b">
            <h3 className="font-semibold text-gray-900">Requires Attention</h3>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/dashboard/requisitions" className="gap-1 text-xs">
                View all <ArrowRight className="w-3 h-3" />
              </Link>
            </Button>
          </div>
          <div className="divide-y">
            {attentionItems.length === 0 ? (
              <p className="px-5 py-8 text-sm text-muted-foreground text-center">
                All caught up! No items need attention.
              </p>
            ) : (
              attentionItems.map(req => {
                const reason = getAttentionReason(req)
                if (!reason) return null
                return (
                  <Link
                    key={req.id}
                    href={`/dashboard/requisitions/${req.id}`}
                    className="flex items-center gap-3 px-5 py-3.5 hover:bg-gray-50 transition-colors"
                  >
                    <div className="w-2 h-2 rounded-full bg-amber-400 shrink-0 mt-0.5" />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-gray-900 truncate">{req.title}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {reason}
                        {isPrivileged && ` · ${req.createdBy.name}`}
                      </p>
                    </div>
                    <StatusBadge status={req.status} />
                  </Link>
                )
              })
            )}
          </div>
        </div>

        {/* Activity feed */}
        <div className="rounded-xl border bg-white">
          <div className="px-5 py-4 border-b">
            <h3 className="font-semibold text-gray-900">Recent Activity</h3>
          </div>
          <div className="divide-y">
            {recentActivity.length === 0 ? (
              <p className="px-5 py-8 text-sm text-muted-foreground text-center">
                No activity yet.
              </p>
            ) : (
              recentActivity.map(n => (
                <Link
                  key={n.id}
                  href={n.actionUrl ?? "/dashboard"}
                  className="flex items-start gap-3 px-5 py-3.5 hover:bg-gray-50 transition-colors"
                >
                  <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${n.read ? "bg-gray-300" : "bg-indigo-500"}`} />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-gray-900 leading-tight">{n.title}</p>
                    <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{n.body}</p>
                    <p className="text-[10px] text-muted-foreground mt-1">{timeAgo(n.createdAt.toISOString())}</p>
                  </div>
                </Link>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Quick start CTA if no reqs */}
      {stats.total === 0 && (
        <div className="rounded-2xl border-2 border-dashed border-gray-200 bg-gray-50 p-12 text-center">
          <div className="w-12 h-12 rounded-xl bg-indigo-100 flex items-center justify-center mx-auto mb-4">
            <FileText className="w-6 h-6 text-indigo-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900">Create your first requisition</h3>
          <p className="text-sm text-muted-foreground mt-2 max-w-sm mx-auto">
            Start the hiring process by submitting a job requisition. It takes less than 2 minutes.
          </p>
          <Button asChild className="mt-6 gap-2">
            <Link href="/dashboard/requisitions/new">
              <Plus className="w-4 h-4" /> New Requisition
            </Link>
          </Button>
        </div>
      )}
    </div>
  )
}
