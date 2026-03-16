import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import Link from "next/link"
import { redirect } from "next/navigation"
import { Plus, Search } from "lucide-react"
import { Button } from "@/components/ui/button"
import { StatusBadge } from "@/components/shared/status-badge"
import { formatDate, formatCurrency } from "@/lib/utils"

export default async function RequisitionsPage() {
  const session = await auth()
  if (!session?.user) redirect("/login")

  const isAdmin = ["ADMIN", "HR"].includes(session.user.role)

  const reqs = await prisma.requisition.findMany({
    where: isAdmin ? {} : { createdById: session.user.id },
    include: {
      createdBy: { select: { name: true } },
    },
    orderBy: { updatedAt: "desc" },
  })

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Requisitions</h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            {isAdmin ? `All ${reqs.length} requisitions` : `Your ${reqs.length} requisition${reqs.length !== 1 ? "s" : ""}`}
          </p>
        </div>
        <Button asChild className="gap-2">
          <Link href="/dashboard/requisitions/new">
            <Plus className="w-4 h-4" /> New Requisition
          </Link>
        </Button>
      </div>

      {/* Table */}
      {reqs.length === 0 ? (
        <div className="rounded-2xl border-2 border-dashed border-gray-200 bg-gray-50 p-16 text-center">
          <Search className="w-10 h-10 text-gray-300 mx-auto mb-3" />
          <h3 className="font-semibold text-gray-900">No requisitions yet</h3>
          <p className="text-sm text-muted-foreground mt-1">Create one to start the hiring process.</p>
          <Button asChild className="mt-5 gap-2">
            <Link href="/dashboard/requisitions/new">
              <Plus className="w-4 h-4" /> New Requisition
            </Link>
          </Button>
        </div>
      ) : (
        <div className="rounded-xl border bg-white overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-gray-50">
                <th className="text-left px-5 py-3 font-medium text-gray-600">Position</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600 hidden sm:table-cell">Department</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600 hidden md:table-cell">Salary Range</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Status</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600 hidden lg:table-cell">Updated</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {reqs.map((req) => (
                <tr key={req.id} className="hover:bg-gray-50 transition-colors cursor-pointer">
                  <td className="px-5 py-4">
                    <Link href={`/dashboard/requisitions/${req.id}`} className="block">
                      <p className="font-medium text-gray-900 hover:text-indigo-600 transition-colors">
                        {req.title}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5 capitalize">
                        {req.level.toLowerCase()} · {req.type.replace(/_/g, " ").toLowerCase()}
                      </p>
                    </Link>
                  </td>
                  <td className="px-4 py-4 hidden sm:table-cell">
                    <Link href={`/dashboard/requisitions/${req.id}`} className="block text-gray-600">
                      {req.department}
                    </Link>
                  </td>
                  <td className="px-4 py-4 hidden md:table-cell">
                    <Link href={`/dashboard/requisitions/${req.id}`} className="block text-gray-600">
                      {req.salaryMin && req.salaryMax
                        ? `${formatCurrency(req.salaryMin)} – ${formatCurrency(req.salaryMax)}`
                        : <span className="text-muted-foreground">—</span>
                      }
                    </Link>
                  </td>
                  <td className="px-4 py-4">
                    <Link href={`/dashboard/requisitions/${req.id}`} className="block">
                      <StatusBadge status={req.status} />
                    </Link>
                  </td>
                  <td className="px-4 py-4 hidden lg:table-cell">
                    <Link href={`/dashboard/requisitions/${req.id}`} className="block text-muted-foreground text-xs">
                      {formatDate(req.updatedAt.toISOString())}
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
