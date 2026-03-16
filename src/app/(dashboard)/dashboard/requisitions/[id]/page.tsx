import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { redirect, notFound } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, FileText, Calendar, MapPin, DollarSign, Users, Briefcase, History } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { StatusBadge } from "@/components/shared/status-badge"
import { formatCurrency, formatDate } from "@/lib/utils"
import { WorkflowPipeline } from "@/components/requisitions/workflow-pipeline"
import { DemoControls } from "@/components/requisitions/demo-controls"
import { RequisitionActions } from "@/components/requisitions/requisition-actions"
import { RejectionBanner } from "@/components/requisitions/rejection-banner"

export default async function RequisitionDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const session = await auth()
  if (!session?.user) redirect("/login")

  const { id } = await params

  const req = await prisma.requisition.findUnique({
    where: { id },
    include: {
      createdBy: { select: { name: true, email: true } },
      workflows: {
        include: {
          steps: {
            orderBy: { stepOrder: "asc" },
            include: { assignee: { select: { name: true } } },
          },
        },
        orderBy: { revision: "desc" },
      },
      jobDescription: true,
    },
  })

  if (!req) notFound()

  const isAdmin = ["ADMIN", "HR"].includes(session.user.role)
  const isOwner = req.createdById === session.user.id
  if (!isAdmin && !isOwner) notFound()

  // Latest workflow
  const latestWorkflow = req.workflows.find(w => w.isLatest) ?? req.workflows[0] ?? null
  const currentStep = latestWorkflow?.steps.find(s => s.status === "PENDING") ?? null
  const rejectedStep = latestWorkflow?.steps.find(s => s.status === "REJECTED") ?? null

  // Previous revisions (all except latest)
  const previousWorkflows = req.workflows.filter(w => !w.isLatest)

  // Serialize dates for client components
  const serializeWorkflow = (wf: typeof latestWorkflow) => {
    if (!wf) return null
    return {
      ...wf,
      startedAt: wf.startedAt.toISOString(),
      completedAt: wf.completedAt?.toISOString() ?? null,
      steps: wf.steps.map(s => ({
        ...s,
        assigneeName: s.assignee.name,
        deadlineAt: s.deadlineAt.toISOString(),
        decidedAt: s.decidedAt?.toISOString() ?? null,
        createdAt: s.createdAt.toISOString(),
        updatedAt: s.updatedAt.toISOString(),
      })),
    }
  }

  const serializedWorkflow = serializeWorkflow(latestWorkflow)

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      {/* Back nav */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" asChild className="-ml-2">
          <Link href="/dashboard/requisitions" className="gap-2">
            <ArrowLeft className="w-4 h-4" /> Back
          </Link>
        </Button>
      </div>

      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <div className="flex items-center gap-3 flex-wrap">
            <h2 className="text-2xl font-bold text-gray-900">{req.title}</h2>
            <StatusBadge status={req.status} />
            {req.revisionCount > 1 && (
              <Badge variant="secondary" className="text-xs">
                Revision {req.revisionCount}
              </Badge>
            )}
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            {req.department} · Created by {req.createdBy.name} on {formatDate(req.createdAt.toISOString())}
          </p>
        </div>
        <RequisitionActions
          reqId={id}
          reqTitle={req.title}
          reqStatus={req.status}
          createdById={req.createdById}
          jdId={req.jobDescription?.id ?? null}
          currentStepId={currentStep?.id ?? null}
          userRole={session.user.role}
          userId={session.user.id}
        />
      </div>

      {/* Rejection / resubmit banner */}
      {req.status === "CANCELLED" && (
        <RejectionBanner
          reqId={id}
          rejectedStep={rejectedStep ? {
            stepLabel: rejectedStep.stepLabel,
            approverRole: rejectedStep.approverRole,
            comment: rejectedStep.comment,
            decidedAt: rejectedStep.decidedAt?.toISOString() ?? null,
          } : null}
          salaryMin={req.salaryMin}
          salaryMax={req.salaryMax}
          justification={req.justification}
        />
      )}

      {/* Details grid */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {[
          { icon: Briefcase, label: "Type", value: req.type.replace(/_/g, " ") },
          { icon: Users, label: "Level", value: req.level },
          { icon: MapPin, label: "Location", value: req.location },
          { icon: MapPin, label: "Remote", value: req.remotePolicy },
          ...(req.salaryMin && req.salaryMax ? [{
            icon: DollarSign,
            label: "Salary",
            value: `${formatCurrency(req.salaryMin)} – ${formatCurrency(req.salaryMax)}`,
          }] : []),
          { icon: Users, label: "Headcount", value: req.headcount.toString() },
          ...(req.targetStartDate ? [{
            icon: Calendar,
            label: "Start Date",
            value: formatDate(req.targetStartDate.toISOString()),
          }] : []),
        ].map(({ icon: Icon, label, value }) => (
          <div key={label} className="rounded-xl border bg-white p-4 space-y-1">
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <Icon className="w-3.5 h-3.5" />
              <span className="text-xs font-medium uppercase tracking-wide">{label}</span>
            </div>
            <p className="text-sm font-semibold text-gray-900">{value}</p>
          </div>
        ))}
      </div>

      {/* Business justification */}
      {req.justification && (
        <div className="rounded-xl border bg-white p-5 space-y-2">
          <h3 className="font-semibold text-gray-900 text-sm">Business Justification</h3>
          <p className="text-sm text-gray-700 leading-relaxed">{req.justification}</p>
          {req.hiringManagerNotes && (
            <div className="border-t pt-3 mt-3">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1.5">
                Hiring Manager Notes
              </p>
              <p className="text-sm text-gray-700">{req.hiringManagerNotes}</p>
            </div>
          )}
        </div>
      )}

      {/* Current workflow pipeline */}
      {serializedWorkflow && (
        <WorkflowPipeline
          workflow={serializedWorkflow}
          reqTitle={req.title}
          reqDepartment={req.department}
        />
      )}

      {/* Demo controls */}
      {serializedWorkflow && currentStep && (
        <DemoControls
          stepId={currentStep.id}
          stepRole={currentStep.approverRole}
          reqId={id}
        />
      )}

      {/* Revision history accordion */}
      {previousWorkflows.length > 0 && (
        <details className="rounded-xl border bg-white">
          <summary className="flex items-center gap-2 p-5 cursor-pointer select-none text-sm font-semibold text-gray-900 list-none">
            <History className="w-4 h-4 text-gray-500" />
            Revision History
            <Badge variant="secondary" className="ml-auto text-xs">{previousWorkflows.length} previous</Badge>
          </summary>
          <div className="border-t divide-y">
            {previousWorkflows.map(wf => (
              <div key={wf.id} className="p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-semibold text-gray-700 uppercase tracking-wide">
                    Revision {wf.revision}
                  </p>
                  <Badge
                    variant="secondary"
                    className={
                      wf.status === "REJECTED" ? "bg-red-100 text-red-700" :
                      wf.status === "COMPLETED" ? "bg-emerald-100 text-emerald-700" :
                      "bg-gray-100 text-gray-700"
                    }
                  >
                    {wf.status}
                  </Badge>
                </div>
                <div className="flex gap-2 flex-wrap">
                  {wf.steps.map(s => (
                    <div key={s.id} className="flex items-center gap-1.5 text-xs text-gray-600">
                      <span className={
                        s.status === "APPROVED" ? "text-emerald-600" :
                        s.status === "REJECTED" ? "text-red-600" :
                        "text-gray-400"
                      }>●</span>
                      {s.stepLabel}
                      {s.comment && (
                        <span className="text-muted-foreground italic">
                          — &ldquo;{s.comment}&rdquo;
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </details>
      )}

      {/* JD section */}
      {(req.status === "APPROVED" || req.status === "JD_IN_PROGRESS" || req.status === "JD_REVIEW" || req.status === "READY_TO_POST" || req.status === "POSTED") && (
        <div className="rounded-xl border bg-white p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-gray-900 flex items-center gap-2">
              <FileText className="w-4 h-4 text-indigo-600" />
              Job Description
            </h3>
            {req.jobDescription ? (
              <div className="flex items-center gap-2">
                <Badge
                  variant="secondary"
                  className={
                    req.jobDescription.status === "APPROVED" ? "bg-emerald-100 text-emerald-700" :
                    req.jobDescription.status === "IN_REVIEW" ? "bg-amber-100 text-amber-700" :
                    "bg-gray-100 text-gray-700"
                  }
                >
                  {req.jobDescription.status.replace(/_/g, " ").toLowerCase()}
                </Badge>
                <Button variant="outline" size="sm" asChild>
                  <Link href={`/dashboard/requisitions/${id}/jd`}>Open Editor</Link>
                </Button>
              </div>
            ) : (
              <Button size="sm" asChild>
                <Link href={`/dashboard/requisitions/${id}/jd`}>Generate JD</Link>
              </Button>
            )}
          </div>
          {!req.jobDescription && (
            <p className="text-sm text-muted-foreground">
              This requisition is approved. Generate an AI-powered job description to move forward.
            </p>
          )}
          {req.jobDescription && (
            <p className="text-sm text-muted-foreground">
              JD is {req.jobDescription.status.toLowerCase().replace(/_/g, " ")}. Click &ldquo;Open Editor&rdquo; to review, edit, and analyze.
            </p>
          )}
        </div>
      )}
    </div>
  )
}
