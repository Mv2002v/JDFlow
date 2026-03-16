"use client"

import { useState, useRef } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { toast } from "sonner"
import {
  Loader2, Sparkles, Save, ArrowLeft, BarChart2,
  CheckCircle, AlertTriangle, XCircle, RefreshCw,
  MessageSquare, History, Send, ThumbsDown, ThumbsUp,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { JdCommentsPanel } from "./jd-comments-panel"
import { JdVersionHistory } from "./jd-version-history"

interface AnalysisResult {
  inclusionScore: number
  readabilityScore: number
  complianceScore: number
  inclusionIssues: { severity: "high" | "medium" | "low"; issue: string; suggestion: string }[]
  complianceChecks: { passed: boolean; check: string; note: string }[]
  summary: string
}

interface Props {
  reqId: string
  reqTitle: string
  reqDepartment: string
  existingContent: string | null
  jdStatus: string | null
  jdId: string | null
  userRole: string
  userId: string
  createdById: string
}

type Panel = "analysis" | "comments" | "history" | null

export function JdEditor({
  reqId, reqTitle, reqDepartment, existingContent,
  jdStatus, userRole, createdById, userId,
}: Props) {
  const router = useRouter()
  const [content, setContent] = useState(existingContent ?? "")
  const [generating, setGenerating] = useState(false)
  const [saving, setSaving] = useState(false)
  const [analyzing, setAnalyzing] = useState(false)
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null)
  const [panel, setPanel] = useState<Panel>(null)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [changesNote, setChangesNote] = useState("")
  const [showChangesForm, setShowChangesForm] = useState(false)
  const abortRef = useRef<AbortController | null>(null)

  const isOwner = createdById === userId
  const isHR = ["ADMIN", "HR"].includes(userRole)
  const canEdit = isOwner || isHR
  const canSubmitForReview = canEdit && jdStatus === "DRAFT" && content.trim().length > 0
  const canApprove = isHR && jdStatus === "IN_REVIEW"
  const canRequestChanges = isHR && jdStatus === "IN_REVIEW"

  function togglePanel(p: Panel) {
    setPanel(prev => prev === p ? null : p)
    if (p !== "analysis") setAnalysis(null)
  }

  async function generate() {
    if (generating) {
      abortRef.current?.abort()
      setGenerating(false)
      return
    }

    setGenerating(true)
    setContent("")
    const abort = new AbortController()
    abortRef.current = abort

    try {
      const res = await fetch(`/api/requisitions/${reqId}/jd/generate`, {
        method: "POST",
        signal: abort.signal,
      })
      if (!res.ok) throw new Error(await res.text())
      if (!res.body) throw new Error("No stream body")

      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let full = ""

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        const chunk = decoder.decode(value, { stream: true })
        full += chunk
        setContent(full)
      }

      toast.success("JD generated! Review and save when ready.")
    } catch (err) {
      if ((err as Error).name !== "AbortError") {
        toast.error("Generation failed")
      }
    } finally {
      setGenerating(false)
    }
  }

  async function save() {
    if (!content.trim()) return
    setSaving(true)
    try {
      const res = await fetch(`/api/requisitions/${reqId}/jd`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
      })
      if (!res.ok) throw new Error(await res.text())
      toast.success("JD saved")
      router.refresh()
    } catch {
      toast.error("Failed to save")
    } finally {
      setSaving(false)
    }
  }

  async function analyze() {
    if (!content.trim()) {
      toast.error("Generate or write a JD first")
      return
    }
    setAnalyzing(true)
    setPanel("analysis")
    try {
      const res = await fetch(`/api/requisitions/${reqId}/jd/analyze`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
      })
      if (!res.ok) throw new Error(await res.text())
      const result = await res.json()
      setAnalysis(result)
    } catch {
      toast.error("Analysis failed")
      setPanel(null)
    } finally {
      setAnalyzing(false)
    }
  }

  async function submitForReview() {
    setActionLoading("submit")
    try {
      // Save first if there's unsaved content
      await fetch(`/api/requisitions/${reqId}/jd`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
      })
      const res = await fetch(`/api/requisitions/${reqId}/jd/submit-for-review`, { method: "POST" })
      if (!res.ok) throw new Error(await res.text())
      toast.success("JD submitted for HR review!")
      router.refresh()
    } catch {
      toast.error("Failed to submit for review")
    } finally {
      setActionLoading(null)
    }
  }

  async function approvejd() {
    setActionLoading("approve")
    try {
      const res = await fetch(`/api/requisitions/${reqId}/jd/approve`, { method: "POST" })
      if (!res.ok) throw new Error(await res.text())
      toast.success("JD approved! Requisition marked ready to post.")
      router.refresh()
    } catch {
      toast.error("Failed to approve JD")
    } finally {
      setActionLoading(null)
    }
  }

  async function requestChanges() {
    setActionLoading("changes")
    try {
      const res = await fetch(`/api/requisitions/${reqId}/jd/request-changes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ note: changesNote }),
      })
      if (!res.ok) throw new Error(await res.text())
      toast.success("Changes requested. Hiring manager has been notified.")
      setShowChangesForm(false)
      setChangesNote("")
      router.refresh()
    } catch {
      toast.error("Failed to request changes")
    } finally {
      setActionLoading(null)
    }
  }

  function scoreColor(score: number) {
    if (score >= 80) return "text-emerald-600"
    if (score >= 60) return "text-amber-600"
    return "text-red-600"
  }

  function scoreLabel(score: number) {
    if (score >= 80) return "Good"
    if (score >= 60) return "Fair"
    return "Needs work"
  }

  const statusColors: Record<string, string> = {
    DRAFT: "bg-gray-100 text-gray-700",
    IN_REVIEW: "bg-amber-100 text-amber-700",
    APPROVED: "bg-emerald-100 text-emerald-700",
    POSTED: "bg-blue-100 text-blue-700",
  }

  return (
    <div className="flex flex-col h-full">
      {/* Topbar */}
      <div className="flex items-center gap-3 border-b bg-white px-5 py-3 shrink-0 flex-wrap">
        <Button variant="ghost" size="sm" asChild className="-ml-2">
          <Link href={`/dashboard/requisitions/${reqId}`} className="gap-2">
            <ArrowLeft className="w-4 h-4" /> Back
          </Link>
        </Button>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-gray-900 truncate">{reqTitle}</p>
          <p className="text-xs text-muted-foreground">{reqDepartment}</p>
        </div>
        {jdStatus && (
          <Badge
            variant="secondary"
            className={cn("capitalize hidden sm:flex", statusColors[jdStatus])}
          >
            {jdStatus.replace(/_/g, " ").toLowerCase()}
          </Badge>
        )}
        <div className="flex gap-2 flex-wrap">
          {/* Panel toggles */}
          <Button
            variant={panel === "history" ? "default" : "outline"}
            size="sm"
            onClick={() => togglePanel("history")}
            className="gap-2"
            title="Version history"
          >
            <History className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">History</span>
          </Button>
          <Button
            variant={panel === "comments" ? "default" : "outline"}
            size="sm"
            onClick={() => togglePanel("comments")}
            className="gap-2"
            title="Comments"
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Comments</span>
          </Button>
          <Button
            variant={panel === "analysis" ? "default" : "outline"}
            size="sm"
            onClick={panel === "analysis" ? () => setPanel(null) : analyze}
            disabled={analyzing || !content.trim()}
            className="gap-2"
          >
            {analyzing
              ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
              : <BarChart2 className="w-3.5 h-3.5" />
            }
            <span className="hidden sm:inline">Analyze</span>
          </Button>
          {canEdit && (
            <Button
              variant="outline"
              size="sm"
              onClick={save}
              disabled={saving || !content.trim()}
              className="gap-2"
            >
              {saving
                ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                : <Save className="w-3.5 h-3.5" />
              }
              Save
            </Button>
          )}
          {canEdit && (
            <Button size="sm" onClick={generate} className="gap-2">
              {generating
                ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Stop</>
                : <><Sparkles className="w-3.5 h-3.5" /> {content ? "Regenerate" : "Generate"}</>
              }
            </Button>
          )}
          {/* Workflow action buttons */}
          {canSubmitForReview && (
            <Button
              size="sm"
              onClick={submitForReview}
              disabled={actionLoading === "submit"}
              className="gap-2 bg-indigo-600 hover:bg-indigo-700"
            >
              {actionLoading === "submit"
                ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                : <Send className="w-3.5 h-3.5" />
              }
              Submit for Review
            </Button>
          )}
          {canApprove && (
            <Button
              size="sm"
              onClick={approvejd}
              disabled={actionLoading === "approve"}
              className="gap-2 bg-emerald-600 hover:bg-emerald-700"
            >
              {actionLoading === "approve"
                ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                : <ThumbsUp className="w-3.5 h-3.5" />
              }
              Approve JD
            </Button>
          )}
          {canRequestChanges && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => setShowChangesForm(v => !v)}
              className="gap-2 border-amber-300 text-amber-700 hover:bg-amber-50"
            >
              <ThumbsDown className="w-3.5 h-3.5" />
              Request Changes
            </Button>
          )}
        </div>
      </div>

      {/* Request changes form */}
      {showChangesForm && canRequestChanges && (
        <div className="border-b bg-amber-50 px-5 py-3 flex items-start gap-3">
          <textarea
            className="flex-1 rounded-lg border bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 resize-none"
            rows={2}
            placeholder="Describe the changes needed (a comment will be posted automatically)…"
            value={changesNote}
            onChange={e => setChangesNote(e.target.value)}
          />
          <div className="flex flex-col gap-2">
            <Button
              size="sm"
              onClick={requestChanges}
              disabled={actionLoading === "changes"}
              className="gap-2 bg-amber-600 hover:bg-amber-700"
            >
              {actionLoading === "changes"
                ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                : <Send className="w-3.5 h-3.5" />
              }
              Send
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => { setShowChangesForm(false); setChangesNote("") }}
              className="text-xs"
            >
              Cancel
            </Button>
          </div>
        </div>
      )}

      {/* Main content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Editor */}
        <div className={cn(
          "flex flex-col flex-1 min-w-0 overflow-hidden",
          panel !== null && "hidden lg:flex"
        )}>
          {!content && !generating && (
            <div className="flex flex-col items-center justify-center flex-1 p-8 text-center">
              <div className="w-16 h-16 rounded-2xl bg-indigo-50 flex items-center justify-center mb-4">
                <Sparkles className="w-8 h-8 text-indigo-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">Generate a Job Description</h3>
              <p className="text-sm text-muted-foreground mt-2 max-w-sm">
                Claude will write a complete, inclusive, and compliant JD based on your requisition details.
              </p>
              {canEdit && (
                <Button onClick={generate} className="mt-6 gap-2">
                  <Sparkles className="w-4 h-4" /> Generate with AI
                </Button>
              )}
            </div>
          )}
          {(content || generating) && (
            <Textarea
              className="flex-1 resize-none rounded-none border-0 font-mono text-sm p-5 focus-visible:ring-0 leading-relaxed"
              value={content}
              onChange={e => setContent(e.target.value)}
              placeholder={generating ? "Generating…" : ""}
              readOnly={generating || !canEdit}
            />
          )}
          {generating && (
            <div className="flex items-center gap-2 px-5 py-2 border-t bg-indigo-50 text-xs text-indigo-600">
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              Claude is writing your job description…
            </div>
          )}
        </div>

        {/* Side panels */}
        {panel === "analysis" && analysis && (
          <div className="w-full lg:w-96 border-l bg-white overflow-y-auto">
            <div className="flex items-center justify-between px-5 py-3 border-b">
              <h3 className="font-semibold text-sm text-gray-900">AI Analysis</h3>
              <Button variant="ghost" size="sm" onClick={() => setPanel(null)} className="text-xs h-7">
                Close
              </Button>
            </div>
            <div className="p-5 space-y-4">
              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: "Inclusion", score: analysis.inclusionScore },
                  { label: "Readability", score: analysis.readabilityScore },
                  { label: "Compliance", score: analysis.complianceScore },
                ].map(({ label, score }) => (
                  <div key={label} className="text-center rounded-lg border p-3">
                    <p className={cn("text-2xl font-bold", scoreColor(score))}>{score}</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">{label}</p>
                    <p className={cn("text-[10px] font-medium mt-0.5", scoreColor(score))}>
                      {scoreLabel(score)}
                    </p>
                  </div>
                ))}
              </div>
              <p className="text-sm text-gray-700 leading-relaxed">{analysis.summary}</p>
              {analysis.inclusionIssues.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Inclusion Issues
                  </h4>
                  {analysis.inclusionIssues.map((issue, i) => (
                    <div key={i} className={cn(
                      "rounded-lg p-3 space-y-1",
                      issue.severity === "high" ? "bg-red-50" :
                      issue.severity === "medium" ? "bg-amber-50" : "bg-gray-50"
                    )}>
                      <div className="flex items-center gap-1.5">
                        {issue.severity === "high"
                          ? <XCircle className="w-3.5 h-3.5 text-red-500 shrink-0" />
                          : <AlertTriangle className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                        }
                        <p className="text-xs font-medium text-gray-800">{issue.issue}</p>
                      </div>
                      <p className="text-xs text-muted-foreground pl-5">{issue.suggestion}</p>
                    </div>
                  ))}
                </div>
              )}
              {analysis.complianceChecks.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Compliance Checks
                  </h4>
                  {analysis.complianceChecks.map((check, i) => (
                    <div key={i} className="flex items-start gap-2">
                      {check.passed
                        ? <CheckCircle className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                        : <XCircle className="w-3.5 h-3.5 text-red-500 shrink-0 mt-0.5" />
                      }
                      <div>
                        <p className="text-xs font-medium text-gray-800">{check.check}</p>
                        <p className="text-xs text-muted-foreground">{check.note}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {panel === "comments" && (
          <JdCommentsPanel reqId={reqId} onClose={() => setPanel(null)} />
        )}

        {panel === "history" && (
          <JdVersionHistory
            reqId={reqId}
            onRestore={text => { setContent(text); setPanel(null) }}
            onClose={() => setPanel(null)}
          />
        )}
      </div>
    </div>
  )
}
