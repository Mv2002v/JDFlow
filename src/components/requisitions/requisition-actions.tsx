"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { toast } from "sonner"
import { Loader2, Send, FileText, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { AtsHandoffModal } from "./ats-handoff-modal"

interface Props {
  reqId: string
  reqTitle: string
  reqStatus: string
  createdById: string
  jdId: string | null
  currentStepId: string | null
  userRole: string
  userId: string
}

export function RequisitionActions({ reqId, reqTitle, reqStatus, createdById, jdId, userRole, userId }: Props) {
  const router = useRouter()
  const [submitting, setSubmitting] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)

  const isOwner = createdById === userId
  const isAdmin = ["ADMIN", "HR"].includes(userRole)
  const canSubmit = (isOwner || isAdmin) && reqStatus === "DRAFT"
  const canGenerateJD = ["APPROVED", "JD_IN_PROGRESS", "JD_REVIEW", "READY_TO_POST", "POSTED"].includes(reqStatus)
  const canPost = reqStatus === "READY_TO_POST"
  const canDelete = (isOwner || isAdmin) && ["DRAFT", "CANCELLED"].includes(reqStatus)

  async function submitForApproval() {
    setSubmitting(true)
    try {
      const res = await fetch(`/api/requisitions/${reqId}/submit`, { method: "POST" })
      if (!res.ok) throw new Error(await res.text())
      toast.success("Submitted for approval!")
      router.refresh()
    } catch {
      toast.error("Failed to submit requisition")
    } finally {
      setSubmitting(false)
    }
  }

  async function deleteRequisition() {
    setDeleting(true)
    try {
      const res = await fetch(`/api/requisitions/${reqId}`, { method: "DELETE" })
      if (!res.ok) throw new Error(await res.text())
      toast.success("Requisition deleted")
      router.push("/dashboard/requisitions")
    } catch {
      toast.error("Failed to delete requisition")
      setDeleting(false)
    }
  }

  return (
    <div className="flex items-center gap-2 flex-wrap">
      {canSubmit && (
        <Button onClick={submitForApproval} disabled={submitting} className="gap-2">
          {submitting
            ? <><Loader2 className="w-4 h-4 animate-spin" /> Submitting…</>
            : <><Send className="w-4 h-4" /> Submit for Approval</>
          }
        </Button>
      )}
      {canGenerateJD && (
        <Button variant={jdId ? "outline" : "default"} asChild className="gap-2">
          <Link href={`/dashboard/requisitions/${reqId}/jd`}>
            <FileText className="w-4 h-4" />
            {jdId ? "View JD" : "Generate JD"}
          </Link>
        </Button>
      )}
      {canPost && <AtsHandoffModal reqId={reqId} reqTitle={reqTitle} />}
      {canDelete && !confirmDelete && (
        <Button
          variant="outline"
          size="sm"
          onClick={() => setConfirmDelete(true)}
          className="gap-2 border-red-200 text-red-600 hover:bg-red-50"
        >
          <Trash2 className="w-4 h-4" /> Delete
        </Button>
      )}
      {canDelete && confirmDelete && (
        <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-1.5">
          <span className="text-sm text-red-700 font-medium">Delete?</span>
          <Button
            size="sm"
            onClick={deleteRequisition}
            disabled={deleting}
            className="h-7 gap-1.5 bg-red-600 hover:bg-red-700"
          >
            {deleting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
            Yes, delete
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setConfirmDelete(false)}
            className="h-7 text-red-600 hover:bg-red-100"
          >
            Cancel
          </Button>
        </div>
      )}
    </div>
  )
}
