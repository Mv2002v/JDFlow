"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useForm, type Resolver } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { toast } from "sonner"
import { Loader2, ChevronRight, ChevronLeft, Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import { cn } from "@/lib/utils"
import { SalaryBenchmarkPanel } from "@/components/requisitions/salary-benchmark-panel"

const schema = z.object({
  title: z.string().min(3, "Position title is required"),
  department: z.string().min(2, "Department is required"),
  location: z.string().min(2, "Location is required"),
  type: z.enum(["NEW_ROLE", "BACKFILL", "CONTRACTOR", "CONVERSION"]),
  level: z.enum(["JUNIOR", "MID", "SENIOR", "LEAD", "MANAGER", "DIRECTOR", "VP"]),
  remotePolicy: z.enum(["ONSITE", "HYBRID", "REMOTE"]),
  headcount: z.coerce.number().int().min(1).max(50),
  salaryMin: z.coerce.number().optional(),
  salaryMax: z.coerce.number().optional(),
  justification: z.string().min(20, "Please provide a justification (min 20 chars)"),
  hiringManagerNotes: z.string().optional(),
  targetStartDate: z.string().optional(),
})

type FormData = z.infer<typeof schema>

const STEPS = [
  { id: 1, label: "Position Details" },
  { id: 2, label: "Compensation" },
  { id: 3, label: "Justification" },
]

const TYPE_LABELS: Record<string, string> = {
  NEW_ROLE: "New Role",
  BACKFILL: "Backfill",
  CONTRACTOR: "Contractor",
  CONVERSION: "Conversion",
}

export default function NewRequisitionPage() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [submitting, setSubmitting] = useState(false)

  const form = useForm<FormData>({
    resolver: zodResolver(schema) as Resolver<FormData>,
    defaultValues: {
      type: "NEW_ROLE",
      level: "MID",
      remotePolicy: "HYBRID",
      headcount: 1,
    },
  })

  const { register, handleSubmit, setValue, watch, trigger, formState: { errors } } = form

  async function goNext() {
    let fields: (keyof FormData)[] = []
    if (step === 1) fields = ["title", "department", "location", "type", "level", "remotePolicy", "headcount"]
    const ok = await trigger(fields)
    if (ok) setStep(s => s + 1)
  }

  async function onSubmit(data: FormData) {
    setSubmitting(true)
    try {
      const res = await fetch("/api/requisitions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })
      if (!res.ok) throw new Error(await res.text())
      const req = await res.json()
      toast.success("Requisition created!")
      router.push(`/dashboard/requisitions/${req.id}`)
    } catch {
      toast.error("Failed to create requisition")
      setSubmitting(false)
    }
  }

  const typeVal     = watch("type")
  const levelVal    = watch("level")
  const remoteVal   = watch("remotePolicy")
  const locationVal = watch("location")
  const salaryMin   = watch("salaryMin")
  const salaryMax   = watch("salaryMax")

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900">New Requisition</h2>
        <p className="text-sm text-muted-foreground mt-0.5">
          Fill in the details to start the approval workflow.
        </p>
      </div>

      {/* Stepper */}
      <div className="flex items-center gap-2 mb-8">
        {STEPS.map((s, i) => (
          <div key={s.id} className="flex items-center gap-2 flex-1">
            <div
              className={cn(
                "w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 transition-colors",
                step > s.id
                  ? "bg-indigo-600 text-white"
                  : step === s.id
                  ? "bg-indigo-600 text-white ring-4 ring-indigo-100"
                  : "bg-gray-100 text-gray-400"
              )}
            >
              {step > s.id ? <Check className="w-3.5 h-3.5" /> : s.id}
            </div>
            <span className={cn(
              "text-sm font-medium hidden sm:inline",
              step === s.id ? "text-gray-900" : "text-muted-foreground"
            )}>
              {s.label}
            </span>
            {i < STEPS.length - 1 && (
              <div className={cn("flex-1 h-px", step > s.id ? "bg-indigo-600" : "bg-gray-200")} />
            )}
          </div>
        ))}
      </div>

      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="rounded-xl border bg-white p-6 space-y-5">
          {/* Step 1 */}
          {step === 1 && (
            <>
              <div className="space-y-2">
                <Label htmlFor="title">Position Title *</Label>
                <Input id="title" placeholder="e.g. Senior Frontend Engineer" {...register("title")} />
                {errors.title && <p className="text-xs text-destructive">{errors.title.message}</p>}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="department">Department *</Label>
                  <Input id="department" placeholder="e.g. Engineering" {...register("department")} />
                  {errors.department && <p className="text-xs text-destructive">{errors.department.message}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="location">Location *</Label>
                  <Input id="location" placeholder="e.g. San Francisco, CA" {...register("location")} />
                  {errors.location && <p className="text-xs text-destructive">{errors.location.message}</p>}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Req Type *</Label>
                  <Select value={typeVal} onValueChange={v => setValue("type", v as FormData["type"])}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {(["NEW_ROLE", "BACKFILL", "CONTRACTOR", "CONVERSION"] as const).map(t => (
                        <SelectItem key={t} value={t}>{TYPE_LABELS[t]}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Level *</Label>
                  <Select value={levelVal} onValueChange={v => setValue("level", v as FormData["level"])}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {(["JUNIOR", "MID", "SENIOR", "LEAD", "MANAGER", "DIRECTOR", "VP"] as const).map(l => (
                        <SelectItem key={l} value={l}>{l}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Remote Policy *</Label>
                  <Select value={remoteVal} onValueChange={v => setValue("remotePolicy", v as FormData["remotePolicy"])}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {(["ONSITE", "HYBRID", "REMOTE"] as const).map(r => (
                        <SelectItem key={r} value={r}>{r}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="headcount">Headcount *</Label>
                  <Input id="headcount" type="number" min={1} max={50} {...register("headcount")} />
                  {errors.headcount && <p className="text-xs text-destructive">{errors.headcount.message}</p>}
                </div>
              </div>
            </>
          )}

          {/* Step 2 */}
          {step === 2 && (
            <>
              <p className="text-sm text-muted-foreground">
                Provide salary range for pay transparency compliance. Leave blank to discuss later.
              </p>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="salaryMin">Min Salary (USD)</Label>
                  <Input id="salaryMin" type="number" placeholder="e.g. 120000" {...register("salaryMin")} />
                  {errors.salaryMin && <p className="text-xs text-destructive">{errors.salaryMin.message}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="salaryMax">Max Salary (USD)</Label>
                  <Input id="salaryMax" type="number" placeholder="e.g. 160000" {...register("salaryMax")} />
                  {errors.salaryMax && <p className="text-xs text-destructive">{errors.salaryMax.message}</p>}
                </div>
              </div>
              <SalaryBenchmarkPanel
                level={levelVal}
                location={locationVal ?? ""}
                salaryMin={salaryMin ? Number(salaryMin) : undefined}
                salaryMax={salaryMax ? Number(salaryMax) : undefined}
              />
              <div className="space-y-2">
                <Label htmlFor="targetStartDate">Target Start Date</Label>
                <Input id="targetStartDate" type="date" {...register("targetStartDate")} />
              </div>
            </>
          )}

          {/* Step 3 */}
          {step === 3 && (
            <>
              <div className="space-y-2">
                <Label htmlFor="justification">Business Justification *</Label>
                <Textarea
                  id="justification"
                  placeholder="Why is this role needed? What business problem does it solve?"
                  rows={5}
                  {...register("justification")}
                />
                {errors.justification && (
                  <p className="text-xs text-destructive">{errors.justification.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="hiringManagerNotes">Additional Notes (optional)</Label>
                <Textarea
                  id="hiringManagerNotes"
                  placeholder="Any specific requirements, team context, or notes for approvers..."
                  rows={3}
                  {...register("hiringManagerNotes")}
                />
              </div>
            </>
          )}
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between mt-5">
          <Button
            type="button"
            variant="outline"
            onClick={() => setStep(s => s - 1)}
            disabled={step === 1}
            className="gap-2"
          >
            <ChevronLeft className="w-4 h-4" /> Back
          </Button>
          {step < STEPS.length ? (
            <Button type="button" onClick={goNext} className="gap-2">
              Next <ChevronRight className="w-4 h-4" />
            </Button>
          ) : (
            <Button type="submit" disabled={submitting} className="gap-2">
              {submitting ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Saving…</>
              ) : (
                <><Check className="w-4 h-4" /> Save as Draft</>
              )}
            </Button>
          )}
        </div>
      </form>
    </div>
  )
}
