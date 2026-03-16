"use client"

import { useState, useEffect } from "react"
import { toast } from "sonner"
import { MessageSquare, CheckCircle, Loader2, Send, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { formatDate } from "@/lib/utils"

interface Comment {
  id: string
  section: string
  anchorText: string | null
  content: string
  resolved: boolean
  createdAt: string
  author: { name: string; role: string }
}

interface Props {
  reqId: string
  onClose: () => void
}

const SECTIONS = ["General", "Title", "Summary", "Responsibilities", "Requirements", "Nice to Have", "Benefits", "About Us"]

export function JdCommentsPanel({ reqId, onClose }: Props) {
  const [comments, setComments] = useState<Comment[]>([])
  const [loading, setLoading] = useState(true)
  const [posting, setPosting] = useState(false)
  const [newContent, setNewContent] = useState("")
  const [newSection, setNewSection] = useState("General")
  const [newAnchorText, setNewAnchorText] = useState("")
  const [showResolved, setShowResolved] = useState(false)

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reqId])

  async function load() {
    setLoading(true)
    try {
      const res = await fetch(`/api/requisitions/${reqId}/jd/comments`)
      if (!res.ok) throw new Error()
      setComments(await res.json())
    } catch {
      toast.error("Failed to load comments")
    } finally {
      setLoading(false)
    }
  }

  async function postComment() {
    if (!newContent.trim()) return
    setPosting(true)
    try {
      const res = await fetch(`/api/requisitions/${reqId}/jd/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          section: newSection,
          anchorText: newAnchorText.trim() || null,
          content: newContent,
        }),
      })
      if (!res.ok) throw new Error()
      const comment = await res.json()
      setComments(prev => [...prev, comment])
      setNewContent("")
      setNewAnchorText("")
    } catch {
      toast.error("Failed to post comment")
    } finally {
      setPosting(false)
    }
  }

  async function toggleResolve(comment: Comment) {
    try {
      const res = await fetch(`/api/jd/comments/${comment.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resolved: !comment.resolved }),
      })
      if (!res.ok) throw new Error()
      const updated = await res.json()
      setComments(prev => prev.map(c => c.id === comment.id ? updated : c))
    } catch {
      toast.error("Failed to update comment")
    }
  }

  const visible = comments.filter(c => showResolved || !c.resolved)
  const unresolvedCount = comments.filter(c => !c.resolved).length

  return (
    <div className="flex flex-col w-full lg:w-80 border-l bg-white overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b shrink-0">
        <div className="flex items-center gap-2">
          <MessageSquare className="w-4 h-4 text-indigo-600" />
          <span className="font-semibold text-sm text-gray-900">Comments</span>
          {unresolvedCount > 0 && (
            <span className="rounded-full bg-indigo-100 text-indigo-700 text-xs px-1.5 py-0.5 font-medium">
              {unresolvedCount}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setShowResolved(v => !v)}
            className="text-xs text-muted-foreground hover:text-gray-700 px-2 py-1 rounded"
          >
            {showResolved ? "Hide resolved" : "Show resolved"}
          </button>
          <button onClick={onClose} className="p-1 rounded hover:bg-gray-100">
            <X className="w-4 h-4 text-gray-500" />
          </button>
        </div>
      </div>

      {/* Comments list */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {loading && (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
          </div>
        )}
        {!loading && visible.length === 0 && (
          <div className="text-center py-8 text-sm text-muted-foreground">
            {comments.length === 0 ? "No comments yet. Add the first one." : "No open comments."}
          </div>
        )}
        {visible.map(c => (
          <div
            key={c.id}
            className={cn(
              "rounded-lg border p-3 space-y-1.5 text-sm",
              c.resolved ? "opacity-50 bg-gray-50" : "bg-white"
            )}
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="font-medium text-gray-900">{c.author.name}</span>
                <span className="rounded bg-gray-100 text-gray-600 text-xs px-1.5 py-0.5">
                  {c.section}
                </span>
                {c.resolved && (
                  <span className="rounded bg-emerald-50 text-emerald-700 text-xs px-1.5 py-0.5 flex items-center gap-1">
                    <CheckCircle className="w-3 h-3" /> Resolved
                  </span>
                )}
              </div>
              <button
                onClick={() => toggleResolve(c)}
                className="shrink-0 text-xs text-muted-foreground hover:text-gray-700"
                title={c.resolved ? "Reopen" : "Mark resolved"}
              >
                <CheckCircle className={cn("w-4 h-4", c.resolved ? "text-emerald-500" : "text-gray-300")} />
              </button>
            </div>
            {c.anchorText && (
              <p className="text-xs text-indigo-700 bg-indigo-50 rounded px-2 py-1 italic">
                &ldquo;{c.anchorText}&rdquo;
              </p>
            )}
            <p className="text-gray-700 leading-relaxed">{c.content}</p>
            <p className="text-xs text-muted-foreground">{formatDate(c.createdAt)}</p>
          </div>
        ))}
      </div>

      {/* New comment form */}
      <div className="border-t p-4 space-y-3 shrink-0">
        <div className="flex gap-2">
          <select
            className="flex-1 rounded-lg border bg-white px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
            value={newSection}
            onChange={e => setNewSection(e.target.value)}
          >
            {SECTIONS.map(s => <option key={s}>{s}</option>)}
          </select>
        </div>
        <input
          type="text"
          placeholder="Quoted text (optional)"
          className="w-full rounded-lg border bg-white px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
          value={newAnchorText}
          onChange={e => setNewAnchorText(e.target.value)}
        />
        <div className="flex gap-2">
          <textarea
            className="flex-1 rounded-lg border bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
            rows={2}
            placeholder="Add a comment…"
            value={newContent}
            onChange={e => setNewContent(e.target.value)}
            onKeyDown={e => {
              if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) postComment()
            }}
          />
          <Button
            size="sm"
            onClick={postComment}
            disabled={posting || !newContent.trim()}
            className="self-end"
          >
            {posting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          </Button>
        </div>
      </div>
    </div>
  )
}
