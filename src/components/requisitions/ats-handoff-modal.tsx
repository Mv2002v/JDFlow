"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Loader2, ExternalLink } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog"
import { cn } from "@/lib/utils"

interface Props {
  reqId:    string
  reqTitle: string
}

const ATS_OPTIONS = [
  {
    id: "greenhouse" as const,
    name: "Greenhouse",
    color: "bg-green-600",
    tag: "Most popular",
  },
  {
    id: "lever" as const,
    name: "Lever",
    color: "bg-blue-600",
    tag: null,
  },
  {
    id: "workable" as const,
    name: "Workable",
    color: "bg-purple-600",
    tag: null,
  },
]

type AtsId = typeof ATS_OPTIONS[number]["id"]

export function AtsHandoffModal({ reqId, reqTitle }: Props) {
  const router = useRouter()
  const [open, setOpen]               = useState(false)
  const [selected, setSelected]       = useState<AtsId | null>(null)
  const [posting, setPosting]         = useState(false)

  async function handlePost() {
    if (!selected) return
    setPosting(true)
    await new Promise(r => setTimeout(r, 1500))
    try {
      const res = await fetch(`/api/requisitions/${reqId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "POSTED" }),
      })
      if (!res.ok) throw new Error(await res.text())
      toast.success(`Posted to ${ATS_OPTIONS.find(a => a.id === selected)!.name}!`)
      setOpen(false)
      router.refresh()
    } catch {
      toast.error("Failed to post to ATS")
      setPosting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button variant="default" size="sm" className="gap-2" />
        }
      >
        <ExternalLink className="w-4 h-4" />
        Post to ATS
      </DialogTrigger>

      <DialogContent className="sm:max-w-sm" showCloseButton>
        <DialogHeader>
          <DialogTitle>Post to ATS</DialogTitle>
        </DialogHeader>

        <p className="text-sm text-muted-foreground -mt-1">
          Select your ATS to publish <span className="font-medium text-gray-900">{reqTitle}</span>.
        </p>

        <div className="space-y-2.5 mt-1">
          {ATS_OPTIONS.map(ats => (
            <button
              key={ats.id}
              type="button"
              onClick={() => setSelected(ats.id)}
              className={cn(
                "w-full flex items-center gap-3 rounded-xl border-2 p-3.5 text-left transition-all",
                selected === ats.id
                  ? "border-indigo-500 bg-indigo-50"
                  : "border-transparent bg-gray-50 hover:border-gray-200"
              )}
            >
              <div className={cn("w-9 h-9 rounded-lg flex items-center justify-center shrink-0", ats.color)}>
                <span className="text-white font-bold text-sm">{ats.name[0]}</span>
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-gray-900">{ats.name}</p>
              </div>
              {ats.tag && (
                <span className="text-[10px] font-medium bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
                  {ats.tag}
                </span>
              )}
            </button>
          ))}
        </div>

        <Button
          onClick={handlePost}
          disabled={!selected || posting}
          className="w-full gap-2 mt-1"
        >
          {posting
            ? <><Loader2 className="w-4 h-4 animate-spin" /> Posting…</>
            : "Post Job"
          }
        </Button>
      </DialogContent>
    </Dialog>
  )
}
