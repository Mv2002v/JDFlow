"use client"

import { Mail, Zap } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog"
import { formatDate } from "@/lib/utils"

const ROLE_LABELS: Record<string, string> = {
  DEPARTMENT_HEAD: "Department Head",
  FINANCE: "Finance Reviewer",
  HR: "HR",
  ADMIN: "Admin",
}

interface Props {
  stepLabel:     string
  approverName:  string
  approverRole:  string
  reqTitle:      string
  reqDepartment: string
  deadlineAt:    string
}

export function EmailPreviewModal({
  stepLabel, approverName, approverRole, reqTitle, reqDepartment, deadlineAt,
}: Props) {
  const roleLabel = ROLE_LABELS[approverRole] ?? approverRole

  return (
    <Dialog>
      <DialogTrigger
        render={
          <Button
            variant="ghost"
            size="sm"
            className="h-6 gap-1 text-xs text-muted-foreground hover:text-indigo-600 px-1.5"
          />
        }
      >
        <Mail className="w-3 h-3" />
        Preview email
      </DialogTrigger>

      <DialogContent className="sm:max-w-lg p-0 overflow-hidden" showCloseButton>
        <DialogHeader className="sr-only">
          <DialogTitle>Email Preview</DialogTitle>
        </DialogHeader>

        {/* Email mock */}
        <div className="bg-gray-100 p-4 rounded-xl">
          {/* Email card */}
          <div className="bg-white rounded-lg overflow-hidden shadow-sm">

            {/* Email header bar */}
            <div className="bg-indigo-600 px-6 py-4 flex items-center gap-2.5">
              <div className="w-6 h-6 bg-white/20 rounded flex items-center justify-center">
                <Zap className="w-3.5 h-3.5 text-white" />
              </div>
              <span className="font-bold text-white text-sm">JDFlow</span>
              <span className="ml-auto text-indigo-200 text-xs">Automated notification</span>
            </div>

            {/* Body */}
            <div className="px-6 py-5 space-y-4">
              <div>
                <p className="text-sm font-semibold text-gray-900">
                  Action Required: {stepLabel}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  To: {approverName} ({roleLabel})
                </p>
              </div>

              <p className="text-sm text-gray-700">Hi {approverName.split(" ")[0]},</p>

              <p className="text-sm text-gray-700 leading-relaxed">
                A new job requisition requires your approval as <strong>{roleLabel}</strong>.
                Please review the details below and take action before the deadline.
              </p>

              {/* Req detail card */}
              <div className="rounded-lg border bg-gray-50 p-4 space-y-2">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-sm font-semibold text-gray-900">{reqTitle}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{reqDepartment}</p>
                  </div>
                  <span className="rounded-full bg-amber-100 text-amber-700 text-xs px-2 py-0.5 font-medium whitespace-nowrap">
                    Pending Review
                  </span>
                </div>
                <div className="border-t pt-2">
                  <p className="text-xs text-muted-foreground">
                    Step: <span className="font-medium text-gray-700">{stepLabel}</span>
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Deadline: <span className="font-medium text-red-600">{formatDate(deadlineAt)}</span>
                  </p>
                </div>
              </div>

              {/* Fake CTA buttons */}
              <div className="flex gap-3">
                <div className="flex-1 rounded-lg bg-emerald-600 px-4 py-2.5 text-white text-sm font-medium text-center cursor-default select-none">
                  ✓ Approve
                </div>
                <div className="flex-1 rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-gray-700 text-sm font-medium text-center cursor-default select-none">
                  View Full Details
                </div>
              </div>

              <p className="text-xs text-muted-foreground text-center leading-relaxed">
                Or log in to JDFlow to review, leave a comment, and take action.
              </p>
            </div>

            {/* Footer */}
            <div className="bg-gray-50 border-t px-6 py-3">
              <p className="text-[10px] text-muted-foreground text-center">
                This is an automated notification from JDFlow · Do not reply to this email
              </p>
            </div>
          </div>

          {/* "From" meta */}
          <div className="mt-2 text-center text-[10px] text-muted-foreground">
            From: notifications@jdflow.app · To: {approverName.toLowerCase().replace(" ", ".")}@company.com
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
