import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import Link from "next/link"
import { CheckSquare, Clock } from "lucide-react"
import { StepBadge, StatusBadge } from "@/components/shared/status-badge"
import { formatDate } from "@/lib/utils"
import { EmailPreviewModal } from "@/components/requisitions/email-preview-modal"

export default async function ApprovalsPage() {
  const session = await auth()
  if (!session?.user) redirect("/login")

  const ROLE_MAP: Record<string, string> = {
    DEPARTMENT_HEAD: "DEPARTMENT_HEAD",
    FINANCE: "FINANCE",
    HR: "HR",
    ADMIN: "HR",
  }

  const approverRole = ROLE_MAP[session.user.role]

  const pendingSteps = approverRole
    ? await prisma.approvalStep.findMany({
        where: {
          approverRole,
          status: "PENDING",
        },
        include: {
          assignee: { select: { name: true } },
          workflow: {
            include: {
              requisition: {
                include: { createdBy: { select: { name: true } } },
              },
            },
          },
        },
        orderBy: { deadlineAt: "asc" },
      })
    : []

  const completedSteps = approverRole
    ? await prisma.approvalStep.findMany({
        where: {
          approverRole,
          status: { in: ["APPROVED", "REJECTED"] },
        },
        include: {
          workflow: {
            include: {
              requisition: {
                include: { createdBy: { select: { name: true } } },
              },
            },
          },
        },
        orderBy: { updatedAt: "desc" },
        take: 10,
      })
    : []

  const ROLE_LABELS: Record<string, string> = {
    DEPARTMENT_HEAD: "Dept Head",
    FINANCE: "Finance",
    HR: "HR",
  }

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Approvals</h2>
        <p className="text-sm text-muted-foreground mt-0.5">
          Review and act on requisitions assigned to you.
        </p>
      </div>

      {/* Pending */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-amber-500" />
          <h3 className="font-semibold text-gray-900">
            Pending Review
            {pendingSteps.length > 0 && (
              <span className="ml-2 text-xs font-normal bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded-full">
                {pendingSteps.length}
              </span>
            )}
          </h3>
        </div>

        {pendingSteps.length === 0 ? (
          <div className="rounded-xl border bg-gray-50 p-10 text-center">
            <CheckSquare className="w-9 h-9 text-gray-300 mx-auto mb-2" />
            <p className="text-sm font-medium text-gray-700">No pending approvals</p>
            <p className="text-xs text-muted-foreground mt-1">You&apos;re all caught up.</p>
          </div>
        ) : (
          <div className="rounded-xl border bg-white divide-y overflow-hidden">
            {pendingSteps.map(step => {
              const req = step.workflow.requisition
              const isOverdue = step.deadlineAt && new Date(step.deadlineAt) < new Date()
              return (
                <div key={step.id} className="flex items-center gap-4 px-5 py-4 hover:bg-gray-50 transition-colors">
                  <Link
                    href={`/dashboard/requisitions/${req.id}`}
                    className="flex-1 min-w-0"
                  >
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-medium text-gray-900">{req.title}</p>
                      <StatusBadge status={req.status} />
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {req.department} · Submitted by {req.createdBy.name}
                    </p>
                    <p className="text-xs mt-1.5">
                      <span className={isOverdue ? "text-red-600 font-medium" : "text-muted-foreground"}>
                        {isOverdue ? "⚠ Overdue · " : "Due "}
                        {formatDate(step.deadlineAt.toISOString())}
                      </span>
                    </p>
                  </Link>
                  <div className="flex items-center gap-3 shrink-0">
                    <EmailPreviewModal
                      stepLabel={step.stepLabel}
                      approverName={step.assignee.name}
                      approverRole={step.approverRole}
                      reqTitle={req.title}
                      reqDepartment={req.department}
                      deadlineAt={step.deadlineAt.toISOString()}
                    />
                    <StepBadge status={step.status} />
                    <span className="text-xs text-muted-foreground hidden sm:inline">
                      Step {step.stepOrder + 1} — {ROLE_LABELS[step.approverRole] ?? step.approverRole}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* History */}
      {completedSteps.length > 0 && (
        <div className="space-y-3">
          <h3 className="font-semibold text-gray-900 flex items-center gap-2">
            <CheckSquare className="w-4 h-4 text-gray-400" />
            Recent History
          </h3>
          <div className="rounded-xl border bg-white divide-y overflow-hidden">
            {completedSteps.map(step => {
              const req = step.workflow.requisition
              return (
                <Link
                  key={step.id}
                  href={`/dashboard/requisitions/${req.id}`}
                  className="flex items-center gap-4 px-5 py-3.5 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900">{req.title}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {req.department} · {formatDate(step.updatedAt.toISOString())}
                    </p>
                    {step.comment && (
                      <p className="text-xs text-muted-foreground mt-1 italic line-clamp-1">
                        &ldquo;{step.comment}&rdquo;
                      </p>
                    )}
                  </div>
                  <StepBadge status={step.status} />
                </Link>
              )
            })}
          </div>
        </div>
      )}

      {!approverRole && (
        <div className="rounded-xl border bg-gray-50 p-10 text-center">
          <p className="text-sm text-muted-foreground">
            Your role ({session.user.role.replace(/_/g, " ")}) does not have approval permissions.
          </p>
        </div>
      )}
    </div>
  )
}
