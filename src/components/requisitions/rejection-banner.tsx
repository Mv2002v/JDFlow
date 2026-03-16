"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { AlertTriangle, RefreshCw, Loader2, ChevronDown, ChevronUp } from "lucide-react"
import { Button } from "@/components/ui/button"

interface RejectedStep {
  stepLabel: string
  approverRole: string
  comment: string | null
  decidedAt: string | null
}

interface Props {
  reqId: string
  rejectedStep: RejectedStep | null
  salaryMin: number | null
  salaryMax: number | null
  justification: string
}

export function RejectionBanner({ reqId, rejectedStep, salaryMin, salaryMax, justification }: Props) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [newSalaryMin, setNewSalaryMin] = useState(salaryMin?.toString() ?? "")
  const [newSalaryMax, setNewSalaryMax] = useState(salaryMax?.toString() ?? "")
  const [newJustification, setNewJustification] = useState(justification)

  async function resubmit() {
    setSubmitting(true)
    try {
      const res = await fetch(`/api/requisitions/${reqId}/resubmit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          salaryMin: newSalaryMin ? parseInt(newSalaryMin) : undefined,
          salaryMax: newSalaryMax ? parseInt(newSalaryMax) : undefined,
          justification: newJustification || undefined,
        }),
      })
      if (!res.ok) throw new Error(await res.text())
      toast.success("Requisition resubmitted for approval!")
      router.refresh()
    } catch {
      toast.error("Failed to resubmit")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="rounded-xl border border-red-200 bg-red-50 p-5 space-y-3">
      <div className="flex items-start gap-3">
        <AlertTriangle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-red-800 text-sm">Requisition Cancelled</p>
          {rejectedStep ? (
            <p className="text-sm text-red-700 mt-0.5">
              Rejected at <span className="font-medium">{rejectedStep.stepLabel}</span>
              {rejectedStep.comment && (
                <>: &ldquo;{rejectedStep.comment}&rdquo;</>
              )}
            </p>
          ) : (
            <p className="text-sm text-red-700 mt-0.5">This requisition was cancelled.</p>
          )}
        </div>
        <Button
          variant="outline"
          size="sm"
          className="shrink-0 border-red-300 text-red-700 hover:bg-red-100 gap-1.5"
          onClick={() => setOpen(v => !v)}
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Resubmit
          {open ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        </Button>
      </div>

      {open && (
        <div className="border-t border-red-200 pt-4 space-y-4">
          <p className="text-xs text-red-700 font-medium uppercase tracking-wide">
            Update before resubmitting (optional)
          </p>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-medium text-gray-700">Salary Min (USD)</label>
              <input
                type="number"
                className="w-full rounded-lg border bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                value={newSalaryMin}
                onChange={e => setNewSalaryMin(e.target.value)}
                placeholder="e.g. 80000"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-gray-700">Salary Max (USD)</label>
              <input
                type="number"
                className="w-full rounded-lg border bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                value={newSalaryMax}
                onChange={e => setNewSalaryMax(e.target.value)}
                placeholder="e.g. 110000"
              />
            </div>
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-gray-700">Updated Justification</label>
            <textarea
              className="w-full rounded-lg border bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
              rows={3}
              value={newJustification}
              onChange={e => setNewJustification(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-2 justify-end">
            <Button variant="outline" size="sm" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button size="sm" onClick={resubmit} disabled={submitting} className="gap-2">
              {submitting
                ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Resubmitting…</>
                : <><RefreshCw className="w-3.5 h-3.5" /> Resubmit for Approval</>
              }
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
