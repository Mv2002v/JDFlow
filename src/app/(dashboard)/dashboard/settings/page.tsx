import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import { Settings, GitBranch } from "lucide-react"
import { ApprovalChainsEditor } from "@/components/settings/approval-chains-editor"

export default async function SettingsPage() {
  const session = await auth()
  if (!session?.user) redirect("/login")

  const isPrivileged = ["ADMIN", "HR"].includes(session.user.role)
  if (!isPrivileged) redirect("/dashboard")

  const chains = await prisma.approvalChain.findMany({
    include: { steps: { orderBy: { stepOrder: "asc" } } },
    orderBy: [{ isDefault: "desc" }, { createdAt: "asc" }],
  })

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center">
          <Settings className="w-5 h-5 text-indigo-600" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-gray-900">Settings</h2>
          <p className="text-sm text-muted-foreground">Configure how JDFlow works for your organisation</p>
        </div>
      </div>

      {/* Approval Chains section */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <GitBranch className="w-4 h-4 text-gray-500" />
          <h3 className="font-semibold text-gray-900">Approval Chains</h3>
        </div>
        <p className="text-sm text-muted-foreground -mt-2">
          Define who approves requisitions and in what order. You can create different chains per department.
          The <strong>default</strong> chain applies to departments without a specific chain.
        </p>
        <ApprovalChainsEditor initialChains={chains} />
      </div>
    </div>
  )
}
