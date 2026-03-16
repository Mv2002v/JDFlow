"use client"

import { useState, useEffect } from "react"
import { toast } from "sonner"
import { History, Loader2, X, RotateCcw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { formatDate } from "@/lib/utils"

interface JdVersion {
  id: string
  version: number
  rawText: string
  savedAt: string
  savedBy: { name: string; role: string }
}

interface Props {
  reqId: string
  onRestore: (text: string) => void
  onClose: () => void
}

export function JdVersionHistory({ reqId, onRestore, onClose }: Props) {
  const [versions, setVersions] = useState<JdVersion[]>([])
  const [loading, setLoading] = useState(true)
  const [previewId, setPreviewId] = useState<string | null>(null)

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reqId])

  async function load() {
    setLoading(true)
    try {
      const res = await fetch(`/api/requisitions/${reqId}/jd/versions`)
      if (!res.ok) throw new Error()
      setVersions(await res.json())
    } catch {
      toast.error("Failed to load version history")
    } finally {
      setLoading(false)
    }
  }

  const previewVersion = versions.find(v => v.id === previewId)

  return (
    <div className="flex flex-col w-full lg:w-96 border-l bg-white overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b shrink-0">
        <div className="flex items-center gap-2">
          <History className="w-4 h-4 text-indigo-600" />
          <span className="font-semibold text-sm text-gray-900">Version History</span>
        </div>
        <button onClick={onClose} className="p-1 rounded hover:bg-gray-100">
          <X className="w-4 h-4 text-gray-500" />
        </button>
      </div>

      {previewVersion ? (
        /* Preview mode */
        <div className="flex flex-col flex-1 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-2 border-b bg-amber-50 shrink-0">
            <div>
              <p className="text-xs font-medium text-amber-800">
                Previewing v{previewVersion.version}
              </p>
              <p className="text-xs text-amber-700">
                Saved by {previewVersion.savedBy.name} · {formatDate(previewVersion.savedAt)}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => setPreviewId(null)}
                className="text-xs h-7"
              >
                Back
              </Button>
              <Button
                size="sm"
                onClick={() => {
                  onRestore(previewVersion.rawText)
                  setPreviewId(null)
                  onClose()
                  toast.success(`Restored to v${previewVersion.version}`)
                }}
                className="gap-1.5 text-xs h-7"
              >
                <RotateCcw className="w-3 h-3" /> Restore
              </Button>
            </div>
          </div>
          <pre className="flex-1 overflow-y-auto p-4 text-xs font-mono text-gray-700 whitespace-pre-wrap leading-relaxed">
            {previewVersion.rawText}
          </pre>
        </div>
      ) : (
        /* List mode */
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {loading && (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
            </div>
          )}
          {!loading && versions.length === 0 && (
            <div className="text-center py-8 text-sm text-muted-foreground">
              No saved versions yet. Versions are created automatically each time you save.
            </div>
          )}
          {versions.map(v => (
            <button
              key={v.id}
              onClick={() => setPreviewId(v.id)}
              className="w-full text-left rounded-lg border p-3 hover:bg-gray-50 transition-colors space-y-1"
            >
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-gray-900">Version {v.version}</span>
                <span className="text-xs text-muted-foreground">{formatDate(v.savedAt)}</span>
              </div>
              <p className="text-xs text-muted-foreground">
                Saved by {v.savedBy.name} ({v.savedBy.role.replace(/_/g, " ")})
              </p>
              <p className="text-xs text-gray-500 truncate">{v.rawText.slice(0, 80)}…</p>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
