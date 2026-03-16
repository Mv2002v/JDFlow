"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Zap, Loader2, ThumbsUp, ThumbsDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"

interface Props {
  stepId: string
  stepRole: string
  reqId: string
}

const ROLE_LABELS: Record<string, string> = {
  DEPARTMENT_HEAD: "Dept Head",
  FINANCE: "Finance",
  HR: "HR",
  ADMIN: "Admin",
}

export function DemoControls({ stepId, stepRole }: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState<"approve" | "reject" | null>(null)
  const [comment, setComment] = useState("")
  const [open, setOpen] = useState(false)

  async function act(action: "approve" | "reject") {
    setLoading(action)
    try {
      const res = await fetch(`/api/approvals/${stepId}/${action}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ comment: comment || undefined }),
      })
      if (!res.ok) throw new Error(await res.text())
      toast.success(`Step ${action === "approve" ? "approved" : "rejected"} successfully`)
      setComment("")
      router.refresh()
    } catch {
      toast.error(`Failed to ${action} step`)
    } finally {
      setLoading(null)
    }
  }

  return (
    <div className="rounded-xl border-2 border-dashed border-indigo-200 bg-indigo-50/50 p-5 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 bg-indigo-600 rounded flex items-center justify-center">
            <Zap className="w-3.5 h-3.5 text-white" />
          </div>
          <div>
            <p className="text-sm font-semibold text-indigo-900">Demo Controls</p>
            <p className="text-xs text-indigo-600">
              Simulating {ROLE_LABELS[stepRole] ?? stepRole} approval without switching accounts
            </p>
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="text-indigo-600 hover:text-indigo-800 hover:bg-indigo-100"
          onClick={() => setOpen(o => !o)}
        >
          {open ? "Hide" : "Add comment"}
        </Button>
      </div>

      {open && (
        <Textarea
          placeholder={`Optional comment from ${ROLE_LABELS[stepRole] ?? stepRole}...`}
          value={comment}
          onChange={e => setComment(e.target.value)}
          rows={2}
          className="bg-white text-sm"
        />
      )}

      <div className="flex gap-3">
        <Button
          className="flex-1 gap-2 bg-emerald-600 hover:bg-emerald-700"
          onClick={() => act("approve")}
          disabled={loading !== null}
        >
          {loading === "approve"
            ? <Loader2 className="w-4 h-4 animate-spin" />
            : <ThumbsUp className="w-4 h-4" />
          }
          Approve as {ROLE_LABELS[stepRole] ?? stepRole}
        </Button>
        <Button
          variant="outline"
          className="flex-1 gap-2 text-red-600 border-red-200 hover:bg-red-50"
          onClick={() => act("reject")}
          disabled={loading !== null}
        >
          {loading === "reject"
            ? <Loader2 className="w-4 h-4 animate-spin" />
            : <ThumbsDown className="w-4 h-4" />
          }
          Reject
        </Button>
      </div>
    </div>
  )
}
