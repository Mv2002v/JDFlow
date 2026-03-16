"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import {
  Plus, Trash2, GripVertical, Star, Loader2, Pencil, X, Check, ChevronDown, ChevronUp,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

const ROLE_OPTIONS = [
  { value: "DEPARTMENT_HEAD", label: "Department Head" },
  { value: "FINANCE",         label: "Finance" },
  { value: "HR",              label: "HR" },
  { value: "ADMIN",           label: "Admin" },
]

interface ChainStep {
  id?:          string
  stepOrder:    number
  stepLabel:    string
  approverRole: string
  deadlineDays: number
}

interface Chain {
  id:         string
  name:       string
  department: string | null
  isDefault:  boolean
  steps:      ChainStep[]
}

interface Props {
  initialChains: Chain[]
}

export function ApprovalChainsEditor({ initialChains }: Props) {
  const router = useRouter()
  const [chains, setChains]         = useState<Chain[]>(initialChains)
  const [expandedId, setExpandedId] = useState<string | null>(initialChains[0]?.id ?? null)
  const [saving, setSaving]         = useState<string | null>(null)
  const [deleting, setDeleting]     = useState<string | null>(null)
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null)
  const [showNewForm, setShowNewForm] = useState(false)
  const [newName, setNewName]       = useState("")
  const [newDept, setNewDept]       = useState("")
  const [creating, setCreating]     = useState(false)

  function updateChain(id: string, patch: Partial<Chain>) {
    setChains(prev => prev.map(c => c.id === id ? { ...c, ...patch } : c))
  }

  function addStep(chainId: string) {
    setChains(prev => prev.map(c => {
      if (c.id !== chainId) return c
      const nextOrder = c.steps.length
      return {
        ...c,
        steps: [...c.steps, {
          stepOrder:    nextOrder,
          stepLabel:    "New Approval Step",
          approverRole: "HR",
          deadlineDays: 2,
        }],
      }
    }))
  }

  function updateStep(chainId: string, stepIndex: number, patch: Partial<ChainStep>) {
    setChains(prev => prev.map(c => {
      if (c.id !== chainId) return c
      const steps = c.steps.map((s, i) => i === stepIndex ? { ...s, ...patch } : s)
      return { ...c, steps }
    }))
  }

  function removeStep(chainId: string, stepIndex: number) {
    setChains(prev => prev.map(c => {
      if (c.id !== chainId) return c
      const steps = c.steps
        .filter((_, i) => i !== stepIndex)
        .map((s, i) => ({ ...s, stepOrder: i }))
      return { ...c, steps }
    }))
  }

  async function saveChain(chain: Chain) {
    if (chain.steps.length === 0) {
      toast.error("A chain must have at least one step")
      return
    }
    setSaving(chain.id)
    try {
      const res = await fetch(`/api/settings/approval-chains/${chain.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name:       chain.name,
          department: chain.department || null,
          isDefault:  chain.isDefault,
          steps:      chain.steps.map((s, i) => ({ ...s, stepOrder: i })),
        }),
      })
      if (!res.ok) throw new Error(await res.text())
      const updated = await res.json()
      setChains(prev => prev.map(c => c.id === chain.id ? updated : c))
      toast.success("Chain saved")
      router.refresh()
    } catch {
      toast.error("Failed to save chain")
    } finally {
      setSaving(null)
    }
  }

  async function setDefault(chain: Chain) {
    setSaving(chain.id)
    try {
      const res = await fetch(`/api/settings/approval-chains/${chain.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isDefault: true }),
      })
      if (!res.ok) throw new Error()
      setChains(prev => prev.map(c => ({ ...c, isDefault: c.id === chain.id })))
      toast.success(`"${chain.name}" is now the default`)
      router.refresh()
    } catch {
      toast.error("Failed to set default")
    } finally {
      setSaving(null)
    }
  }

  async function deleteChain(id: string) {
    setDeleting(id)
    try {
      const res = await fetch(`/api/settings/approval-chains/${id}`, { method: "DELETE" })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error)
      }
      setChains(prev => prev.filter(c => c.id !== id))
      if (expandedId === id) setExpandedId(null)
      toast.success("Chain deleted")
    } catch (e) {
      toast.error((e as Error).message ?? "Failed to delete")
    } finally {
      setDeleting(null)
      setConfirmDelete(null)
    }
  }

  async function createChain() {
    if (!newName.trim()) return
    setCreating(true)
    try {
      const res = await fetch("/api/settings/approval-chains", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name:       newName,
          department: newDept.trim() || null,
          isDefault:  false,
          steps: [
            { stepOrder: 0, stepLabel: "Department Head Approval", approverRole: "DEPARTMENT_HEAD", deadlineDays: 2 },
            { stepOrder: 1, stepLabel: "HR Sign-off",              approverRole: "HR",              deadlineDays: 2 },
          ],
        }),
      })
      if (!res.ok) throw new Error()
      const created = await res.json()
      setChains(prev => [...prev, created])
      setExpandedId(created.id)
      setNewName("")
      setNewDept("")
      setShowNewForm(false)
      toast.success("Chain created")
    } catch {
      toast.error("Failed to create chain")
    } finally {
      setCreating(false)
    }
  }

  return (
    <div className="space-y-4">
      {/* Chain list */}
      {chains.map(chain => (
        <div key={chain.id} className="rounded-xl border bg-white overflow-hidden">
          {/* Chain header */}
          <div
            className="flex items-center gap-3 px-5 py-4 cursor-pointer hover:bg-gray-50 select-none"
            onClick={() => setExpandedId(expandedId === chain.id ? null : chain.id)}
          >
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-semibold text-gray-900 text-sm">{chain.name}</span>
                {chain.isDefault && (
                  <Badge variant="secondary" className="bg-indigo-100 text-indigo-700 text-xs gap-1">
                    <Star className="w-3 h-3" /> Default
                  </Badge>
                )}
                {chain.department && (
                  <Badge variant="secondary" className="text-xs">{chain.department}</Badge>
                )}
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                {chain.steps.length} step{chain.steps.length !== 1 ? "s" : ""} ·{" "}
                {chain.steps.map(s => s.stepLabel).join(" → ")}
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              {!chain.isDefault && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-xs h-7 gap-1"
                  onClick={e => { e.stopPropagation(); setDefault(chain) }}
                  disabled={saving === chain.id}
                >
                  <Star className="w-3 h-3" /> Set default
                </Button>
              )}
              {confirmDelete === chain.id ? (
                <div className="flex items-center gap-1" onClick={e => e.stopPropagation()}>
                  <span className="text-xs text-red-600 font-medium">Delete?</span>
                  <Button size="sm" className="h-6 bg-red-600 hover:bg-red-700 text-xs px-2"
                    onClick={() => deleteChain(chain.id)} disabled={deleting === chain.id}>
                    {deleting === chain.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />}
                  </Button>
                  <Button size="sm" variant="ghost" className="h-6 text-xs px-2"
                    onClick={() => setConfirmDelete(null)}>
                    <X className="w-3 h-3" />
                  </Button>
                </div>
              ) : (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 w-7 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                  onClick={e => { e.stopPropagation(); setConfirmDelete(chain.id) }}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </Button>
              )}
              {expandedId === chain.id
                ? <ChevronUp className="w-4 h-4 text-gray-400" />
                : <ChevronDown className="w-4 h-4 text-gray-400" />
              }
            </div>
          </div>

          {/* Chain editor (expanded) */}
          {expandedId === chain.id && (
            <div className="border-t px-5 py-4 space-y-4">
              {/* Chain metadata */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-gray-700">Chain Name</label>
                  <input
                    className="w-full rounded-lg border bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    value={chain.name}
                    onChange={e => updateChain(chain.id, { name: e.target.value })}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-gray-700">
                    Department <span className="text-muted-foreground font-normal">(leave blank for all)</span>
                  </label>
                  <input
                    className="w-full rounded-lg border bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    value={chain.department ?? ""}
                    placeholder="e.g. Engineering"
                    onChange={e => updateChain(chain.id, { department: e.target.value || null })}
                  />
                </div>
              </div>

              {/* Steps */}
              <div className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Steps</p>
                {chain.steps.map((step, i) => (
                  <div key={i} className="flex items-center gap-2 rounded-lg border bg-gray-50 p-3">
                    <GripVertical className="w-4 h-4 text-gray-300 shrink-0" />
                    <span className="w-5 h-5 rounded-full bg-indigo-100 text-indigo-700 text-xs font-bold flex items-center justify-center shrink-0">
                      {i + 1}
                    </span>
                    <input
                      className="flex-1 min-w-0 rounded border bg-white px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                      value={step.stepLabel}
                      onChange={e => updateStep(chain.id, i, { stepLabel: e.target.value })}
                      placeholder="Step label"
                    />
                    <select
                      className="rounded border bg-white px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                      value={step.approverRole}
                      onChange={e => updateStep(chain.id, i, { approverRole: e.target.value })}
                    >
                      {ROLE_OPTIONS.map(r => (
                        <option key={r.value} value={r.value}>{r.label}</option>
                      ))}
                    </select>
                    <div className="flex items-center gap-1 shrink-0">
                      <input
                        type="number"
                        min={1}
                        max={30}
                        className="w-14 rounded border bg-white px-2 py-1.5 text-sm text-center focus:outline-none focus:ring-2 focus:ring-indigo-400"
                        value={step.deadlineDays}
                        onChange={e => updateStep(chain.id, i, { deadlineDays: parseInt(e.target.value) || 1 })}
                      />
                      <span className="text-xs text-muted-foreground">days</span>
                    </div>
                    <button
                      onClick={() => removeStep(chain.id, i)}
                      disabled={chain.steps.length <= 1}
                      className="shrink-0 text-red-400 hover:text-red-600 disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => addStep(chain.id)}
                  className="gap-1.5 w-full border-dashed"
                >
                  <Plus className="w-3.5 h-3.5" /> Add Step
                </Button>
              </div>

              {/* Save */}
              <div className="flex justify-end pt-1">
                <Button
                  size="sm"
                  onClick={() => saveChain(chain)}
                  disabled={saving === chain.id}
                  className="gap-2"
                >
                  {saving === chain.id
                    ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Saving…</>
                    : <><Pencil className="w-3.5 h-3.5" /> Save Changes</>
                  }
                </Button>
              </div>
            </div>
          )}
        </div>
      ))}

      {/* New chain form */}
      {showNewForm ? (
        <div className="rounded-xl border bg-white p-5 space-y-4">
          <p className="text-sm font-semibold text-gray-900">New Approval Chain</p>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-medium text-gray-700">Chain Name *</label>
              <input
                className="w-full rounded-lg border bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="e.g. Finance Approval"
                value={newName}
                onChange={e => setNewName(e.target.value)}
                autoFocus
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-gray-700">Department (optional)</label>
              <input
                className="w-full rounded-lg border bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="e.g. Marketing"
                value={newDept}
                onChange={e => setNewDept(e.target.value)}
              />
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            The chain will be created with 2 default steps. You can edit them after creation.
          </p>
          <div className="flex gap-2 justify-end">
            <Button variant="outline" size="sm" onClick={() => { setShowNewForm(false); setNewName(""); setNewDept("") }}>
              Cancel
            </Button>
            <Button size="sm" onClick={createChain} disabled={creating || !newName.trim()} className="gap-2">
              {creating
                ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Creating…</>
                : <><Plus className="w-3.5 h-3.5" /> Create Chain</>
              }
            </Button>
          </div>
        </div>
      ) : (
        <Button
          variant="outline"
          onClick={() => setShowNewForm(true)}
          className={cn("gap-2 w-full border-dashed")}
        >
          <Plus className="w-4 h-4" /> Add Approval Chain
        </Button>
      )}
    </div>
  )
}
