"use client"

import { motion } from "framer-motion"
import { Check, X, Clock, ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils"
import { EmailPreviewModal } from "./email-preview-modal"

type StepStatus = "PENDING" | "APPROVED" | "REJECTED" | "SKIPPED"

interface Step {
  id: string
  stepOrder: number
  stepLabel: string
  approverRole: string
  status: StepStatus
  comment: string | null
  deadlineAt: string
  decidedAt: string | null
  assigneeName?: string
}

interface WorkflowInstance {
  id: string
  status: string
  steps: Step[]
}

interface Props {
  workflow: WorkflowInstance
  reqTitle?: string
  reqDepartment?: string
}

const ROLE_LABELS: Record<string, string> = {
  DEPARTMENT_HEAD: "Dept Head",
  FINANCE: "Finance",
  HR: "HR",
}

function StepIcon({ status }: { status: StepStatus }) {
  if (status === "APPROVED") return <Check className="w-4 h-4" />
  if (status === "REJECTED") return <X className="w-4 h-4" />
  return <Clock className="w-4 h-4" />
}

function stepColors(status: StepStatus) {
  if (status === "APPROVED") return { ring: "ring-emerald-500", bg: "bg-emerald-500", text: "text-white", label: "text-emerald-700", labelBg: "bg-emerald-50" }
  if (status === "REJECTED") return { ring: "ring-red-500", bg: "bg-red-500", text: "text-white", label: "text-red-700", labelBg: "bg-red-50" }
  if (status === "PENDING") return { ring: "ring-amber-400", bg: "bg-amber-400", text: "text-white", label: "text-amber-700", labelBg: "bg-amber-50" }
  return { ring: "ring-gray-200", bg: "bg-gray-100", text: "text-gray-400", label: "text-gray-500", labelBg: "bg-gray-50" }
}

export function WorkflowPipeline({ workflow, reqTitle = "", reqDepartment = "" }: Props) {
  return (
    <div className="rounded-xl border bg-white p-5 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-gray-900">Approval Pipeline</h3>
        <span className={cn(
          "text-xs font-medium px-2 py-0.5 rounded-full",
          workflow.status === "COMPLETED" ? "bg-emerald-50 text-emerald-700" :
          workflow.status === "REJECTED" ? "bg-red-50 text-red-700" :
          "bg-amber-50 text-amber-700"
        )}>
          {workflow.status}
        </span>
      </div>

      <div className="flex items-start gap-0">
        {workflow.steps.map((step, index) => {
          const colors = stepColors(step.status)
          const isLast = index === workflow.steps.length - 1
          return (
            <div key={step.id} className="flex items-center flex-1 min-w-0">
              <div className="flex flex-col items-center gap-2 flex-1">
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: index * 0.15, duration: 0.3 }}
                  className={cn(
                    "w-10 h-10 rounded-full flex items-center justify-center ring-2 transition-all",
                    colors.ring, colors.bg, colors.text
                  )}
                >
                  <StepIcon status={step.status} />
                </motion.div>
                <div className="text-center px-1">
                  <p className="text-xs font-semibold text-gray-700">
                    {ROLE_LABELS[step.approverRole] ?? step.approverRole}
                  </p>
                  <span className={cn(
                    "text-[10px] font-medium px-1.5 py-0.5 rounded-full",
                    colors.labelBg, colors.label
                  )}>
                    {step.status}
                  </span>
                  {step.status === "PENDING" && (
                    <>
                      <p className="text-[10px] text-muted-foreground mt-0.5">
                        Due {new Date(step.deadlineAt).toLocaleDateString()}
                      </p>
                      {step.assigneeName && (
                        <div className="mt-1">
                          <EmailPreviewModal
                            stepLabel={step.stepLabel}
                            approverName={step.assigneeName}
                            approverRole={step.approverRole}
                            reqTitle={reqTitle}
                            reqDepartment={reqDepartment}
                            deadlineAt={step.deadlineAt}
                          />
                        </div>
                      )}
                    </>
                  )}
                  {step.comment && (
                    <p className="text-[10px] text-muted-foreground mt-0.5 max-w-[80px] truncate" title={step.comment}>
                      &ldquo;{step.comment}&rdquo;
                    </p>
                  )}
                </div>
              </div>
              {!isLast && (
                <div className="-mt-6 shrink-0">
                  <ChevronRight className={cn(
                    "w-5 h-5",
                    step.status === "APPROVED" ? "text-emerald-400" : "text-gray-300"
                  )} />
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
