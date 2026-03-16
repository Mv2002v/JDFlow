import { prisma } from "@/lib/prisma"

const DAY_MS = 86_400_000

export async function createWorkflow(requisitionId: string) {
  const req = await prisma.requisition.findUnique({
    where: { id: requisitionId },
    select: { revisionCount: true, department: true },
  })
  const revision = (req?.revisionCount ?? 0) + 1
  const now = Date.now()

  // Resolve approval chain: department-specific → default → hardcoded fallback
  const chain = await prisma.approvalChain.findFirst({
    where: { department: req?.department ?? undefined },
    include: { steps: { orderBy: { stepOrder: "asc" } } },
  }) ?? await prisma.approvalChain.findFirst({
    where: { isDefault: true },
    include: { steps: { orderBy: { stepOrder: "asc" } } },
  })

  if (chain && chain.steps.length > 0) {
    // Look up one assignee per unique role needed
    const roles = [...new Set(chain.steps.map(s => s.approverRole))]
    const assignees = await Promise.all(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      roles.map(role => prisma.user.findFirst({ where: { role: role as any } }))
    )
    const roleToUser = Object.fromEntries(
      roles.map((role, i) => [role, assignees[i]])
    )

    const missing = roles.filter(r => !roleToUser[r])
    if (missing.length > 0) {
      throw new Error(`Required approvers not found for roles: ${missing.join(", ")}. Make sure the database is seeded.`)
    }

    // Cumulative deadline: each step adds its deadlineDays to the running total
    let cumulativeDays = 0
    const stepData = chain.steps.map(s => {
      cumulativeDays += s.deadlineDays
      return {
        stepOrder:    s.stepOrder,
        stepLabel:    s.stepLabel,
        approverRole: s.approverRole,
        assigneeId:   roleToUser[s.approverRole]!.id,
        deadlineAt:   new Date(now + cumulativeDays * DAY_MS),
      }
    })

    await prisma.workflowInstance.create({
      data: { requisitionId, revision, steps: { create: stepData } },
    })
  } else {
    // Hardcoded fallback (no chains configured)
    const [deptHead, finance, hr] = await Promise.all([
      prisma.user.findFirst({ where: { role: "DEPARTMENT_HEAD" } }),
      prisma.user.findFirst({ where: { role: "FINANCE" } }),
      prisma.user.findFirst({ where: { role: "HR" } }),
    ])
    if (!deptHead || !finance || !hr) {
      throw new Error("Required approvers not found. Make sure the database is seeded.")
    }
    await prisma.workflowInstance.create({
      data: {
        requisitionId,
        revision,
        steps: {
          create: [
            { stepOrder: 0, stepLabel: "Department Head Approval", approverRole: "DEPARTMENT_HEAD", assigneeId: deptHead.id, deadlineAt: new Date(now + 2 * DAY_MS) },
            { stepOrder: 1, stepLabel: "Finance Review",           approverRole: "FINANCE",         assigneeId: finance.id,  deadlineAt: new Date(now + 4 * DAY_MS) },
            { stepOrder: 2, stepLabel: "HR Final Sign-off",        approverRole: "HR",              assigneeId: hr.id,       deadlineAt: new Date(now + 5 * DAY_MS) },
          ],
        },
      },
    })
  }

  await prisma.requisition.update({
    where: { id: requisitionId },
    data: { status: "PENDING_APPROVAL", revisionCount: revision },
  })
}

export async function resubmitWorkflow(
  requisitionId: string,
  patch: { salaryMin?: number | null; salaryMax?: number | null; justification?: string }
) {
  const req = await prisma.requisition.findUnique({ where: { id: requisitionId } })
  if (!req || req.status !== "CANCELLED") {
    throw new Error("Only CANCELLED requisitions can be resubmitted")
  }

  // Find the latest workflow and which step was rejected
  const latestWorkflow = await prisma.workflowInstance.findFirst({
    where: { requisitionId, isLatest: true },
    include: { steps: { orderBy: { stepOrder: "asc" } } },
  })

  const rejectedStep = latestWorkflow?.steps.find(s => s.status === "REJECTED")

  // Mark all previous workflows as not latest
  await prisma.workflowInstance.updateMany({
    where: { requisitionId },
    data: { isLatest: false },
  })

  // Patch the requisition fields
  await prisma.requisition.update({
    where: { id: requisitionId },
    data: {
      ...(patch.salaryMin !== undefined && { salaryMin: patch.salaryMin }),
      ...(patch.salaryMax !== undefined && { salaryMax: patch.salaryMax }),
      ...(patch.justification && { justification: patch.justification }),
      status: "DRAFT",
    },
  })

  const revision = (req.revisionCount ?? 0) + 1
  const now = Date.now()

  if (rejectedStep && latestWorkflow) {
    // Resume from the rejected step — only recreate steps from that point onwards
    const pendingSteps = latestWorkflow.steps.filter(
      s => s.stepOrder >= rejectedStep.stepOrder
    )

    await prisma.workflowInstance.create({
      data: {
        requisitionId,
        revision,
        currentStep: 0,
        steps: {
          create: pendingSteps.map((s, i) => ({
            stepOrder: i,
            stepLabel: s.stepLabel,
            approverRole: s.approverRole,
            assigneeId: s.assigneeId,
            deadlineAt: new Date(now + (i + 1) * 2 * DAY_MS),
          })),
        },
      },
    })

    await prisma.requisition.update({
      where: { id: requisitionId },
      data: { status: "PENDING_APPROVAL", revisionCount: revision },
    })
  } else {
    // Fallback: no rejection found, restart from scratch
    await createWorkflow(requisitionId)
  }
}

export async function processStepAction(
  stepId: string,
  action: "approve" | "reject",
  comment?: string
) {
  const step = await prisma.approvalStep.findUnique({
    where: { id: stepId },
    include: {
      workflow: {
        include: {
          steps: { orderBy: { stepOrder: "asc" } },
          requisition: { select: { id: true, title: true, createdById: true } },
        },
      },
    },
  })

  if (!step || step.status !== "PENDING") {
    throw new Error("Step is not available for action")
  }

  const now = new Date()
  const { workflow } = step

  await prisma.approvalStep.update({
    where: { id: stepId },
    data: {
      status: action === "approve" ? "APPROVED" : "REJECTED",
      comment: comment ?? null,
      decidedAt: now,
    },
  })

  if (action === "reject") {
    await prisma.workflowInstance.update({
      where: { id: workflow.id },
      data: { status: "REJECTED", completedAt: now },
    })
    await prisma.requisition.update({
      where: { id: workflow.requisitionId },
      data: { status: "CANCELLED" },
    })
    await prisma.notification.create({
      data: {
        userId: workflow.requisition.createdById,
        type: "approval_rejected",
        title: `${workflow.requisition.title} was rejected`,
        body: comment ? `Reason: ${comment}` : "A step in the approval workflow was rejected.",
        actionUrl: `/dashboard/requisitions/${workflow.requisitionId}`,
      },
    })
    return { outcome: "rejected" as const }
  }

  const nextStep = workflow.steps.find(
    (s) => s.stepOrder > step.stepOrder && s.status === "PENDING"
  )

  if (nextStep) {
    await prisma.workflowInstance.update({
      where: { id: workflow.id },
      data: { currentStep: nextStep.stepOrder },
    })
    return { outcome: "advanced" as const }
  }

  await prisma.workflowInstance.update({
    where: { id: workflow.id },
    data: { status: "COMPLETED", completedAt: now },
  })
  await prisma.requisition.update({
    where: { id: workflow.requisitionId },
    data: { status: "APPROVED" },
  })
  await prisma.notification.create({
    data: {
      userId: workflow.requisition.createdById,
      type: "approval_complete",
      title: `${workflow.requisition.title} fully approved`,
      body: "All approvals complete. You can now create the job description.",
      actionUrl: `/dashboard/requisitions/${workflow.requisitionId}`,
    },
  })

  return { outcome: "completed" as const }
}
