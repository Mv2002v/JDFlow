import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

const CONFIG = {
  DRAFT:            { label: "Draft",            cls: "bg-gray-100 text-gray-600 border-gray-200" },
  PENDING_APPROVAL: { label: "Pending Approval", cls: "bg-amber-50 text-amber-700 border-amber-200" },
  APPROVED:         { label: "Approved",         cls: "bg-green-50 text-green-700 border-green-200" },
  JD_IN_PROGRESS:   { label: "JD In Progress",   cls: "bg-blue-50 text-blue-700 border-blue-200" },
  JD_REVIEW:        { label: "JD Review",        cls: "bg-violet-50 text-violet-700 border-violet-200" },
  READY_TO_POST:    { label: "Ready to Post",    cls: "bg-indigo-50 text-indigo-700 border-indigo-200" },
  POSTED:           { label: "Posted",           cls: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  CLOSED:           { label: "Closed",           cls: "bg-gray-100 text-gray-500 border-gray-200" },
  CANCELLED:        { label: "Cancelled",        cls: "bg-red-50 text-red-700 border-red-200" },
} as const

type Status = keyof typeof CONFIG

export function StatusBadge({ status }: { status: string }) {
  const cfg = CONFIG[status as Status] ?? { label: status, cls: "bg-gray-100 text-gray-600 border-gray-200" }
  return (
    <Badge variant="outline" className={cn("text-xs font-medium", cfg.cls)}>
      {cfg.label}
    </Badge>
  )
}

const STEP_CONFIG = {
  PENDING:  { label: "Pending",  cls: "bg-gray-100 text-gray-600" },
  APPROVED: { label: "Approved", cls: "bg-green-100 text-green-700" },
  REJECTED: { label: "Rejected", cls: "bg-red-100 text-red-700" },
  SKIPPED:  { label: "Skipped",  cls: "bg-yellow-100 text-yellow-700" },
} as const

type StepStatus = keyof typeof STEP_CONFIG

export function StepBadge({ status }: { status: string }) {
  const cfg = STEP_CONFIG[status as StepStatus] ?? { label: status, cls: "bg-gray-100 text-gray-600" }
  return (
    <Badge variant="secondary" className={cn("text-xs font-medium", cfg.cls)}>
      {cfg.label}
    </Badge>
  )
}
